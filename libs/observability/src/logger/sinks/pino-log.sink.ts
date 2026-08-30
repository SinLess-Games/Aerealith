/** Writes finalized log records as production-friendly Pino JSON. */
import { hostname } from 'node:os';

import { LogLevel, type LogRecord, type LogSink } from '@aerealith-ai/core';
import pino = require('pino');

/** Injectable process metadata and destination used primarily by tests. */
export interface PinoLogSinkOptions {
  readonly destination?: pino.DestinationStream;
  readonly hostname?: string;
  readonly pid?: number;
}

/** Production JSON sink backed by Pino. */
export class PinoLogSink implements LogSink {
  public readonly name = 'pino';

  private readonly pinoLogger: pino.Logger;
  private closed = false;

  public constructor(options: PinoLogSinkOptions = {}) {
    this.pinoLogger = pino(
      {
        level: LogLevel.Trace,
        messageKey: 'message',
        // LogRecordFactory already supplies the canonical ISO timestamp.
        timestamp: false,
        base: {
          hostname: options.hostname ?? hostname(),
          pid: options.pid ?? process.pid,
        },
        formatters: {
          level(label) {
            return { level: label };
          },
        },
      },
      options.destination,
    );
  }

  public write(record: LogRecord): void {
    if (this.closed) return;

    // Calling the matching Pino method preserves its numeric severity while
    // the formatter emits the human-readable level label.
    switch (record.level) {
      case LogLevel.Trace:
        this.pinoLogger.trace(record);
        return;
      case LogLevel.Debug:
        this.pinoLogger.debug(record);
        return;
      case LogLevel.Info:
        this.pinoLogger.info(record);
        return;
      case LogLevel.Warn:
        this.pinoLogger.warn(record);
        return;
      case LogLevel.Error:
        this.pinoLogger.error(record);
        return;
      case LogLevel.Fatal:
        this.pinoLogger.fatal(record);
    }
  }

  public flush(): Promise<void> {
    if (this.closed) return Promise.resolve();

    return new Promise((resolve) => {
      this.pinoLogger.flush(() => resolve());
    });
  }

  public async close(): Promise<void> {
    // The destination is owned externally; closing this sink means flushing and
    // refusing future records, not destroying the injected stream.
    if (this.closed) return;
    await this.flush();
    this.closed = true;
  }
}
