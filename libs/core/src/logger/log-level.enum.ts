// libs/core/src/logger/log-level.enum.ts

/**
 * Supported Aerealith log severity levels.
 *
 * The string values follow common structured-logging conventions and can be
 * serialized directly for console, Loki, and OpenTelemetry integrations.
 */
export enum LogLevel {
  Trace = 'trace',
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Fatal = 'fatal',
}
