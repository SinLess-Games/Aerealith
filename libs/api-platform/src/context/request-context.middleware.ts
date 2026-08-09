import { createMiddleware } from 'hono/factory';

import type { ApiAppOptions } from '../app/api-app-options.interface';
import type { ApiEnv } from '../app/api-env.type';
import type { ApiRequestContext } from './api-request-context.interface';
import { normalizeApiError } from '../errors/normalize-api-error';

const DEFAULT_REQUEST_ID_HEADER = 'x-request-id';
const DEFAULT_CORRELATION_ID_HEADER = 'x-correlation-id';

/** Creates and stores one typed context for the complete request lifecycle. */
export function createRequestContextMiddleware<
  TEnv extends ApiEnv,
  TContext extends ApiRequestContext = TEnv['Variables']['apiContext'],
>(options: ApiAppOptions<TEnv, TContext>) {
  const requestIdHeader =
    options.requestIdHeader?.toLowerCase() ?? DEFAULT_REQUEST_ID_HEADER;
  const correlationIdHeader =
    options.correlationIdHeader?.toLowerCase() ?? DEFAULT_CORRELATION_ID_HEADER;

  return createMiddleware<TEnv>(async (honoContext, next) => {
    const existing = honoContext.get('apiContext') as TContext | undefined;
    if (existing) {
      await next();
      return;
    }

    const startedAt = new Date();
    const requestId =
      cleanHeader(honoContext.req.header(requestIdHeader)) ??
      crypto.randomUUID();
    const correlationId = cleanHeader(
      honoContext.req.header(correlationIdHeader),
    );
    const pathname = new URL(honoContext.req.url).pathname;
    const observation = {
      service: options.serviceName,
      requestId,
      method: honoContext.req.method,
      route: pathname,
      startedAt,
    };
    const traceContext = options.requestObserver?.requestStarted(observation);
    const logger = options.logger.child({
      requestId,
      correlationId,
      traceId: traceContext?.traceId,
      spanId: traceContext?.spanId,
      method: honoContext.req.method,
      route: pathname,
      serviceName: options.serviceName,
    });
    const initial: ApiRequestContext = {
      requestId,
      ...(correlationId ? { correlationId } : {}),
      logger,
      startedAt,
    };
    const principal = await options.resolvePrincipal?.(
      honoContext.req.raw,
      initial,
    );
    const base = {
      ...initial,
      ...(principal === undefined ? {} : { principal }),
    } as ApiRequestContext<NonNullable<TContext['principal']>>;
    const context = options.createContext
      ? await options.createContext(base, honoContext)
      : (base as TContext);

    honoContext.set('apiContext', context);
    context.logger.info({
      event: 'api.request.started',
      message: 'API request started.',
      component: 'api-platform',
      context: { transport: 'http' },
    });

    try {
      await next();
      const outcome = {
        ...observation,
        durationMs: Date.now() - startedAt.getTime(),
        status: honoContext.res.status,
      };
      options.requestObserver?.requestCompleted(outcome);
      context.logger.info({
        event: 'api.request.completed',
        message: 'API request completed.',
        component: 'api-platform',
        durationMs: Date.now() - startedAt.getTime(),
        context: {
          status: honoContext.res.status,
          transport: 'http',
        },
      });
    } catch (error) {
      const normalizedError = normalizeApiError(error);
      options.requestObserver?.requestFailed(
        {
          ...observation,
          durationMs: Date.now() - startedAt.getTime(),
          status: normalizedError.status,
        },
        normalizedError,
      );
      context.logger.error({
        event: 'api.request.failed',
        message: 'API request failed.',
        component: 'api-platform',
        durationMs: Date.now() - startedAt.getTime(),
        error,
        context: { transport: 'http' },
      });
      throw error;
    } finally {
      if (!isWebSocketUpgrade(honoContext.req.raw)) {
        honoContext.header(requestIdHeader, requestId);
        if (correlationId) {
          honoContext.header(correlationIdHeader, correlationId);
        }
      }
    }
  });
}

function cleanHeader(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function isWebSocketUpgrade(request: Request): boolean {
  return request.headers.get('upgrade')?.toLowerCase() === 'websocket';
}
