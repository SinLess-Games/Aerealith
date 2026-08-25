import type { ErrorHandler } from 'hono';

import type { ApiEnv } from '../app/api-env.type';
import type { ApiErrorResponse } from './api-error-response.interface';
import { normalizeApiError } from './normalize-api-error';

/** Produces the standard HTTP error envelope without leaking internal details. */
export function createHonoErrorHandler<
  TEnv extends ApiEnv,
>(): ErrorHandler<TEnv> {
  return (error, honoContext) => {
    const normalized = normalizeApiError(error);
    const context = honoContext.get('apiContext');
    context?.logger.error({
      event: 'api.request.failed',
      message: 'API request handler failed.',
      component: 'api-platform',
      error: normalized.originalCause ?? error,
      context: {
        code: normalized.code,
        status: normalized.status,
      },
    });
    return honoContext.json<ApiErrorResponse>(
      {
        error: {
          code: normalized.code,
          message: normalized.message,
          requestId: context?.requestId ?? 'unknown',
        },
      },
      normalized.status as 400,
    );
  };
}
