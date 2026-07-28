import {
  FeatureFlag,
  FeatureFlagDefaults,
  type BooleanFeatureFlagProvider,
} from '@aerealith-ai/core';

import { createAuthServiceApp } from './create-auth-service-app';

export interface AuthWorkerEnvironment {
  FLAGSHIP_FLAGS?: BooleanFeatureFlagProvider;
}

const app = createAuthServiceApp({ environment: 'production' });
const HealthPaths = new Set(['/health', '/api/V1/services/auth']);
const SignUpPath = '/api/V1/auth/sign-up';

export default {
  async fetch(
    request: Request,
    environment: AuthWorkerEnvironment,
  ): Promise<Response> {
    const url = new URL(request.url);
    if (HealthPaths.has(url.pathname)) return app.fetch(request);

    const context = {
      path: url.pathname,
      country: request.headers.get('cf-ipcountry') ?? 'unknown',
    };
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

    return app.fetch(request);
  },
};

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
