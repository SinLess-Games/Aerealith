import { existsSync } from 'node:fs';

import {
  createNodeLogger,
  startNodeObservability,
} from '@aerealith-ai/observability';

const DEFAULT_PORT = 8788;

async function main(): Promise<void> {
  /*
   * Load local environment variables when running the Node service directly.
   *
   * Production container environments should normally inject configuration
   * through environment variables rather than shipping a .env file.
   */
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }

  const port = parsePort(
    process.env['API_SERVICE_PORT'] ?? process.env['PORT'],
  );

  /*
   * Configure logging before loading the API application.
   */
  const logger = createNodeLogger({
    service: 'api',
    environment: process.env,

    onSinkError(error) {
      console.error('An observability exporter failed.', error);
    },
  });

  /*
   * Start OpenTelemetry / profiling before importing Hono and the API
   * application so supported instrumentation hooks are registered before the
   * instrumented libraries are loaded.
   */
  const observability = await startNodeObservability({
    service: 'api',
    environment: process.env,

    onError(error) {
      logger.warn({
        event: 'api.observability.exporter.failed',
        message: 'An observability exporter failed.',
        component: 'api-service',
        error,
      });
    },
  });

  /*
   * Load the Node adapter and API application only after observability has
   * initialized.
   *
   * This mirrors the authentication service startup pattern.
   */
  const [{ serve }, { createApiServiceApp }] = await Promise.all([
    import('@hono/node-server'),
    import('./main'),
  ]);

  /*
   * The API application's HTTP middleware, CORS policy, health endpoints,
   * waitlist routes, error handling, and Cloudflare-compatible application
   * logic remain defined in createApiServiceApp().
   */
  const app = createApiServiceApp();

  /*
   * Start the Node HTTP server.
   */
  const server = serve(
    {
      fetch: app.fetch,
      port,
    },

    ({ port: listeningPort }) => {
      logger.info({
        event: 'api.service.started',
        message: 'API service is listening.',
        component: 'api-service',

        context: {
          port: listeningPort,
          telemetryEnabled: observability.enabled,
          profilingEnabled: observability.profilingEnabled,
        },
      });
    },
  );

  let shuttingDown = false;

  /*
   * Graceful shutdown.
   *
   * Stop accepting new connections first, then flush observability and logging
   * exporters before allowing the process to terminate.
   */
  const shutdown = (signal: NodeJS.Signals): void => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    logger.info({
      event: 'api.service.stopping',
      message: 'API service is shutting down.',
      component: 'api-service',

      context: {
        signal,
      },
    });

    server.close((error) => {
      if (error) {
        logger.error({
          event: 'api.service.shutdown.failed',
          message: 'The API HTTP server failed to shut down cleanly.',
          component: 'api-service',
          error,
        });

        process.exitCode = 1;
      }

      void Promise.allSettled([
        observability.shutdown(),
        logger.close(),
      ]).finally(() => {
        /*
         * Preserve an existing failure exit code if server.close() failed.
         */
        process.exit(process.exitCode ?? 0);
      });
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));

  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

void main().catch((error: unknown) => {
  console.error('The API service failed to start.', error);

  process.exitCode = 1;
});

function parsePort(value: string | undefined): number {
  const port = Number(value ?? DEFAULT_PORT);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(
      'API_SERVICE_PORT or PORT must be a valid TCP port between 1 and 65535.',
    );
  }

  return port;
}
