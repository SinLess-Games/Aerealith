import type { LogLevel } from './logging-types';

const PRIORITY: Readonly<Record<LogLevel, number>> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

/** Returns whether a level meets the configured minimum severity. */
export function shouldLog(
  configuredLevel: LogLevel,
  recordLevel: LogLevel,
): boolean {
  return PRIORITY[recordLevel] >= PRIORITY[configuredLevel];
}
