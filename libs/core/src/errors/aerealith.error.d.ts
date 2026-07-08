import type { ErrorCode } from './error-code';
export type AerealithErrorOptions = {
  code?: ErrorCode;
  statusCode?: number;
  details?: unknown;
  cause?: unknown;
};
/**
 * Standard application error.
 *
 * Use this error for known application failures.
 * Keep sensitive details out of `message` and `details` when the error may
 * be returned by an API.
 */
export declare class AerealithError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details: unknown;
  readonly originalCause: unknown;
  constructor(message: string, options?: AerealithErrorOptions);
  get isClientError(): boolean;
  get isServerError(): boolean;
  hasCode(code: ErrorCode): boolean;
  toJSON(): {
    name: string;
    message: string;
    code: ErrorCode;
    statusCode: number;
    details: unknown;
  };
}
