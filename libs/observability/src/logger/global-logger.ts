import type { LogContext, LogInput } from '@aerealith-ai/core';

import type { ObservabilityLogger } from './logger.types';

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

export function setDefaultLogger(nextLogger: ObservabilityLogger): void {
  activeLogger = nextLogger;
}

export function resetDefaultLogger(): void {
  activeLogger = noopObservabilityLogger;
}
