// libs/core/src/logger/log-record.interface.ts

import type { LogError } from './log-error.interface';
import type { LogLevel } from './log-level.enum';
import type { LogRecordContext } from './log-value.type';

/**
 * Canonical structured log record produced by Aerealith.
 *
 * A log record must be normalized, redacted, and safe to serialize before it
 * is passed to any console, Loki, or telemetry sink.
 */
export interface LogRecord {
  /**
   * Version of the Aerealith log-record schema.
   */
  readonly schemaVersion: 1;

  /**
   * Unique identifier for this individual log record.
   */
  readonly id: string;

  /**
   * ISO 8601 UTC timestamp indicating when the event occurred.
   *
   * Example: 2026-07-27T18:42:31.482Z
   */
  readonly timestamp: string;

  /**
   * Severity of the event.
   */
  readonly level: LogLevel;

  /**
   * Stable, machine-readable event name.
   *
   * Examples:
   * - auth.sign_in.succeeded
   * - auth.sign_in.failed
   * - database.query.failed
   */
  readonly event: string;

  /**
   * Human-readable description of the event.
   */
  readonly message: string;

  /**
   * Name of the application or service that produced the record.
   *
   * Examples:
   * - auth
   * - frontend
   * - discord
   */
  readonly service: string;

  /**
   * Runtime environment in which the event occurred.
   *
   * Examples:
   * - development
   * - test
   * - staging
   * - production
   */
  readonly environment: string;

  /**
   * Application or release version.
   */
  readonly version?: string;

  /**
   * Identifier for the running application instance.
   *
   * This may be a container ID, pod name, worker ID, or generated runtime ID.
   */
  readonly instanceId?: string;

  /**
   * Logical subsystem that produced the record.
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
   * Identifier for the current HTTP request or message-processing operation.
   */
  readonly requestId?: string;

  /**
   * Identifier used to correlate related activity across multiple operations.
   */
  readonly correlationId?: string;

  /**
   * Distributed tracing identifier.
   */
  readonly traceId?: string;

  /**
   * Distributed tracing span identifier.
   */
  readonly spanId?: string;

  /**
   * Total operation duration in milliseconds.
   */
  readonly durationMs?: number;

  /**
   * Normalized error information associated with the event.
   */
  readonly error?: LogError;

  /**
   * Normalized, redacted, and serializable contextual information.
   *
   * High-cardinality values such as user IDs, request IDs, and resource IDs
   * should remain in this record rather than being promoted to Loki labels.
   */
  readonly context: LogRecordContext;
}
