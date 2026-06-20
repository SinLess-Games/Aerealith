// libs/core/src/errors/aerealith.error.ts

import { CommonErrorCode, HttpErrorCode } from '../enumns';
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
export class AerealithError extends Error {
  readonly code: ErrorCode;

  readonly statusCode: number;

  readonly details: unknown;

  readonly originalCause: unknown;

  constructor(message: string, options: AerealithErrorOptions = {}) {
    super(message);

    this.name = 'AerealithError';
    this.code = options.code ?? CommonErrorCode.INTERNAL_ERROR;
    this.statusCode =
      options.statusCode ?? HttpErrorCode.INTERNAL_SERVER_ERROR.statusCode;
    this.details = options.details;
    this.originalCause = options.cause;
  }

  get isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  get isServerError(): boolean {
    return this.statusCode >= 500;
  }

  hasCode(code: ErrorCode): boolean {
    return this.code === code;
  }

  toJSON(): {
    name: string;
    message: string;
    code: ErrorCode;
    statusCode: number;
    details: unknown;
  } {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}