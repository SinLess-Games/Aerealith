/** Implements structured logging with shared child/sink lifecycle state. */

import {
  LogLevel,
  type LogContext,
  type LogInput,
  type LogSink,
} from '@aerealith-ai/core';
import { shouldLog } from '@aerealith-ai/utils';

import { LogRecordFactory } from './factories/log-record.factory';
import type { ObservabilityLogger } from './logger.types';

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
export class DefaultLogger implements ObservabilityLogger {
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
    // Child loggers receive this same runtime so pending writes and close state
    // remain correct across the entire logger hierarchy.
    this.runtime = runtime ?? {
      sink,
      factory,
      pendingWrites: new Set<Promise<void>>(),
      closing: false,
      closed: false,
    };
  }

  public trace(input: LogInput): void;
  public trace(message: string): void;
  public trace(context: LogContext, message: string): void;
  public trace(input: LogInput | LogContext | string, message?: string): void {
    this.write(LogLevel.Trace, normalizeInput(input, message));
  }

  public debug(input: LogInput): void;
  public debug(message: string): void;
  public debug(context: LogContext, message: string): void;
  public debug(input: LogInput | LogContext | string, message?: string): void {
    this.write(LogLevel.Debug, normalizeInput(input, message));
  }

  public info(input: LogInput): void;
  public info(message: string): void;
  public info(context: LogContext, message: string): void;
  public info(input: LogInput | LogContext | string, message?: string): void {
    this.write(LogLevel.Info, normalizeInput(input, message));
  }

  public warn(input: LogInput): void;
  public warn(message: string): void;
  public warn(context: LogContext, message: string): void;
  public warn(input: LogInput | LogContext | string, message?: string): void {
    this.write(LogLevel.Warn, normalizeInput(input, message));
  }

  public error(input: LogInput): void;
  public error(message: string): void;
  public error(context: LogContext, message: string): void;
  public error(input: LogInput | LogContext | string, message?: string): void {
    this.write(LogLevel.Error, normalizeInput(input, message));
  }

  public fatal(input: LogInput): void;
  public fatal(message: string): void;
  public fatal(context: LogContext, message: string): void;
  public fatal(input: LogInput | LogContext | string, message?: string): void {
    this.write(LogLevel.Fatal, normalizeInput(input, message));
  }

  /**
   * Creates a logger that inherits this logger's context.
   *
   * Values supplied by the child override matching parent values.
   */
  public child(context: LogContext): ObservabilityLogger {
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

    // Reuse an in-flight flush to avoid racing the sink from multiple callers.
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

    // Stop accepting new records before waiting for pending writes.
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
        // Track async sinks so flush/close cannot finish before their writes.
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
    // Writes may enqueue more writes while a batch settles, so loop until the
    // shared set is actually empty.
    while (this.runtime.pendingWrites.size > 0) {
      const pendingWrites = Array.from(this.runtime.pendingWrites);

      await Promise.all(pendingWrites);
    }
  }
}

function normalizeInput(
  input: LogInput | LogContext | string,
  message: string | undefined,
): LogInput {
  // Plain messages receive a stable event name for structured search.
  if (typeof input === 'string') {
    return {
      event: 'application.log',
      message: input,
    };
  }

  if (message === undefined && isLogInput(input)) {
    return input as LogInput;
  }

  // Pino-style bindings are promoted into canonical fields when recognized;
  // remaining values stay nested in context.
  const context: Record<string, unknown> = Object.fromEntries(
    Object.entries(input),
  );
  const error = context['err'] ?? context['error'];
  const event = readString(context['event']) ?? 'application.log';
  const component = readString(context['component']);
  const operation = readString(context['operation']);
  const durationMs = readDuration(context['durationMs']);

  delete context['err'];
  delete context['error'];
  delete context['event'];
  delete context['component'];
  delete context['operation'];
  delete context['durationMs'];

  return {
    event,
    message: message ?? 'Application log event',
    ...(component === undefined ? {} : { component }),
    ...(operation === undefined ? {} : { operation }),
    ...(durationMs === undefined ? {} : { durationMs }),
    ...(error === undefined ? {} : { error }),
    context,
  };
}

function isLogInput(value: LogInput | LogContext): boolean {
  return (
    typeof value['event'] === 'string' && typeof value['message'] === 'string'
  );
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function readDuration(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function isPromiseLike(value: unknown): value is PromiseLike<void> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function'
  );
}
