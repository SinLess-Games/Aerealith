// libs/core/src/utils/assert-never.ts

import { CommonErrorCode } from '../enumns';
import { throwError } from '../errors';

/**
 * Throws an Aerealith error when an exhaustive branch is missed.
 */
export function assertNever(
  value: never,
  message = 'Unexpected value.',
): never {
  return throwError(message, {
    code: CommonErrorCode.INTERNAL_ERROR,
    details: { value },
  });
}