import { noopLogger, type Logger } from '@aerealith-ai/core';

import type { ApiRequestContext } from '../context/api-request-context.interface';

export interface TestApiContextOptions<TPrincipal> {
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly logger?: Logger;
  readonly principal?: TPrincipal;
  readonly startedAt?: Date;
}

/** Creates deterministic shared context values for transport tests. */
export function createTestApiContext<TPrincipal = unknown>(
  options: TestApiContextOptions<TPrincipal> = {},
): ApiRequestContext<TPrincipal> {
  return {
    requestId: options.requestId ?? 'test-request-id',
    ...(options.correlationId ? { correlationId: options.correlationId } : {}),
    logger: options.logger ?? noopLogger,
    ...(options.principal === undefined
      ? {}
      : { principal: options.principal }),
    startedAt: options.startedAt ?? new Date('2026-01-01T00:00:00.000Z'),
  };
}
