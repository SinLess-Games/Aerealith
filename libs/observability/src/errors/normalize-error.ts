/** Converts JavaScript's arbitrary thrown values into useful Error objects. */
import { normalizeLogError } from '../logger/utils/normalize-log-error';
import type { NormalizedError } from './error.types';

/** Converts every JavaScript thrown value into a stable, redacted shape. */
export function normalizeError(error: unknown): NormalizedError {
  // normalizeLogError returns undefined only for an undefined thrown value.
  return (
    normalizeLogError(error) ?? {
      name: 'NonErrorThrown',
      message: 'undefined was thrown',
    }
  );
}

/** Preserves real Error objects and safely wraps arbitrary thrown values. */
export function toError(error: unknown): Error {
  // Preserve native errors so stack and cause information remain available.
  if (error instanceof Error) return error;
  const normalized = normalizeError(error);
  const wrapped = new Error(normalized.message);
  wrapped.name = normalized.name;
  return wrapped;
}
