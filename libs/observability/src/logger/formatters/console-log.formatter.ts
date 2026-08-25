// libs/observability/src/logger/formatters/console-log.formatter.ts

import {
  LogLevel,
  type LogError,
  type LogRecord,
  type LogRecordContext,
  type LogValue,
} from '@aerealith-ai/core';

import type { ConsoleLoggerOptions } from '../config/console-logger-options.interface';

const ANSI_RESET = '\u001B[0m';
const ANSI_DIM = '\u001B[2m';
const ANSI_BOLD = '\u001B[1m';
const ANSI_GRAY = '\u001B[90m';
const ANSI_CYAN = '\u001B[36m';
const ANSI_GREEN = '\u001B[32m';
const ANSI_YELLOW = '\u001B[33m';
const ANSI_RED = '\u001B[31m';
const ANSI_BRIGHT_RED = '\u001B[91m';
const ANSI_MAGENTA = '\u001B[35m';

const INDENT = '  ';

/**
 * Fully resolved console formatter configuration.
 */
export interface ResolvedConsoleLoggerOptions {
  readonly pretty: boolean;
  readonly color: boolean;
  readonly includeTimestamp: boolean;
  readonly includeService: boolean;
  readonly includeEvent: boolean;
  readonly includeContext: boolean;
  readonly includeStackTrace: boolean;
  readonly useStderrForErrors: boolean;
  readonly useUtc: boolean;
}

/**
 * Formats canonical log records for console output.
 */
export class ConsoleLogFormatter {
  public readonly options: ResolvedConsoleLoggerOptions;

  public constructor(options: ConsoleLoggerOptions = {}, supportsColor = true) {
    this.options = {
      pretty: options.pretty ?? true,
      color: (options.color ?? true) && supportsColor,
      includeTimestamp: options.includeTimestamp ?? true,
      includeService: options.includeService ?? true,
      includeEvent: options.includeEvent ?? true,
      includeContext: options.includeContext ?? true,
      includeStackTrace: options.includeStackTrace ?? true,
      useStderrForErrors: options.useStderrForErrors ?? true,
      useUtc: options.useUtc ?? false,
    };
  }

  /**
   * Formats a finalized log record for console output.
   */
  public format(record: LogRecord): string {
    if (!this.options.pretty) {
      return JSON.stringify(record);
    }

    const lines = [
      this.formatHeader(record),
      ...this.formatMetadata(record),
      ...this.formatError(record.error),
      ...this.formatContext(record.context),
    ];

    return lines.join('\n');
  }

  private formatHeader(record: LogRecord): string {
    const segments: string[] = [];

    if (this.options.includeTimestamp) {
      segments.push(
        this.colorize(this.formatTimestamp(record.timestamp), ANSI_GRAY),
      );
    }

    segments.push(this.formatLevel(record.level));

    if (this.options.includeService) {
      segments.push(this.colorize(`[${record.service}]`, ANSI_CYAN));
    }

    if (this.options.includeEvent) {
      segments.push(this.colorize(record.event, ANSI_MAGENTA));
    }

    const prefix = segments.join(' ');
    const message = this.colorize(record.message, ANSI_BOLD);

    return `${prefix} ${message}`;
  }

  private formatMetadata(record: LogRecord): readonly string[] {
    const metadata: Record<string, LogValue> = {};

    addOptionalValue(metadata, 'environment', record.environment);
    addOptionalValue(metadata, 'version', record.version);
    addOptionalValue(metadata, 'instanceId', record.instanceId);
    addOptionalValue(metadata, 'component', record.component);
    addOptionalValue(metadata, 'operation', record.operation);
    addOptionalValue(metadata, 'requestId', record.requestId);
    addOptionalValue(metadata, 'correlationId', record.correlationId);
    addOptionalValue(metadata, 'traceId', record.traceId);
    addOptionalValue(metadata, 'spanId', record.spanId);
    addOptionalValue(metadata, 'durationMs', record.durationMs);

    if (Object.keys(metadata).length === 0) {
      return [];
    }

    const values = Object.entries(metadata)
      .map(([key, value]) => `${key}=${formatInlineValue(value)}`)
      .join(' ');

    return [this.colorize(`${INDENT}${values}`, ANSI_DIM)];
  }

  private formatError(error: LogError | undefined): readonly string[] {
    if (error === undefined) {
      return [];
    }

    return this.formatErrorChain(error, 0);
  }

  private formatErrorChain(error: LogError, depth: number): readonly string[] {
    const lines: string[] = [];
    const indentation = INDENT.repeat(depth + 1);
    const code = error.code === undefined ? '' : ` [${error.code}]`;

    lines.push(
      this.colorize(
        `${indentation}${error.name}${code}: ${error.message}`,
        ANSI_RED,
      ),
    );

    if (
      this.options.includeContext &&
      error.context !== undefined &&
      Object.keys(error.context).length > 0
    ) {
      lines.push(
        ...this.formatStructuredValue('errorContext', error.context, depth + 1),
      );
    }

    if (this.options.includeStackTrace && error.stack !== undefined) {
      lines.push(
        ...error.stack
          .split('\n')
          .map((line) =>
            this.colorize(
              `${INDENT.repeat(depth + 2)}${line.trimEnd()}`,
              ANSI_GRAY,
            ),
          ),
      );
    }

    if (error.cause !== undefined) {
      lines.push(
        this.colorize(`${INDENT.repeat(depth + 1)}Caused by:`, ANSI_YELLOW),
        ...this.formatErrorChain(error.cause, depth + 1),
      );
    }

    return lines;
  }

  private formatContext(context: LogRecordContext): readonly string[] {
    if (!this.options.includeContext || Object.keys(context).length === 0) {
      return [];
    }

    return this.formatStructuredValue('context', context, 0);
  }

  private formatStructuredValue(
    label: string,
    value: LogValue,
    depth: number,
  ): readonly string[] {
    const indentation = INDENT.repeat(depth + 1);
    const serialized = JSON.stringify(value, null, 2);

    if (serialized === undefined) {
      return [];
    }

    const serializedLines = serialized.split('\n');

    if (serializedLines.length === 1) {
      return [this.colorize(`${indentation}${label}: ${serialized}`, ANSI_DIM)];
    }

    return [
      this.colorize(`${indentation}${label}:`, ANSI_DIM),
      ...serializedLines.map((line) =>
        this.colorize(`${indentation}${INDENT}${line}`, ANSI_DIM),
      ),
    ];
  }

  private formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }

    if (this.options.useUtc) {
      return date.toISOString();
    }

    return formatLocalTimestamp(date);
  }

  private formatLevel(level: LogLevel): string {
    const label = level.toUpperCase().padEnd(5);

    return this.colorize(label, getLevelColor(level));
  }

  private colorize(value: string, color: string): string {
    if (!this.options.color) {
      return value;
    }

    return `${color}${value}${ANSI_RESET}`;
  }
}

function addOptionalValue(
  target: Record<string, LogValue>,
  key: string,
  value: string | number | undefined,
): void {
  if (value !== undefined) {
    target[key] = value;
  }
}

function formatInlineValue(value: LogValue): string {
  if (typeof value === 'string') {
    return containsWhitespace(value) ? JSON.stringify(value) : value;
  }

  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === null) return 'null';

  return JSON.stringify(value);
}

function containsWhitespace(value: string): boolean {
  return /\s/u.test(value);
}

function getLevelColor(level: LogLevel): string {
  switch (level) {
    case LogLevel.Trace:
      return ANSI_GRAY;

    case LogLevel.Debug:
      return ANSI_CYAN;

    case LogLevel.Info:
      return ANSI_GREEN;

    case LogLevel.Warn:
      return ANSI_YELLOW;

    case LogLevel.Error:
      return ANSI_RED;

    case LogLevel.Fatal:
      return ANSI_BRIGHT_RED;
  }
}

function formatLocalTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1, 2);
  const day = padNumber(date.getDate(), 2);
  const hours = padNumber(date.getHours(), 2);
  const minutes = padNumber(date.getMinutes(), 2);
  const seconds = padNumber(date.getSeconds(), 2);
  const milliseconds = padNumber(date.getMilliseconds(), 3);
  const offset = formatTimezoneOffset(date.getTimezoneOffset());

  return (
    `${year}-${month}-${day}` +
    `T${hours}:${minutes}:${seconds}.${milliseconds}${offset}`
  );
}

function formatTimezoneOffset(offsetMinutes: number): string {
  const sign = offsetMinutes <= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const hours = padNumber(Math.floor(absoluteOffset / 60), 2);
  const minutes = padNumber(absoluteOffset % 60, 2);

  return `${sign}${hours}:${minutes}`;
}

function padNumber(value: number, length: number): string {
  return value.toString().padStart(length, '0');
}
