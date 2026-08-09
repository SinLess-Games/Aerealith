import { existsSync } from 'node:fs';

import {
  createApiRequestObserver,
  createNodeLogger,
  createOperationObserver,
  startNodeObservability,
} from '@aerealith-ai/observability';

async function main(): Promise<void> {
  if (existsSync('.env')) process.loadEnvFile('.env');

  const port = parsePort(process.env['AUTH_SERVICE_PORT']);
  const environment = process.env['NODE_ENV'] ?? 'development';
  const logger = createNodeLogger({
    service: 'auth',
    environment: process.env,
    onSinkError(error) {
      console.error('An observability exporter failed.', error);
    },
  });
  const observability = await startNodeObservability({
    service: 'auth',
    environment: process.env,
    onError(error) {
      logger.warn({
        event: 'auth.observability.exporter.failed',
        message: 'An observability exporter failed.',
        component: 'auth-service',
        error,
      });
    },
  });

  /*
   * Load the HTTP server and application only after OpenTelemetry has
   * registered its instrumentation hooks.
   */
  const [{ serve }, { createAuthServiceApp }] = await Promise.all([
    import('@hono/node-server'),
    import('./create-auth-service-app'),
  ]);
  const { LazyAuthApplication } = await import('./auth/lazy-auth-application');
  const application = new LazyAuthApplication();
  const app = createAuthServiceApp({
    application,
    environment,
    logger,
    operationObserver: createOperationObserver(
      'auth',
      observability.meter,
      observability.tracer,
    ),
    requestObserver: createApiRequestObserver(observability.meter),
    readinessCheck: () => application.ready(),
  });
  const server = serve(
    { fetch: app.fetch, port },
    ({ port: listeningPort }) => {
      logger.info({
        event: 'auth.service.started',
        message: 'Auth service is listening.',
        component: 'auth-service',
        context: {
          port: listeningPort,
          telemetryEnabled: observability.enabled,
          profilingEnabled: observability.profilingEnabled,
        },
      });
    },
  );

  let shuttingDown = false;
  const shutdown = (): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    server.close(() => {
      void Promise.allSettled([
        observability.shutdown(),
        logger.close(),
        application.close(),
      ]).finally(() => process.exit(0));
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
