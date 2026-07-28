// apps/frontend/src/worker.ts
//
// Cloudflare Worker entry point for the Aerealith frontend.
//
// The Worker serves the Vite-generated frontend assets through Cloudflare
// Workers Assets. React Router client-side routes are handled by the
// single-page-application fallback configured in wrangler.toml.

import {
  FeatureFlag,
  FeatureFlagDefaults,
  resolveFeatureFlags,
  type BooleanFeatureFlagProvider,
} from '@aerealith-ai/core';

export interface FrontendWorkerEnvironment {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  AUTH_SERVICE_URL?: string;
  FLAGSHIP_FLAGS?: BooleanFeatureFlagProvider;
}

const HealthPath = '/__aerealith/health';
const FlagsPath = '/api/V1/flags';
const AuthServicePaths = ['/api/', '/graphql', '/trpc'];

export default {
  async fetch(
    request: Request,
    environment: FrontendWorkerEnvironment,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === HealthPath) {
      return Response.json(
        {
          status: 'ok',
        },
        {
          headers: {
            'cache-control': 'no-store',
          },
        },
      );
    }

    const flagContext = {
      path: url.pathname,
      country: request.headers.get('cf-ipcountry') ?? 'unknown',
    };

    if (url.pathname === FlagsPath) {
      return Response.json(
        await resolveFeatureFlags(environment.FLAGSHIP_FLAGS, flagContext),
        { headers: { 'cache-control': 'private, no-store' } },
      );
    }

    const maintenanceMode = environment.FLAGSHIP_FLAGS
      ? await environment.FLAGSHIP_FLAGS.getBooleanValue(
          FeatureFlag.MaintenanceMode,
          FeatureFlagDefaults[FeatureFlag.MaintenanceMode],
          flagContext,
        )
      : false;
    const observabilityEnabled = environment.FLAGSHIP_FLAGS
      ? await environment.FLAGSHIP_FLAGS.getBooleanValue(
          FeatureFlag.Observability,
          FeatureFlagDefaults[FeatureFlag.Observability],
          flagContext,
        )
      : false;
    if (observabilityEnabled) {
      console.info(
        JSON.stringify({
          event: 'frontend.request',
          method: request.method,
          path: url.pathname,
          country: flagContext.country,
        }),
      );
    }

    if (maintenanceMode && !url.pathname.startsWith('/api/')) {
      return new Response(maintenancePage, {
        status: 503,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
          'retry-after': '300',
        },
      });
    }

    if (AuthServicePaths.some((path) => url.pathname.startsWith(path))) {
      const protectedFlag =
        url.pathname === '/api/V1/auth/sign-up'
          ? FeatureFlag.Registration
          : url.pathname === '/api/V1/auth/login'
            ? FeatureFlag.Authentication
            : undefined;
      if (
        protectedFlag &&
        !(environment.FLAGSHIP_FLAGS
          ? await environment.FLAGSHIP_FLAGS.getBooleanValue(
              protectedFlag,
              FeatureFlagDefaults[protectedFlag],
              flagContext,
            )
          : FeatureFlagDefaults[protectedFlag])
      ) {
        return Response.json(
          {
            ok: false,
            error: {
              code: 'FEATURE_DISABLED',
              message: 'This feature is not currently available.',
            },
          },
          { status: 404 },
        );
      }

      if (!environment.AUTH_SERVICE_URL) {
        return Response.json(
          {
            ok: false,
            error: {
              code: 'AUTH_SERVICE_UNAVAILABLE',
              message: 'The authentication service is not configured.',
            },
          },
          { status: 503 },
        );
      }

      const target = new URL(
        url.pathname + url.search,
        environment.AUTH_SERVICE_URL,
      );
      return fetch(new Request(target, request));
    }

    return environment.ASSETS.fetch(request);
  },
};

const maintenancePage = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Aerealith is upgrading</title></head>
<body style="margin:0;display:grid;min-height:100vh;place-items:center;background:#070b18;color:#eef2ff;font-family:Inter,system-ui,sans-serif">
<main style="max-width:620px;padding:48px;text-align:center">
<div style="color:#a78bfa;font-weight:800;letter-spacing:.2em">AEREALITH</div>
<h1 style="margin:24px 0 16px;font-size:clamp(2rem,7vw,4rem)">We’re making things better.</h1>
<p style="color:#aab4ca;font-size:1.1rem;line-height:1.7">Aerealith is undergoing a brief upgrade. Your data is safe—please check back shortly.</p>
</main></body></html>`;
