// libs/observability/src/logger/config/console-logger-options.interface.ts

/**
 * Configuration for the console logging sink.
 */
export interface ConsoleLoggerOptions {
  /**
   * Enables console log output.
   *
   * @default true
   */
  readonly enabled?: boolean;

  /**
   * Formats console records for human readability instead of emitting compact
   * structured JSON.
   *
   * This setting affects console output only. Loki records remain structured.
   *
   * @default true
   */
  readonly pretty?: boolean;

  /**
   * Enables ANSI colors in pretty console output.
   *
   * The console sink should still disable colors automatically when output is
   * not connected to an interactive terminal or when the `NO_COLOR`
   * environment variable is present.
   *
   * @default true
   */
  readonly color?: boolean;

  /**
   * Includes the log-record timestamp in pretty console output.
   *
   * @default true
   */
  readonly includeTimestamp?: boolean;

  /**
   * Includes the service name in pretty console output.
   *
   * @default true
   */
  readonly includeService?: boolean;

  /**
   * Includes the stable machine-readable event name.
   *
   * @default true
   */
  readonly includeEvent?: boolean;

  /**
   * Includes normalized contextual fields beneath the main log message.
   *
   * @default true
   */
  readonly includeContext?: boolean;

  /**
   * Includes normalized stack traces for error and fatal records.
   *
   * @default true
   */
  readonly includeStackTrace?: boolean;

  /**
   * Sends error and fatal records to stderr while all lower-severity records
   * are sent to stdout.
   *
   * @default true
   */
  readonly useStderrForErrors?: boolean;

  /**
   * Uses UTC when formatting pretty timestamps.
   *
   * When disabled, timestamps are formatted using the host's local timezone.
   *
   * The structured LogRecord timestamp remains an ISO 8601 UTC value.
   *
   * @default false
   */
  readonly useUtc?: boolean;
}
