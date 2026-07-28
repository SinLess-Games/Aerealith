import { AuthErrorCode, HttpStatus } from '@aerealith-ai/core';
import { describe, expect, it } from 'vitest';

import { AuthFailureReason } from '../enums/auth-failure-reason.enum';
import {
  AuthenticationError,
  authenticationErrorCodes,
} from './authentication.error';
import { InvalidCredentialsError } from './invalid-credentials.error';
import { SessionExpiredError } from './session-expired.error';
import { SessionRevokedError } from './session-revoked.error';

describe('authentication errors', () => {
  it('constructs the base error with core error semantics', () => {
    const error = new AuthenticationError(
      'Authentication failed.',
      AuthFailureReason.AccountDisabled,
      AuthErrorCode.ACCOUNT_DISABLED,
    );
    expect(error).toMatchObject({
      name: 'AuthenticationError',
      message: 'Authentication failed.',
      reason: AuthFailureReason.AccountDisabled,
      code: AuthErrorCode.ACCOUNT_DISABLED,
      statusCode: HttpStatus.Unauthorized,
    });
    expect(authenticationErrorCodes).toBe(AuthErrorCode);
  });

  it.each([
    [
      new InvalidCredentialsError(),
      'InvalidCredentialsError',
      AuthFailureReason.InvalidCredentials,
      AuthErrorCode.INVALID_CREDENTIALS,
    ],
    [
      new SessionExpiredError(),
      'SessionExpiredError',
      AuthFailureReason.SessionExpired,
      AuthErrorCode.SESSION_EXPIRED,
    ],
    [
      new SessionRevokedError(),
      'SessionRevokedError',
      AuthFailureReason.SessionRevoked,
      AuthErrorCode.SESSION_REVOKED,
    ],
  ])('creates specialized public-safe errors', (error, name, reason, code) => {
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error).toMatchObject({
      name,
      reason,
      code,
      statusCode: HttpStatus.Unauthorized,
    });
  });
});
