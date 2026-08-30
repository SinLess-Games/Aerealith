/** Shared logger contracts independent of any concrete sink implementation. */
import type { LogContext, LogInput } from '@aerealith-ai/core';

/** Supported call shapes for each structured log level. */
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
  /** Returns a logger that adds the supplied bindings to every record. */
  child(context: LogContext): ObservabilityLogger;
  /** Waits for pending asynchronous writes and asks sinks to flush. */
  flush(): Promise<void>;
  /** Flushes and permanently closes the shared sink lifecycle. */
  close(): Promise<void>;
}
