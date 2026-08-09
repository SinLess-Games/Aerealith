import {
  FeatureFlag,
  FeatureFlagDefaults,
  resolveFeatureFlags,
  type BooleanFeatureFlagProvider,
} from '@aerealith-ai/core';

import { createAuthServiceApp } from './create-auth-service-app';
import { InMemoryAuthApplication } from './auth/in-memory-auth-application';
import { LocalAuthorizationService } from './auth/local-authorization.service';
import {
  verifyRegistrationTurnstile,
  type TurnstileEnvironment,
} from './turnstile-verify';

export interface AuthWorkerEnvironment extends TurnstileEnvironment {
  DATABASE_URL: SecretsStoreSecretBinding;
  FLAGSHIP_FLAGS?: BooleanFeatureFlagProvider;
  LOCAL_REGISTRATION_ENABLED?: string;
  RESEND_API_KEY: SecretsStoreSecretBinding;
}

const app = createAuthServiceApp({ environment: 'production' });
const localApp = createAuthServiceApp({
  application: new InMemoryAuthApplication(),
  authorization: new LocalAuthorizationService(),
  environment: 'development',
});
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
        headers: { 'cache-control': 'private, no-store' },
      });
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
        { status: 404 },
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
        { status: 403 },
      );
    }

    return fetchAuthApplication(request, environment);
  },
};

interface SecretsStoreSecretBinding {
  get(): Promise<string>;
}

async function fetchAuthApplication(
  request: Request,
  environment: AuthWorkerEnvironment,
): Promise<Response> {
  if (environment.LOCAL_REGISTRATION_ENABLED === 'true') {
    return localApp.fetch(request);
  }
  let databaseUrl: string;
  let resendApiKey: string;

  try {
    [databaseUrl, resendApiKey] = await Promise.all([
      environment.DATABASE_URL.get(),
      environment.RESEND_API_KEY.get(),
    ]);
  } catch {
    return Response.json(
      {
        error: {
          code: 'SERVICE_CONFIGURATION_UNAVAILABLE',
          message: 'The authentication service is temporarily unavailable.',
        },
      },
      { status: 503 },
    );
  }

  return withProcessEnvironment(
    {
      DATABASE_URL: databaseUrl,
      RESEND_API_KEY: resendApiKey,
    },
    () => app.fetch(request),
  );
}

async function withProcessEnvironment<T>(
  values: Readonly<Record<string, string>>,
  action: () => T | Promise<T>,
): Promise<T> {
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );

  Object.assign(process.env, values);

  try {
    return await action();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}
function evaluate(
  environment: AuthWorkerEnvironment,
  key: keyof typeof FeatureFlagDefaults,
  context: Record<string, string | number | boolean>,
): Promise<boolean> {
  const fallback = FeatureFlagDefaults[key];
  return environment.FLAGSHIP_FLAGS
    ? environment.FLAGSHIP_FLAGS.getBooleanValue(key, fallback, context)
    : Promise.resolve(fallback);
}

function unavailable(code: string, message: string): Response {
  return Response.json(
    { ok: false, error: { code, message } },
    { status: 503, headers: { 'retry-after': '300' } },
  );
}
