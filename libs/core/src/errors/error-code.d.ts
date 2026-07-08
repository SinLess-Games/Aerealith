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
export declare const ErrorCodeValues: ErrorCode[];
export declare function isErrorCode(value: unknown): value is ErrorCode;
