import type { LogRecord } from './logging-types';
import { safeJsonStringify } from './safe-json-stringify';

/** Returns the UTF-8 byte size of a structured log record. */
export function calculateRecordSize(record: LogRecord): number {
  return new TextEncoder().encode(safeJsonStringify(record)).byteLength;
}
