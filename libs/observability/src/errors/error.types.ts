/** Shared normalized error and caller-supplied error context types. */
import type { LogError, LogRecordContext } from '@aerealith-ai/core';

/** Serializable error shape safe for structured telemetry backends. */
export interface NormalizedError extends LogError {
  readonly context?: LogRecordContext;
}

/** Arbitrary metadata normalized and redacted before error reporting. */
export interface ErrorContext {
  readonly [key: string]: unknown;
}
