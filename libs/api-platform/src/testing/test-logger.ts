import type { LogContext, LogInput, Logger } from '@aerealith-ai/core';

/** Small recording logger intended for API platform tests. */
export class TestLogger implements Logger {
  readonly records: LogInput[] = [];
  readonly childContexts: LogContext[] = [];

  trace(input: LogInput): void {
    this.records.push(input);
  }
  debug(input: LogInput): void {
    this.records.push(input);
  }
  info(input: LogInput): void {
    this.records.push(input);
  }
  warn(input: LogInput): void {
    this.records.push(input);
  }
  error(input: LogInput): void {
    this.records.push(input);
  }
  fatal(input: LogInput): void {
    this.records.push(input);
  }
  child(context: LogContext): Logger {
    this.childContexts.push(context);
    return this;
  }
  flush(): Promise<void> {
    return Promise.resolve();
  }
  close(): Promise<void> {
    return Promise.resolve();
  }
}
