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
  ASSETS: WorkerFetcher;
  API_WORKER?: WorkerFetcher;
  AUTH_WORKER?: WorkerFetcher;
  API_SERVICE_URL?: string;
  AUTH_SERVICE_URL?: string;
  FLAGSHIP_FLAGS?: BooleanFeatureFlagProvider;
}

interface WorkerFetcher {
  fetch(request: Request): Promise<Response>;
}

/**
 * Derive the feature-flag context directly from the provider interface.
 *
 * The provider accepts the context as an optional argument, but whenever this
 * Worker creates a context it is guaranteed to exist. NonNullable removes the
 * inherited `undefined` from the provider parameter type.
 */
type FeatureFlagContext = NonNullable<
  Parameters<BooleanFeatureFlagProvider['getBooleanValue']>[2]
>;

/**
 * FeatureFlag is a runtime value object rather than a TypeScript type.
 *
 * Deriving the key union from FeatureFlagDefaults guarantees that only
 * recognized feature flags can be passed around inside this Worker.
 */
type FeatureFlagName = keyof typeof FeatureFlagDefaults;

interface RuntimeFeatureFlags {
  readonly maintenanceMode: boolean;
  readonly observabilityEnabled: boolean;
}

const HealthPath = '/__aerealith/health';
const FlagsPath = '/api/V1/flags';
const LegacyApiPath = '/api/v1';
const ApiServicePath = '/api/V1/';

const RegistrationPaths = new Set<string>([
  '/api/V1/auth/sign-up',
  '/api/V1/services/auth/sign-up',
]);

const AuthenticationPaths = new Set<string>([
  '/api/V1/auth/login',
  '/api/V1/auth/sign-in',
  '/api/V1/services/auth/login',
  '/api/V1/services/auth/sign-in',
]);

const AuthApiRoots = [
  '/api/V1/auth',
  '/api/V1/users',
  '/api/V1/account',
  '/api/V1/profile',
  '/api/V1/admin',
  '/api/V1/services/auth',
] as const;

const AuthTransportRoots = ['/graphql', '/trpc'] as const;

export default {
  fetch: handleRequest,
};

/**
 * Main Cloudflare Worker request handler.
 *
 * Routing order:
 *
 * health
 *   ↓
 * legacy API rejection
 *   ↓
 * feature flags
 *   ↓
 * runtime flags
 *   ↓
 * maintenance mode
 *   ↓
 * auth service
 *   ↓
 * API service
 *   ↓
 * frontend assets
 */
async function handleRequest(
  request: Request,
  environment: FrontendWorkerEnvironment,
): Promise<Response> {
  const url = new URL(request.url);

  const directResponse = await handleDirectRoute(request, url, environment);

  if (directResponse) {
    return directResponse;
  }

  const flagContext = createFeatureFlagContext(request, url);

  const runtimeFlags = await resolveRuntimeFeatureFlags(
    environment.FLAGSHIP_FLAGS,
    flagContext,
  );

  logRequestWhenEnabled(
    request,
    url,
    flagContext,
    runtimeFlags.observabilityEnabled,
  );

  if (shouldServeMaintenancePage(url.pathname, runtimeFlags.maintenanceMode)) {
    return createMaintenanceResponse();
  }

  if (isAuthServicePath(url.pathname)) {
    return handleAuthServiceRequest(request, url, environment, flagContext);
  }

  if (url.pathname.startsWith(ApiServicePath)) {
    return proxyService(
      request,
      url,
      environment.API_WORKER,
      environment.API_SERVICE_URL,
      'API_SERVICE_UNAVAILABLE',
      'API',
    );
  }

  return environment.ASSETS.fetch(request);
}

/**
 * Handle routes that can be resolved before runtime feature flags need to be
 * evaluated.
 */
async function handleDirectRoute(
  request: Request,
  url: URL,
  environment: FrontendWorkerEnvironment,
): Promise<Response | undefined> {
  if (url.pathname === HealthPath) {
    return createHealthResponse();
  }

  if (isLegacyApiPath(url.pathname)) {
    return createLegacyApiNotFoundResponse();
  }

  if (url.pathname === FlagsPath) {
    return createFeatureFlagsResponse(request, url, environment);
  }

  return undefined;
}

function createHealthResponse(): Response {
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

function isLegacyApiPath(pathname: string): boolean {
  return pathname === LegacyApiPath || pathname.startsWith(`${LegacyApiPath}/`);
}

function createLegacyApiNotFoundResponse(): Response {
  return Response.json(
    {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested API route was not found.',
      },
    },
    {
      status: 404,
    },
  );
}

async function createFeatureFlagsResponse(
  request: Request,
  url: URL,
  environment: FrontendWorkerEnvironment,
): Promise<Response> {
  const flagContext = createFeatureFlagContext(request, url);

  const flags = await resolveFeatureFlags(
    environment.FLAGSHIP_FLAGS,
    flagContext,
  );

  return Response.json(flags, {
    headers: {
      'cache-control': 'private, no-store',
    },
  });
}

/**
 * Create the feature-flag evaluation context using the exact context contract
 * expected by the core feature-flag provider.
 */
function createFeatureFlagContext(
  request: Request,
  url: URL,
): FeatureFlagContext {
  return {
    path: url.pathname,
    country: request.headers.get('cf-ipcountry') ?? 'unknown',
  };
}

/**
 * Resolve the Worker-level feature flags that influence request handling.
 *
 * These evaluations are independent and therefore can run concurrently.
 */
async function resolveRuntimeFeatureFlags(
  provider: BooleanFeatureFlagProvider | undefined,
  context: FeatureFlagContext,
): Promise<RuntimeFeatureFlags> {
  const [maintenanceMode, observabilityEnabled] = await Promise.all([
    resolveBooleanFeatureFlag(provider, FeatureFlag.MaintenanceMode, context),
    resolveBooleanFeatureFlag(provider, FeatureFlag.Observability, context),
  ]);

  return {
    maintenanceMode,
    observabilityEnabled,
  };
}

/**
 * Resolve one boolean feature flag.
 *
 * When no external provider is configured, the built-in Aerealith default is
 * returned.
 */
async function resolveBooleanFeatureFlag(
  provider: BooleanFeatureFlagProvider | undefined,
  flag: FeatureFlagName,
  context: FeatureFlagContext,
): Promise<boolean> {
  const defaultValue = FeatureFlagDefaults[flag];

  if (!provider) {
    return defaultValue;
  }

  return provider.getBooleanValue(flag, defaultValue, context);
}

function logRequestWhenEnabled(
  request: Request,
  url: URL,
  flagContext: FeatureFlagContext,
  observabilityEnabled: boolean,
): void {
  if (!observabilityEnabled) {
    return;
  }

  console.info(
    JSON.stringify({
      event: 'frontend.request',
      method: request.method,
      path: url.pathname,
      country: getContextString(flagContext, 'country', 'unknown'),
    }),
  );
}

/**
 * Safely read a string value from the extensible feature-flag context.
 */
function getContextString(
  context: FeatureFlagContext,
  key: string,
  fallback: string,
): string {
  const value = context[key];

  if (typeof value === 'string') {
    return value;
  }

  return fallback;
}

function shouldServeMaintenancePage(
  pathname: string,
  maintenanceMode: boolean,
): boolean {
  if (!maintenanceMode) {
    return false;
  }

  return !pathname.startsWith('/api/');
}

function createMaintenanceResponse(): Response {
  return new Response(maintenancePage, {
    status: 503,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'retry-after': '300',
    },
  });
}

/**
 * Route authentication requests to the auth service after applying
 * feature-flag restrictions for protected authentication operations.
 */
async function handleAuthServiceRequest(
  request: Request,
  url: URL,
  environment: FrontendWorkerEnvironment,
  flagContext: FeatureFlagContext,
): Promise<Response> {
  const protectedFlag = getProtectedAuthFeatureFlag(url.pathname);

  if (
    protectedFlag &&
    !(await resolveBooleanFeatureFlag(
      environment.FLAGSHIP_FLAGS,
      protectedFlag,
      flagContext,
    ))
  ) {
    return createFeatureDisabledResponse();
  }

  return proxyService(
    request,
    url,
    environment.AUTH_WORKER,
    environment.AUTH_SERVICE_URL,
    'AUTH_SERVICE_UNAVAILABLE',
    'authentication',
  );
}

/**
 * Determine whether an authentication route is controlled by a feature flag.
 */
function getProtectedAuthFeatureFlag(
  pathname: string,
): FeatureFlagName | undefined {
  if (RegistrationPaths.has(pathname)) {
    return FeatureFlag.Registration;
  }

  if (AuthenticationPaths.has(pathname)) {
    return FeatureFlag.Authentication;
  }

  return undefined;
}

function createFeatureDisabledResponse(): Response {
  return Response.json(
    {
      ok: false,
      error: {
        code: 'FEATURE_DISABLED',
        message: 'This feature is not currently available.',
      },
    },
    {
      status: 404,
    },
  );
}

function isAuthServicePath(pathname: string): boolean {
  return (
    isPathUnderAnyRoot(pathname, AuthApiRoots) ||
    isPathUnderAnyRoot(pathname, AuthTransportRoots)
  );
}

function isPathUnderAnyRoot(
  pathname: string,
  roots: readonly string[],
): boolean {
  return roots.some((root) => isPathUnderRoot(pathname, root));
}

function isPathUnderRoot(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`);
}

/**
 * Proxy a request through either:
 *
 * 1. a Cloudflare service binding, or
 * 2. a configured HTTP service URL.
 *
 * Service bindings take priority because they avoid an unnecessary public
 * network hop.
 */
async function proxyService(
  request: Request,
  url: URL,
  binding: WorkerFetcher | undefined,
  serviceUrl: string | undefined,
  errorCode: string,
  serviceName: string,
): Promise<Response> {
  if (binding) {
    return binding.fetch(request);
  }

  if (serviceUrl) {
    return proxyServiceUrl(request, url, serviceUrl);
  }

  return createServiceUnavailableResponse(errorCode, serviceName);
}

function proxyServiceUrl(
  request: Request,
  url: URL,
  serviceUrl: string,
): Promise<Response> {
  const target = new URL(`${url.pathname}${url.search}`, serviceUrl);

  const proxiedRequest = new Request(target, request);

  return fetch(proxiedRequest);
}

function createServiceUnavailableResponse(
  errorCode: string,
  serviceName: string,
): Response {
  return Response.json(
    {
      ok: false,
      error: {
        code: errorCode,
        message: `The ${serviceName} service is not configured.`,
      },
    },
    {
      status: 503,
    },
  );
}

const maintenancePage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">

    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    >

    <meta
      name="robots"
      content="noindex"
    >

    <title>Aerealith is upgrading</title>
  </head>

  <body
    style="
      margin: 0;
      display: grid;
      min-height: 100vh;
      place-items: center;
      background: #070b18;
      color: #eef2ff;
      font-family: Inter, system-ui, sans-serif;
    "
  >
    <main
      style="
        max-width: 620px;
        padding: 48px;
        text-align: center;
      "
    >
      <div
        style="
          color: #a78bfa;
          font-weight: 800;
          letter-spacing: 0.2em;
        "
      >
        AEREALITH
      </div>

      <h1
        style="
          margin: 24px 0 16px;
          font-size: clamp(2rem, 7vw, 4rem);
        "
      >
        We’re making things better.
      </h1>

      <p
        style="
          color: #aab4ca;
          font-size: 1.1rem;
          line-height: 1.7;
        "
      >
        Aerealith is undergoing a brief upgrade.
        Your data is safe—please check back shortly.
      </p>
    </main>
  </body>
</html>`;
