// libs/core/src/logger/log-context.type.ts

/**
 * Unprocessed contextual information supplied to a logger.
 *
 * Values may contain runtime-specific or non-serializable data. The concrete
 * logger implementation must normalize and redact this context before placing
 * it into a finalized LogRecord.
 *
 * Examples of values requiring normalization include:
 *
 * - Error
 * - Date
 * - bigint
 * - Map
 * - Set
 * - functions
 * - symbols
 * - circular object references
 */
export type LogContext = Readonly<Record<string, unknown>>;
