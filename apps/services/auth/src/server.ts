/**
 * Direct Node entry point for the authentication service.
 *
 * It owns environment loading, observability startup, HTTP security middleware,
 * server lifecycle, and bounded shutdown around the reusable auth application.
 */
import { existsSync } from 'node:fs';

import {
  createApiRequestObserver,
  createOperationObserver,
  initializeObservability,
  resolveObservabilityConfigFromEnv,
  shutdownObservability,
} from '@aerealith-ai/observability';

const DEFAULT_ALLOWED_ORIGINS = [
  // Production
  'https://aerealith.com',
  'https://www.aerealith.com',

  // Local development
  'http://localhost:4200', // NOSONAR -- loopback-only development origin
  'http://127.0.0.1:4200', // NOSONAR -- loopback-only development origin

  // Local Aerealith/SinLess development domain
  'http://local.sinlessgames.com', // NOSONAR -- local development DNS only
  'https://local.sinlessgames.com',
] as const;

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

async function main(): Promise<void> {
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }

  const port = parsePort(process.env['AUTH_SERVICE_PORT']);

  const environment = process.env['NODE_ENV'] ?? 'development';

  const allowedOrigins = getAllowedOrigins(process.env['AUTH_ALLOWED_ORIGINS']);

  /*
   * Normalize the configured value before importing the auth application.
   *
   * If any auth-layer configuration consumes AUTH_ALLOWED_ORIGINS,
   * it will receive the same normalized allowlist used by the server.
   */
  process.env['AUTH_ALLOWED_ORIGINS'] = allowedOrigins.join(',');

  const allowedOriginSet = new Set(allowedOrigins);

  // Initialize the unified runtime before importing instrumented server modules.
  // The returned logger and optional Node meter/tracer share one lifecycle.
  const observability = await initializeObservability(
    resolveObservabilityConfigFromEnv(process.env, {
      service: 'auth',
      version: process.env['OTEL_SERVICE_VERSION'],
      node: { enabled: true, environment: process.env },
    }),
  );
  const logger = observability.logger;

  /*
   * Load Hono, the Node adapter, middleware, and the
   * authentication application only after OpenTelemetry has
   * registered its instrumentation hooks.
   */
  const [
    { serve },
    { Hono },
    { cors },
    { secureHeaders },
    { createAuthServiceApp },
  ] = await Promise.all([
    import('@hono/node-server'),
    import('hono'),
    import('hono/cors'),
    import('hono/secure-headers'),
    import('./create-auth-service-app'),
  ]);

  const { LazyAuthApplication } = await import('./auth/lazy-auth-application');

  const application = new LazyAuthApplication();

  /*
   * Create the actual authentication application.
   */
  const authApp = createAuthServiceApp({
    application,
    environment,
    logger,

    // Request/operation observers require Node SDK handles. If exporters failed
    // to initialize, the auth service still starts without these optional hooks.
    ...(observability.node
      ? {
          operationObserver: createOperationObserver(
            'auth',
            observability.node.meter,
            observability.node.tracer,
          ),
          requestObserver: createApiRequestObserver(observability.node.meter),
        }
      : {}),

    readinessCheck: () => application.ready(),
  });

  /*
   * Create a server-level Hono application.
   *
   * Security middleware is registered here BEFORE
   * mounting the authentication application.
   *
   * This guarantees:
   *
   *   secure headers
   *       ↓
   *   CORS
   *       ↓
   *   trusted-origin validation
   *       ↓
   *   auth application
   */
  const app = new Hono();

  /**
   * Security headers.
   */
  app.use('*', secureHeaders());

  /**
   * CORS
   *
   * Authentication uses browser credentials/cookies,
   * therefore wildcard origins must not be used.
   */
  app.use(
    '*',
    cors({
      origin: (origin) => {
        if (allowedOriginSet.has(origin)) {
          return origin;
        }

        return '';
      },

      allowMethods: [
        'GET',
        'HEAD',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS',
      ],

      allowHeaders: [
        'Accept',
        'Authorization',
        'Content-Type',
        'X-CSRF-Token',
        'X-Request-ID',
      ],

      exposeHeaders: ['Content-Length', 'Content-Type', 'X-Request-ID'],

      /*
       * Required when browser authentication
       * uses cookies.
       */
      credentials: true,

      /*
       * Cache successful preflight responses
       * for 24 hours.
       */
      maxAge: 86_400,
    }),
  );

  /**
   * Trusted-origin protection.
   *
   * This is intentionally separate from CORS.
   *
   * CORS controls whether a browser may read a
   * cross-origin response.
   *
   * This guard prevents state-changing authentication
   * requests from untrusted browser origins.
   */
  app.use('*', async (c, next) => {
    const origin = c.req.header('Origin');

    const method = c.req.method.toUpperCase();

    /*
     * Requests without Origin may originate from
     * internal/server-to-server clients.
     *
     * Authentication/authorization still applies
     * inside the auth application.
     */
    if (!origin) {
      await next();
      return;
    }

    /*
     * Safe/read-only requests are not rejected by
     * the CSRF-style origin guard.
     */
    if (SAFE_METHODS.has(method)) {
      await next();
      return;
    }

    if (!allowedOriginSet.has(origin)) {
      logger.warn({
        event: 'auth.request.origin.rejected',
        message:
          'Authentication request rejected because the origin is not trusted.',
        component: 'auth-service',

        context: {
          method,
          origin,
        },
      });

      return c.json(
        {
          error: 'The request origin is not allowed.',
        },
        403,
      );
    }

    await next();
  });

  /*
   * Mount the authentication application's routes
   * AFTER the server-level middleware.
   */
  app.route('/', authApp);

  logger.info({
    event: 'auth.origins.configured',
    message: 'Trusted authentication origins configured.',
    component: 'auth-service',

    context: {
      allowedOrigins,
    },
  });

  const server = serve(
    {
      fetch: app.fetch,
      port,
    },

    ({ port: listeningPort }) => {
      logger.info({
        event: 'auth.service.started',
        message: 'Auth service is listening.',
        component: 'auth-service',

        context: {
          port: listeningPort,
          telemetryEnabled: observability.node?.enabled ?? false,
          profilingEnabled: observability.node?.profilingEnabled ?? false,
        },
      });
    },
  );

  let shuttingDown = false;

  const shutdown = (): void => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    logger.info({
      event: 'auth.service.stopping',
      message: 'Auth service is shutting down.',
      component: 'auth-service',
    });

    server.close(() => {
      void Promise.allSettled([
        shutdownObservability(),
        application.close(),
      ]).finally(() => {
        process.exit(0);
      });
    });
  };

  process.once('SIGINT', shutdown);

  process.once('SIGTERM', shutdown);
}

void main().catch((error: unknown) => {
  console.error('The auth service failed to start.', error);

  process.exitCode = 1;
});

function parsePort(value: string | undefined): number {
  const port = Number(value ?? '3001');

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('AUTH_SERVICE_PORT must be a valid TCP port.');
  }

  return port;
}

/**
 * Build the trusted-origin allowlist.
 *
 * Additional origins can be configured using:
 *
 * AUTH_ALLOWED_ORIGINS=https://preview.example.com,http://localhost:4300
 */
function getAllowedOrigins(configuredOrigins: string | undefined): string[] {
  const origins = new Set<string>(DEFAULT_ALLOWED_ORIGINS);

  if (!configuredOrigins) {
    return [...origins];
  }

  for (const value of configuredOrigins.split(',')) {
    const origin = normalizeOrigin(value);

    if (origin) {
      origins.add(origin);
    }
  }

  return [...origins];
}

/**
 * Convert configured URLs into canonical origins.
 *
 * Examples:
 *
 * http://localhost:4200/
 * becomes:
 * http://localhost:4200
 *
 * https://aerealith.com/foo
 * becomes:
 * https://aerealith.com
 */
function normalizeOrigin(value: string): string | null {
  const candidate = value.trim();

  if (!candidate) {
    return null;
  }

  try {
    const url = new URL(candidate);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error(`Unsupported origin protocol: ${url.protocol}`);
    }

    return url.origin;
  } catch (error) {
    throw new Error(
      `Invalid origin configured in AUTH_ALLOWED_ORIGINS: ${candidate}`,
      {
        cause: error,
      },
    );
  }
}
