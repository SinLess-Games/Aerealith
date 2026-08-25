// libs/core/src/logger/logger.interface.ts

import type { LogContext } from './log-context.type';
import type { LogInput } from './log-input.interface';

/**
 * Runtime-neutral Aerealith logger contract.
 *
 * Concrete implementations belong in `libs/observability` and may dispatch
 * finalized log records to one or more sinks such as the console or Loki.
 */
export interface Logger {
  /**
   * Records highly detailed diagnostic information.
   *
   * Trace logs are normally disabled outside local development or targeted
   * debugging sessions.
   */
  trace(input: LogInput): void;

  /**
   * Records diagnostic information useful during development and debugging.
   */
  debug(input: LogInput): void;

  /**
   * Records expected application lifecycle events and successful operations.
   */
  info(input: LogInput): void;

  /**
   * Records unexpected or degraded behavior that did not prevent the current
   * operation from completing.
   */
  warn(input: LogInput): void;

  /**
   * Records a failed operation or unexpected error.
   */
  error(input: LogInput): void;

  /**
   * Records a critical failure after which the application or service may no
   * longer be able to operate safely.
   */
  fatal(input: LogInput): void;

  /**
   * Creates a logger that inherits additional contextual information.
   *
   * Child context should be merged with the logger's existing context. Values
   * supplied by the child should override matching parent values.
   *
   * The original logger must not be modified.
   */
  child(context: LogContext): Logger;

  /**
   * Sends all currently buffered log records to their configured sinks.
   *
   * Implementations without buffering may resolve immediately.
   */
  flush(): Promise<void>;

  /**
   * Flushes remaining records and releases logger-owned resources.
   *
   * Calling `close()` more than once should be safe.
   */
  close(): Promise<void>;
}
