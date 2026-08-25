import { AuthErrorCode } from '@aerealith-ai/core';

import { AuthFailureReason } from '../enums/auth-failure-reason.enum';
import { AuthenticationError } from './authentication.error';

export class SessionExpiredError extends AuthenticationError {
  constructor() {
    super(
      'The session has expired.',
      AuthFailureReason.SessionExpired,
      AuthErrorCode.SESSION_EXPIRED,
    );
    this.name = 'SessionExpiredError';
  }
}
