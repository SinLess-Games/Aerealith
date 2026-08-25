// libs/core/src/logger/noop-logger.ts

import type { Logger } from './logger.interface';

/**
 * Logger implementation that intentionally discards all log events.
 *
 * Useful for:
 * - tests that do not require logging
 * - optional logger dependencies
 * - startup before the configured logger is available
 */
export class NoopLogger implements Logger {
  public trace(): void {
    return undefined;
  }

  public debug(): void {
    return undefined;
  }

  public info(): void {
    return undefined;
  }

  public warn(): void {
    return undefined;
  }

  public error(): void {
    return undefined;
  }

  public fatal(): void {
    return undefined;
  }

  /**
   * Returns the same no-op logger because inherited context has no effect.
   */
  public child(): Logger {
    return this;
  }

  /**
   * No records are buffered, so flushing completes immediately.
   */
  public flush(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * No resources are held, so closing completes immediately.
   */
  public close(): Promise<void> {
    return Promise.resolve();
  }
}

/**
 * Shared immutable no-op logger instance.
 */
export const noopLogger: Logger = Object.freeze(new NoopLogger());
