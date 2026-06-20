// libs/core/src/errors/throw-error.ts

import {
  AerealithError,
  type AerealithErrorOptions,
} from './aerealith.error';

/**
 * Throws a standard Aerealith application error.
 */
export function throwError(
  message: string,
  options: AerealithErrorOptions = {},
): never {
  throw new AerealithError(message, options);
}