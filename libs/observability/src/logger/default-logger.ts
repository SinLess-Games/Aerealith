// libs/observability/src/logger/default-logger.ts

import {
  LogLevel,
  type LogContext,
  type Logger,
  type LogInput,
  type LogSink,
} from '@aerealith-ai/core';
import { shouldLog } from '@aerealith-ai/utils';

import { LogRecordFactory } from './factories/log-record.factory';

interface LoggerRuntime {
  readonly sink: LogSink;
  readonly factory: LogRecordFactory;
  readonly pendingWrites: Set<Promise<void>>;
  flushPromise?: Promise<void>;
  closePromise?: Promise<void>;
  closing: boolean;
  closed: boolean;
}

/**
 * Default structured logger implementation used by Aerealith services.
 *
 * Logger instances created through `child()` share the same sink lifecycle and
 * record factory while inheriting additional contextual information.
 */
export class DefaultLogger implements Logger {
  private readonly minimumLevel: LogLevel;
  private readonly context: LogContext;
  private readonly runtime: LoggerRuntime;

  public constructor(
    minimumLevel: LogLevel,
    sink: LogSink,
    factory: LogRecordFactory,
    context: LogContext = {},
    runtime?: LoggerRuntime,
  ) {
    this.minimumLevel = minimumLevel;
    this.context = context;
    this.runtime = runtime ?? {
      sink,
      factory,
      pendingWrites: new Set<Promise<void>>(),
      closing: false,
      closed: false,
    };
  }

  public trace(input: LogInput): void {
    this.write(LogLevel.Trace, input);
  }

  public debug(input: LogInput): void {
    this.write(LogLevel.Debug, input);
  }

  public info(input: LogInput): void {
    this.write(LogLevel.Info, input);
  }

  public warn(input: LogInput): void {
    this.write(LogLevel.Warn, input);
  }

  public error(input: LogInput): void {
    this.write(LogLevel.Error, input);
  }

  public fatal(input: LogInput): void {
    this.write(LogLevel.Fatal, input);
  }

  /**
   * Creates a logger that inherits this logger's context.
   *
   * Values supplied by the child override matching parent values.
   */
  public child(context: LogContext): Logger {
    return new DefaultLogger(
      this.minimumLevel,
      this.runtime.sink,
      this.runtime.factory,
      {
        ...this.context,
        ...context,
      },
      this.runtime,
    );
  }

  /**
   * Waits for pending asynchronous writes and flushes the configured sink.
   *
   * Sink failures are contained so logging cannot destabilize the application.
   */
  public flush(): Promise<void> {
    if (this.runtime.closed) {
      return Promise.resolve();
    }

    if (this.runtime.flushPromise !== undefined) {
      return this.runtime.flushPromise;
    }

    const operation = this.performFlush();

    this.runtime.flushPromise = operation.then(
      () => {
        this.runtime.flushPromise = undefined;
      },
      () => {
        this.runtime.flushPromise = undefined;
      },
    );

    return this.runtime.flushPromise;
  }

  /**
   * Flushes outstanding records, closes the shared sink, and prevents further
   * records from being written.
   *
   * Closing any logger in a child hierarchy closes the shared logger runtime.
   */
  public close(): Promise<void> {
    if (this.runtime.closed) {
      return Promise.resolve();
    }

    if (this.runtime.closePromise !== undefined) {
      return this.runtime.closePromise;
    }

    this.runtime.closing = true;

    const operation = this.performClose();

    this.runtime.closePromise = operation.then(
      () => {
        this.runtime.closed = true;
      },
      () => {
        this.runtime.closed = true;
      },
    );

    return this.runtime.closePromise;
  }

  private write(level: LogLevel, input: LogInput): void {
    if (
      this.runtime.closing ||
      this.runtime.closed ||
      !shouldLog(this.minimumLevel, level)
    ) {
      return;
    }

    try {
      const record = this.runtime.factory.create(level, input, this.context);
      const result = this.runtime.sink.write(record);

      if (isPromiseLike(result)) {
        this.trackPendingWrite(Promise.resolve(result).catch(() => undefined));
      }
    } catch {
      // Logging must never fail the originating application operation.
    }
  }

  private trackPendingWrite(operation: Promise<void>): void {
    this.runtime.pendingWrites.add(operation);

    operation.then(
      () => {
        this.runtime.pendingWrites.delete(operation);
      },
      () => {
        this.runtime.pendingWrites.delete(operation);
      },
    );
  }

  private async performFlush(): Promise<void> {
    await this.waitForPendingWrites();

    try {
      await this.runtime.sink.flush();
    } catch {
      // Sink failures are intentionally contained.
    }
  }

  private async performClose(): Promise<void> {
    await this.waitForPendingWrites();

    try {
      await this.runtime.sink.flush();
    } catch {
      // Continue closing even when flushing fails.
    }

    try {
      await this.runtime.sink.close();
    } catch {
      // Closing failures are intentionally contained.
    }
  }

  private async waitForPendingWrites(): Promise<void> {
    while (this.runtime.pendingWrites.size > 0) {
      const pendingWrites = Array.from(this.runtime.pendingWrites);

      await Promise.all(pendingWrites);
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
