// libs/core/src/logger/log-value.type.ts

/**
 * Primitive values that may appear in a finalized structured log record.
 */
export type LogScalar = string | number | boolean | null;

/**
 * Serializable value supported by Aerealith log records.
 *
 * Logger implementations must normalize unsupported runtime values before
 * creating a finalized log record. Examples include:
 *
 * - `undefined` values are omitted
 * - `bigint` values are converted to strings
 * - `Date` values are converted to ISO strings
 * - `Error` values are converted to `LogError`
 * - `Map` values are converted to objects
 * - `Set` values are converted to arrays
 * - functions and symbols are converted to descriptive strings
 * - circular references are replaced with safe marker strings
 */
export type LogValue =
  | LogScalar
  | readonly LogValue[]
  | {
      readonly [key: string]: LogValue;
    };

/**
 * Normalized, redacted, and serializable context attached to a finalized log
 * record.
 */
export type LogRecordContext = Readonly<Record<string, LogValue>>;
