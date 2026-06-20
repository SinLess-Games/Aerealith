// libs/core/src/errors/error-code.ts

import {
  AuthErrorCode,
  CommonErrorCode,
  DatabaseErrorCode,
  UserErrorCode,
} from '../enumns/system/errors';
import type {
  AuthErrorCode as AuthErrorCodeValue,
  CommonErrorCode as CommonErrorCodeValue,
  DatabaseErrorCode as DatabaseErrorCodeValue,
  UserErrorCode as UserErrorCodeValue,
} from '../enumns/system/errors';

/**
 * All application-level error codes.
 *
 * HTTP status codes are intentionally excluded.
 * Use `HttpErrorCode` separately for HTTP transport status information.
 */
export type ErrorCode =
  | AuthErrorCodeValue
  | CommonErrorCodeValue
  | DatabaseErrorCodeValue
  | UserErrorCodeValue;

export const ErrorCodeValues = [
  ...Object.values(AuthErrorCode),
  ...Object.values(CommonErrorCode),
  ...Object.values(DatabaseErrorCode),
  ...Object.values(UserErrorCode),
] as ErrorCode[];

export function isErrorCode(value: unknown): value is ErrorCode {
  return (
    typeof value === 'string' &&
    ErrorCodeValues.includes(value as ErrorCode)
  );
}