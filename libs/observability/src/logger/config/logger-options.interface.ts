// libs/observability/src/logger/config/logger-options.interface.ts

import type {
  LogContext,
  LogLevel,
  LogRecord,
  LogSink,
} from '@aerealith-ai/core';

import type { ConsoleLoggerOptions } from './console-logger-options.interface';
import type { LokiLoggerOptions } from './loki-logger-options.interface';

/**
 * Information supplied when a configured logging sink fails.
 */
export interface LogSinkError {
  /**
   * Name of the sink that failed.
   */
  readonly sink: string;

  /**
   * Operation that failed.
   */
  readonly operation: 'write' | 'flush' | 'close';

  /**
   * Original failure returned or thrown by the sink.
   */
  readonly error: unknown;

  /**
   * Log record involved in the failed operation, when applicable.
   */
  readonly record?: LogRecord;
}

/**
 * Configuration for an Aerealith logger instance.
 */
export interface LoggerOptions {
  /**
   * Name of the application or service producing log records.
   *
   * Examples:
   * - auth
   * - frontend
   * - discord
   */
  readonly service: string;

  /**
   * Runtime environment in which the logger is operating.
   *
   * Examples:
   * - development
   * - test
   * - staging
   * - production
   */
  readonly environment: string;

  /**
   * Minimum severity emitted by the logger.
   *
   * Records below this level are discarded before normalization and sink
   * dispatch.
   *
   * @default LogLevel.Info
   */
  readonly level?: LogLevel;

  /**
   * Application, package, build, or release version.
   */
  readonly version?: string;

  /**
   * Identifier for the running application instance.
   *
   * This may be a container ID, pod name, process ID, worker ID, or generated
   * runtime identifier.
   */
  readonly instanceId?: string;

  /**
   * Context attached to every record created by this logger.
   *
   * Values are normalized and redacted before being written to any sink.
   */
  readonly context?: LogContext;

  /**
   * Console sink configuration.
   *
   * When omitted, console logging is enabled with its default settings.
   */
  readonly console?: ConsoleLoggerOptions;

  /**
   * Loki sink configuration.
   *
   * Loki export remains disabled unless this configuration is supplied and
   * `enabled` is not set to `false`.
   */
  readonly loki?: LokiLoggerOptions;

  /**
   * Additional sinks that receive finalized log records.
   *
   * These sinks are appended to the configured console and Loki sinks.
   */
  readonly sinks?: readonly LogSink[];

  /**
   * Factory used to generate unique log-record identifiers.
   *
   * Useful for deterministic testing or runtimes where `crypto.randomUUID`
   * is unavailable.
   */
  readonly createId?: () => string;

  /**
   * Clock used to generate record timestamps.
   *
   * Useful for deterministic tests.
   *
   * @default () => new Date()
   */
  readonly now?: () => Date;

  /**
   * Callback invoked when a sink fails.
   *
   * Logging failures must not cause the originating application operation to
   * fail. Implementations should report failures through this callback and
   * continue dispatching records to the remaining sinks.
   */
  readonly onSinkError?: (failure: LogSinkError) => void;
}
