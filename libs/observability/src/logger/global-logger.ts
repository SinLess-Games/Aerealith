/** Exposes a stable logger reference before and after runtime initialization. */
import type { LogContext, LogInput } from '@aerealith-ai/core';

import type { ObservabilityLogger } from './logger.types';

// Imports can safely hold this no-op implementation before bootstrap selects a
// real logger. Child loggers share the same harmless behavior.
const noopMethod = (): void => undefined;

const noopObservabilityLogger: ObservabilityLogger = {
  trace: noopMethod,
  debug: noopMethod,
  info: noopMethod,
  warn: noopMethod,
  error: noopMethod,
  fatal: noopMethod,
  child: () => noopObservabilityLogger,
  flush: () => Promise.resolve(),
  close: () => Promise.resolve(),
};

let activeLogger = noopObservabilityLogger;

/** Dispatches overloaded logger calls to the currently active implementation. */
function invoke(
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal',
  input: LogInput | LogContext | string,
  message?: string,
): void {
  if (typeof input === 'string') {
    activeLogger[level](input);
  } else if (message === undefined) {
    activeLogger[level](input as LogInput);
  } else {
    // Copy bindings into a plain object for logger implementations that retain
    // or normalize structured context.
    activeLogger[level](Object.fromEntries(Object.entries(input)), message);
  }
}

/** Stable proxy to the logger configured by `initializeObservability`. */
export const logger: ObservabilityLogger = {
  trace: (input: LogInput | LogContext | string, message?: string) =>
    invoke('trace', input, message),
  debug: (input: LogInput | LogContext | string, message?: string) =>
    invoke('debug', input, message),
  info: (input: LogInput | LogContext | string, message?: string) =>
    invoke('info', input, message),
  warn: (input: LogInput | LogContext | string, message?: string) =>
    invoke('warn', input, message),
  error: (input: LogInput | LogContext | string, message?: string) =>
    invoke('error', input, message),
  fatal: (input: LogInput | LogContext | string, message?: string) =>
    invoke('fatal', input, message),
  child: (context) => activeLogger.child(context),
  flush: () => activeLogger.flush(),
  close: () => activeLogger.close(),
};

/** Activates the initialized logger without invalidating imported references. */
export function setDefaultLogger(nextLogger: ObservabilityLogger): void {
  activeLogger = nextLogger;
}

/** Restores the safe no-op logger between deterministic unit tests. */
export function resetDefaultLogger(): void {
  activeLogger = noopObservabilityLogger;
}
