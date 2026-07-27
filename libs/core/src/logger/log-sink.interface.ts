// libs/core/src/logger/log-sink.interface.ts

import type { LogRecord } from './log-record.interface';

/**
 * Destination that receives finalized Aerealith log records.
 *
 * Concrete sink implementations belong in `libs/observability`.
 *
 * Examples:
 * - colored console output
 * - Grafana Loki
 * - OpenTelemetry
 * - in-memory test collection
 */
export interface LogSink {
  /**
   * Stable, human-readable identifier for the sink.
   *
   * Examples:
   * - console
   * - loki
   * - memory
   */
  readonly name: string;

  /**
   * Sends a finalized log record to this sink.
   *
   * The record must already be normalized, redacted, and safe to serialize.
   *
   * Implementations may complete synchronously or asynchronously. Remote sink
   * failures must not cause the originating product operation to fail.
   */
  write(record: LogRecord): void | Promise<void>;

  /**
   * Sends all currently buffered records.
   *
   * Implementations without buffering may resolve immediately.
   */
  flush(): Promise<void>;

  /**
   * Flushes remaining records and releases resources owned by the sink.
   *
   * Calling `close()` more than once should be safe.
   */
  close(): Promise<void>;
}
