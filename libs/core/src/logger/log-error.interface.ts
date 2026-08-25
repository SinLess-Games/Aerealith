// libs/core/src/logger/log-error.interface.ts

import type { LogRecordContext } from './log-value.type';

/**
 * Serializable representation of an error attached to a structured log record.
 *
 * Logger implementations must convert arbitrary thrown values into this shape
 * before dispatching the final log record to any sink.
 */
export interface LogError {
  /**
   * Error class or type name.
   *
   * Examples:
   * - Error
   * - TypeError
   * - AerealithError
   */
  readonly name: string;

  /**
   * Human-readable description of the error.
   */
  readonly message: string;

  /**
   * Stable machine-readable error code.
   *
   * Examples:
   * - AUTH_INVALID_CREDENTIALS
   * - SESSION_EXPIRED
   * - DATABASE_UNAVAILABLE
   */
  readonly code?: string;

  /**
   * Internal stack trace.
   *
   * Stack traces must never be exposed through public API responses.
   */
  readonly stack?: string;

  /**
   * Normalized underlying error that caused this error.
   */
  readonly cause?: LogError;

  /**
   * Additional normalized, redacted, and serializable error metadata.
   *
   * This must not contain credentials, tokens, cookies, secrets, private keys,
   * authorization headers, or complete request and response bodies.
   */
  readonly context?: LogRecordContext;
}
