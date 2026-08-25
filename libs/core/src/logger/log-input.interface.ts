// libs/core/src/logger/log-input.interface.ts

import type { LogContext } from './log-context.type';

/**
 * Application-provided input for a logging operation.
 *
 * The concrete logger implementation enriches this input with runtime metadata,
 * normalizes the supplied error and context, redacts sensitive values, and
 * creates the final LogRecord.
 */
export interface LogInput {
  /**
   * Stable, machine-readable event name.
   *
   * Event names should use a predictable dot-separated format.
   *
   * Examples:
   * - auth.sign_in.succeeded
   * - auth.sign_in.failed
   * - auth.session.revoked
   */
  readonly event: string;

  /**
   * Human-readable description of the event.
   *
   * Variable values should be placed in `context` rather than interpolated
   * into the message whenever practical.
   */
  readonly message: string;

  /**
   * Logical component that produced the event.
   *
   * Examples:
   * - session-service
   * - password-authentication
   * - request-middleware
   */
  readonly component?: string;

  /**
   * Logical operation being performed.
   *
   * Examples:
   * - authenticate-user
   * - create-session
   * - revoke-session
   */
  readonly operation?: string;

  /**
   * Total operation duration in milliseconds.
   */
  readonly durationMs?: number;

  /**
   * An Error instance or arbitrary thrown value associated with the event.
   *
   * JavaScript permits any value to be thrown, so logger implementations must
   * not assume this value is an Error instance. It must be normalized into a
   * LogError before being added to the final LogRecord.
   */
  readonly error?: unknown;

  /**
   * Additional structured information associated with the event.
   *
   * This context is unprocessed input. The logger implementation must
   * normalize and redact it before dispatching the final LogRecord.
   */
  readonly context?: LogContext;
}
