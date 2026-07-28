import {
  AerealithError,
  AuthErrorCode,
  HttpStatus,
  type AuthErrorCode as AuthErrorCodeValue,
} from '@aerealith-ai/core';

import type { AuthFailureReason } from '../enums/auth-failure-reason.enum';

export class AuthenticationError extends AerealithError {
  readonly reason: AuthFailureReason;

  constructor(
    message: string,
    reason: AuthFailureReason,
    code: AuthErrorCodeValue,
  ) {
    super(message, { code, statusCode: HttpStatus.Unauthorized });
    this.name = 'AuthenticationError';
    this.reason = reason;
  }
}

export const authenticationErrorCodes = AuthErrorCode;
