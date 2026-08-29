import type { LogError, LogRecordContext } from '@aerealith-ai/core';

export interface NormalizedError extends LogError {
  readonly context?: LogRecordContext;
}

export interface ErrorContext {
  readonly [key: string]: unknown;
}
