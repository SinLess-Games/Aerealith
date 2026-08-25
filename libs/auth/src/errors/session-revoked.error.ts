import { AuthErrorCode } from '@aerealith-ai/core';

import { AuthFailureReason } from '../enums/auth-failure-reason.enum';
import { AuthenticationError } from './authentication.error';

export class SessionRevokedError extends AuthenticationError {
  constructor() {
    super(
      'The session has been revoked.',
      AuthFailureReason.SessionRevoked,
      AuthErrorCode.SESSION_REVOKED,
    );
    this.name = 'SessionRevokedError';
  }
}
