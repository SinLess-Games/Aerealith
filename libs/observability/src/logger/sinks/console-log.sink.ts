// libs/observability/src/logger/sinks/console-log.sink.ts

import { LogLevel, type LogRecord, type LogSink } from '@aerealith-ai/core';

import type { ConsoleLoggerOptions } from '../config/console-logger-options.interface';
import { ConsoleLogFormatter } from '../formatters/console-log.formatter';

/**
 * Minimal console contract used by the console sink.
 *
 * Keeping this contract small allows tests to provide an in-memory writer
 * without replacing the global console object.
 */
export interface ConsoleWriter {
  log(message: string): void;
  error(message: string): void;
}

/**
 * Writes finalized log records to the runtime console.
 */
export class ConsoleLogSink implements LogSink {
  public readonly name = 'console';

  private readonly enabled: boolean;
  private readonly formatter: ConsoleLogFormatter;
  private readonly writer: ConsoleWriter;
  private closed = false;

  public constructor(
    options: ConsoleLoggerOptions = {},
    writer: ConsoleWriter = createDefaultConsoleWriter(),
    supportsColor = detectColorSupport(),
  ) {
    this.enabled = options.enabled ?? true;
    this.writer = writer;
    this.formatter = new ConsoleLogFormatter(options, supportsColor);
  }

  /**
   * Formats and writes a finalized log record.
   *
   * Error and fatal records are sent to stderr when configured. All other
   * records are sent to stdout.
   */
  public write(record: LogRecord): void {
    if (!this.enabled || this.closed) {
      return;
    }

    const message = this.formatter.format(record);

    if (
      this.formatter.options.useStderrForErrors &&
      isErrorLevel(record.level)
    ) {
      this.writer.error(message);

      return;
    }

    this.writer.log(message);
  }

  /**
   * Console output is not buffered, so flushing completes immediately.
   */
  public flush(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Prevents this sink from accepting additional records.
   *
   * Calling this method more than once is safe.
   */
  public close(): Promise<void> {
    this.closed = true;

    return Promise.resolve();
  }
}

function isErrorLevel(level: LogLevel): boolean {
  return level === LogLevel.Error || level === LogLevel.Fatal;
}

function createDefaultConsoleWriter(): ConsoleWriter {
  const runtimeConsole = globalThis.console;

  return {
    log(message: string): void {
      runtimeConsole.log(message);
    },

    error(message: string): void {
      runtimeConsole.error(message);
    },
  };
}

function detectColorSupport(): boolean {
  const runtimeProcess = getRuntimeProcess();

  if (runtimeProcess === undefined) {
    return false;
  }

  if (runtimeProcess.env['NO_COLOR'] !== undefined) {
    return false;
  }

  if (runtimeProcess.env['FORCE_COLOR'] !== undefined) {
    return runtimeProcess.env['FORCE_COLOR'] !== '0';
  }

  return runtimeProcess.stdout?.isTTY === true;
}

interface RuntimeProcess {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly stdout?: {
    readonly isTTY?: boolean;
  };
}

function getRuntimeProcess(): RuntimeProcess | undefined {
  const runtimeGlobal = globalThis as typeof globalThis & {
    readonly process?: RuntimeProcess;
  };

  return runtimeGlobal.process;
}
