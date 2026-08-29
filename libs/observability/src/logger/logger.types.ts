import type { LogContext, LogInput } from '@aerealith-ai/core';

export interface ObservabilityLogMethod {
  (input: LogInput): void;
  (message: string): void;
  (context: LogContext, message: string): void;
}

/**
 * Canonical logger contract.
 *
 * It preserves the repository's structured `LogInput` API while also
 * supporting Pino-style `(bindings, message)` calls for Node services.
 */
export interface ObservabilityLogger {
  readonly trace: ObservabilityLogMethod;
  readonly debug: ObservabilityLogMethod;
  readonly info: ObservabilityLogMethod;
  readonly warn: ObservabilityLogMethod;
  readonly error: ObservabilityLogMethod;
  readonly fatal: ObservabilityLogMethod;
  child(context: LogContext): ObservabilityLogger;
  flush(): Promise<void>;
  close(): Promise<void>;
}
