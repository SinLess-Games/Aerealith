import {
  FeatureFlag,
  FeatureFlagDefaults,
  resolveFeatureFlags,
} from '@aerealith-ai/core';

import { LazyAuthApplication } from './auth/lazy-auth-application';
import { LazyAuthorizationService } from './auth/lazy-authorization.service';
import {
  classifySensitiveAuthOperations,
  CloudflareRequestRateLimiter,
} from './auth/request-rate-limiter';
import { createAuthServiceApp } from './create-auth-service-app';
import {
  verifyRegistrationTurnstile,
  type TurnstileEnvironment,
} from './turnstile-verify';

type SecretBinding =
  | string
  | {
      get(): Promise<string>;
    };

export type AuthWorkerEnvironment = Omit<
  Cloudflare.Env,
  'DATABASE_URL' | 'RESEND_API_KEY'
> &
  TurnstileEnvironment & {
    DATABASE_URL: SecretBinding;
    RESEND_API_KEY?: SecretBinding;
    LOCAL_REGISTRATION_ENABLED?: string;
  };

const HealthPaths = new Set(['/health', '/api/V1/services/auth']);

const FlagsPath = '/api/V1/flags';
const SignUpPath = '/api/V1/auth/sign-up';

export default {
  async fetch(
    request: Request,
    environment: AuthWorkerEnvironment,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (HealthPaths.has(url.pathname)) {
      return fetchAuthApplication(request, environment);
    }

    const context = {
      path: url.pathname,
      country: request.headers.get('cf-ipcountry') ?? 'unknown',
    };

    if (url.pathname === FlagsPath) {
      const flags = await resolveFeatureFlags(
        environment.FLAGSHIP_FLAGS,
        context,
      );

      if (environment.LOCAL_REGISTRATION_ENABLED === 'true') {
        flags[FeatureFlag.Registration] = true;
      }

      return Response.json(flags, {
        headers: {
          'cache-control': 'private, no-store',
        },
      });
    }

    const sensitiveOperations = await classifySensitiveAuthOperations(request);
    const rateLimiter = new CloudflareRequestRateLimiter(
      environment.AUTH_SENSITIVE_RATE_LIMIT,
    );
    for (const operation of sensitiveOperations) {
      if (!(await rateLimiter.allow(request, operation))) {
        return unavailable(
          'RATE_LIMITED',
          'Too many requests. Please try again later.',
          429,
        );
      }
    }

    const maintenanceMode = await evaluate(
      environment,
      FeatureFlag.MaintenanceMode,
      context,
    );

    const authenticationEnabled = await evaluate(
      environment,
      FeatureFlag.Authentication,
      context,
    );

    const observabilityEnabled = await evaluate(
      environment,
      FeatureFlag.Observability,
      context,
    );

    if (observabilityEnabled) {
      console.info(
        JSON.stringify({
          event: 'auth.request',
          method: request.method,
          path: url.pathname,
          country: context.country,
        }),
      );
    }

    if (maintenanceMode) {
      return unavailable(
        'MAINTENANCE_MODE',
        'Authentication is temporarily unavailable during maintenance.',
      );
    }

    if (!authenticationEnabled) {
      return unavailable(
        'AUTHENTICATION_DISABLED',
        'Authentication is not currently available.',
      );
    }

    if (
      url.pathname === SignUpPath &&
      environment.LOCAL_REGISTRATION_ENABLED !== 'true' &&
      !(await evaluate(environment, FeatureFlag.Registration, context))
    ) {
      return Response.json(
        {
          ok: false,
          error: {
            code: 'REGISTRATION_DISABLED',
            message: 'Registration is not currently available.',
          },
        },
        {
          status: 404,
        },
      );
    }

    if (
      url.pathname === SignUpPath &&
      !(await verifyRegistrationTurnstile(request, environment))
    ) {
      return Response.json(
        {
          ok: false,
          error: {
            code: 'BOT_VERIFICATION_FAILED',
            message: 'Bot verification failed. Please try again.',
          },
        },
        {
          status: 403,
        },
      );
    }

    return fetchAuthApplication(request, environment);
  },
};

/**
 * Route every environment to the persistent authentication application.
 * LOCAL_REGISTRATION_ENABLED changes signup availability only; it must never
 * replace database-backed login or sessions with process-local state.
 */
async function fetchAuthApplication(
  request: Request,
  environment: AuthWorkerEnvironment,
): Promise<Response> {
  return fetchPersistentAuthApplication(request, environment);
}

/**
 * Persistent authentication application used when local registration mode
 * is disabled.
 */
async function fetchPersistentAuthApplication(
  request: Request,
  environment: AuthWorkerEnvironment,
): Promise<Response> {
  let databaseUrl: string;

  try {
    databaseUrl = await resolveSecret(environment.DATABASE_URL);
  } catch {
    return Response.json(
      {
        error: {
          code: 'SERVICE_CONFIGURATION_UNAVAILABLE',
          message: 'The authentication service is temporarily unavailable.',
        },
      },
      {
        status: 503,
      },
    );
  }
  const resendApiKey = await resolveOptionalSecret(environment.RESEND_API_KEY);

  const application = new LazyAuthApplication({
    databaseUrl,
    resendApiKey,
    frontendUrl: environment.FRONTEND_URL,
  });

  const authorization = new LazyAuthorizationService(databaseUrl);

  const app = createAuthServiceApp({
    application,
    authorization,

    environment: environment.NODE_ENV,

    allowedOrigins: [environment.FRONTEND_URL],
  });

  try {
    return await app.fetch(request);
  } finally {
    await Promise.all([application.close(), authorization.close()]);
  }
}

async function resolveSecret(
  binding: SecretBinding | undefined,
): Promise<string> {
  const value = typeof binding === 'string' ? binding : await binding?.get();

  if (!value?.trim()) {
    throw new Error('A required authentication secret is unavailable.');
  }

  return value;
}

async function resolveOptionalSecret(
  binding: SecretBinding | undefined,
): Promise<string | undefined> {
  try {
    const value = typeof binding === 'string' ? binding : await binding?.get();
    return value?.trim() || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Evaluate a boolean feature flag using Flagship when configured,
 * otherwise fall back to Aerealith's built-in default.
 */
function evaluate(
  environment: AuthWorkerEnvironment,
  key: keyof typeof FeatureFlagDefaults,
  context: Record<string, string | number | boolean>,
): Promise<boolean> {
  const fallback = FeatureFlagDefaults[key];

  if (!environment.FLAGSHIP_FLAGS) {
    return Promise.resolve(fallback);
  }

  return environment.FLAGSHIP_FLAGS.getBooleanValue(key, fallback, context);
}

/**
 * Create a standard temporary-unavailability/error response.
 */
function unavailable(code: string, message: string, status = 503): Response {
  return Response.json(
    {
      ok: false,
      error: {
        code,
        message,
      },
    },
    {
      status,

      headers: {
        'retry-after': status === 429 ? '60' : '300',
      },
    },
  );
}
