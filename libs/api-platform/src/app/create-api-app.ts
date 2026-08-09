import { HttpStatus } from '@aerealith-ai/core';
import { Hono } from 'hono';

import { createRequestContextMiddleware } from '../context/request-context.middleware';
import { ApiErrorCode } from '../errors/api-error-code.enum';
import type { ApiErrorResponse } from '../errors/api-error-response.interface';
import { createHonoErrorHandler } from '../errors/hono-error-handler';
import type { ApiAppOptions } from './api-app-options.interface';
import type { ApiEnv } from './api-env.type';

/** Creates a Hono application with shared context, lifecycle, and errors. */
export function createApiApp<TEnv extends ApiEnv>(
  options: ApiAppOptions<TEnv>,
): Hono<TEnv> {
  const app = options.basePath
    ? new Hono<TEnv>().basePath(options.basePath)
    : new Hono<TEnv>();
  app.use('*', createRequestContextMiddleware(options));

  for (const registration of options.middleware ?? []) {
    app.use('*', async (context, next) => {
      const pathname = new URL(context.req.url).pathname;
      if (registration.exclude?.some((prefix) => pathname.startsWith(prefix))) {
        await next();
        return;
      }
      return registration.handler(context, next);
    });
  }

  if (options.health) {
    const health = typeof options.health === 'object' ? options.health : {};
    app.get(health.path ?? '/health', (context) =>
      context.json({ service: options.serviceName, status: 'ok' }),
    );
    app.get(health.readinessPath ?? '/ready', async (context) => {
      try {
        await health.checkReadiness?.();
        return context.json({ service: options.serviceName, status: 'ready' });
      } catch {
        return context.json(
          { service: options.serviceName, status: 'not_ready' },
          503,
        );
      }
    });
  }

  app.notFound((context) => {
    const requestContext = context.get('apiContext');
    return context.json<ApiErrorResponse>(
      {
        error: {
          code: ApiErrorCode.NotFound,
          message: 'Resource not found.',
          requestId: requestContext.requestId,
        },
      },
      HttpStatus.NotFound,
    );
  });
  app.onError(createHonoErrorHandler<TEnv>());

  return app;
}
