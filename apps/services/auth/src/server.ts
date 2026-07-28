import { serve } from '@hono/node-server';
import { existsSync } from 'node:fs';

import { createLogger } from '@aerealith-ai/observability';

import { createAuthServiceApp } from './create-auth-service-app';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const port = parsePort(process.env['AUTH_SERVICE_PORT']);
const environment = process.env['NODE_ENV'] ?? 'development';
const logger = createLogger({ service: 'auth', environment });
const app = createAuthServiceApp({ environment, logger });

const server = serve({ fetch: app.fetch, port }, ({ port: listeningPort }) => {
  logger.info({
    event: 'auth.service.started',
    message: 'Auth service is listening.',
    component: 'auth-service',
    context: { port: listeningPort },
  });
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close(() => {
      void logger.close().finally(() => process.exit(0));
    });
  });
}

function parsePort(value: string | undefined): number {
  const port = Number(value ?? '3001');
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('AUTH_SERVICE_PORT must be a valid TCP port.');
  }
  return port;
}
