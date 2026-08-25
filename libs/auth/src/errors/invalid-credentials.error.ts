import { AuthErrorCode } from '@aerealith-ai/core';

import { AuthFailureReason } from '../enums/auth-failure-reason.enum';
import { AuthenticationError } from './authentication.error';

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super(
      'Invalid email, username, or password.',
      AuthFailureReason.InvalidCredentials,
      AuthErrorCode.INVALID_CREDENTIALS,
    );
    this.name = 'InvalidCredentialsError';
  }
}
