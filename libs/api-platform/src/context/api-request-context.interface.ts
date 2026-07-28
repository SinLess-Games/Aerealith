import type { Logger } from '@aerealith-ai/core';

/** Shared context available to every transport for one request or connection. */
export interface ApiRequestContext<TPrincipal = unknown> {
  readonly requestId: string;
  readonly correlationId?: string;
  readonly logger: Logger;
  readonly principal?: TPrincipal;
  readonly startedAt: Date;
}
