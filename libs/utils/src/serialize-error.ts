export interface SerializedError {
  readonly name: string;
  readonly message: string;
  readonly code?: string;
  readonly stack?: string;
  readonly cause?: SerializedError;
  readonly value?: SerializableValue;
}

import type { SerializableValue } from './logging-types';
import { normalizeRecord } from './normalize-record';

/** Converts thrown values into a stable structured-error representation. */
export function serializeError(error: unknown): SerializedError {
  if (!(error instanceof Error)) {
    return {
      name: 'NonErrorThrown',
      message:
        typeof error === 'string' ? error : 'A non-Error value was thrown',
      value: normalizeRecord({ value: error })['value'],
    };
  }

  const code =
    'code' in error && typeof error.code === 'string' ? error.code : undefined;
  const cause =
    error.cause === undefined ? undefined : serializeError(error.cause);

  return {
    name: error.name,
    message: error.message,
    ...(code ? { code } : {}),
    ...(error.stack ? { stack: error.stack } : {}),
    ...(cause ? { cause } : {}),
  };
}
