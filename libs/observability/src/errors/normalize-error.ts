import { normalizeLogError } from '../logger/utils/normalize-log-error';
import type { NormalizedError } from './error.types';

/** Converts every JavaScript thrown value into a stable, redacted shape. */
export function normalizeError(error: unknown): NormalizedError {
  return (
    normalizeLogError(error) ?? {
      name: 'NonErrorThrown',
      message: 'undefined was thrown',
    }
  );
}

/** Preserves real Error objects and safely wraps arbitrary thrown values. */
export function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  const normalized = normalizeError(error);
  const wrapped = new Error(normalized.message);
  wrapped.name = normalized.name;
  return wrapped;
}
