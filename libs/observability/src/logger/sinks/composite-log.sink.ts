// libs/observability/src/logger/sinks/composite-log.sink.ts

import type { LogRecord, LogSink } from '@aerealith-ai/core';

import type {
  LogSinkError,
  LoggerOptions,
} from '../config/logger-options.interface';

type LogSinkErrorHandler = NonNullable<LoggerOptions['onSinkError']>;

/**
 * Dispatches finalized log records to multiple independent sinks.
 *
 * A failure in one sink does not prevent the remaining sinks from receiving
 * the record. Sink failures are reported through the optional error handler
 * and are never allowed to fail the originating application operation.
 */
export class CompositeLogSink implements LogSink {
  public readonly name = 'composite';

  private readonly sinks: readonly LogSink[];
  private readonly onSinkError: LogSinkErrorHandler | undefined;
  private readonly pendingWrites = new Set<Promise<void>>();

  private flushPromise: Promise<void> | undefined;
  private closePromise: Promise<void> | undefined;
  private closing = false;
  private closed = false;

  public constructor(
    sinks: readonly LogSink[],
    onSinkError?: LogSinkErrorHandler,
  ) {
    this.sinks = [...sinks];
    this.onSinkError = onSinkError;
  }

  /**
   * Sends a finalized record to every configured sink.
   *
   * Synchronous and asynchronous sink failures are isolated and reported
   * without interrupting dispatch to the remaining sinks.
   */
  public write(record: LogRecord): void {
    if (this.closing || this.closed) {
      return;
    }

    for (const sink of this.sinks) {
      this.writeToSink(sink, record);
    }
  }

  /**
   * Waits for pending asynchronous writes and flushes every configured sink.
   *
   * Failures are reported individually and do not prevent other sinks from
   * being flushed.
   */
  public flush(): Promise<void> {
    if (this.closed) {
      return Promise.resolve();
    }

    if (this.flushPromise !== undefined) {
      return this.flushPromise;
    }

    const operation = this.performFlush();

    this.flushPromise = operation.then(
      () => {
        this.flushPromise = undefined;
      },
      () => {
        this.flushPromise = undefined;
      },
    );

    return this.flushPromise;
  }

  /**
   * Flushes and closes every configured sink.
   *
   * Calling this method more than once is safe.
   */
  public close(): Promise<void> {
    if (this.closed) {
      return Promise.resolve();
    }

    if (this.closePromise !== undefined) {
      return this.closePromise;
    }

    this.closing = true;

    const operation = this.performClose();

    this.closePromise = operation.then(
      () => {
        this.closed = true;
      },
      () => {
        this.closed = true;
      },
    );

    return this.closePromise;
  }

  private writeToSink(sink: LogSink, record: LogRecord): void {
    try {
      const result = sink.write(record);

      if (isPromiseLike(result)) {
        this.trackPendingWrite(
          Promise.resolve(result).catch((error: unknown) => {
            this.reportSinkError({
              sink: sink.name,
              operation: 'write',
              error,
              record,
            });
          }),
        );
      }
    } catch (error) {
      this.reportSinkError({
        sink: sink.name,
        operation: 'write',
        error,
        record,
      });
    }
  }

  private trackPendingWrite(operation: Promise<void>): void {
    this.pendingWrites.add(operation);

    operation.then(
      () => {
        this.pendingWrites.delete(operation);
      },
      () => {
        this.pendingWrites.delete(operation);
      },
    );
  }

  private async performFlush(): Promise<void> {
    await this.waitForPendingWrites();

    await Promise.all(
      this.sinks.map(async (sink) => {
        try {
          await sink.flush();
        } catch (error) {
          this.reportSinkError({
            sink: sink.name,
            operation: 'flush',
            error,
          });
        }
      }),
    );
  }

  private async performClose(): Promise<void> {
    await this.waitForPendingWrites();

    await Promise.all(
      this.sinks.map(async (sink) => {
        try {
          await sink.flush();
        } catch (error) {
          this.reportSinkError({
            sink: sink.name,
            operation: 'flush',
            error,
          });
        }
      }),
    );

    await Promise.all(
      this.sinks.map(async (sink) => {
        try {
          await sink.close();
        } catch (error) {
          this.reportSinkError({
            sink: sink.name,
            operation: 'close',
            error,
          });
        }
      }),
    );
  }

  private async waitForPendingWrites(): Promise<void> {
    while (this.pendingWrites.size > 0) {
      const pendingWrites = Array.from(this.pendingWrites);

      await Promise.all(pendingWrites);
    }
  }

  private reportSinkError(failure: LogSinkError): void {
    if (this.onSinkError === undefined) {
      return;
    }

    try {
      this.onSinkError(failure);
    } catch {
      // Error handlers must never destabilize application logging.
    }
  }
}

function isPromiseLike(value: unknown): value is PromiseLike<void> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function'
  );
}
