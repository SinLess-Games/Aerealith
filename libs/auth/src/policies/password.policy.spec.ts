import { AerealithError, AuthErrorCode, HttpStatus } from '@aerealith-ai/core';
import { describe, expect, it } from 'vitest';

import { DEFAULT_AUTH_OPTIONS } from '../config/auth-options.interface';
import { PasswordPolicy } from './password.policy';

describe('PasswordPolicy', () => {
  it('exposes secure defaults and accepts a conforming password', () => {
    expect(DEFAULT_AUTH_OPTIONS.password.minimumLength).toBe(12);
    expect(DEFAULT_AUTH_OPTIONS.session.tokenEntropyBytes).toBe(32);
    expect(() =>
      new PasswordPolicy().validate('SecurePassword1'),
    ).not.toThrow();
  });

  it.each([
    ['short passwords', 'Short1', AuthErrorCode.PASSWORD_TOO_SHORT, {}],
    [
      'long passwords',
      'SecurePassword1',
      AuthErrorCode.PASSWORD_TOO_LONG,
      { maximumLength: 8 },
    ],
    [
      'missing lowercase letters',
      'UPPERCASE123',
      AuthErrorCode.PASSWORD_TOO_WEAK,
      {},
    ],
    [
      'missing uppercase letters',
      'lowercase123',
      AuthErrorCode.PASSWORD_TOO_WEAK,
      {},
    ],
    ['missing numbers', 'NoNumbersHere', AuthErrorCode.PASSWORD_TOO_WEAK, {}],
    [
      'missing symbols when required',
      'SecurePassword1',
      AuthErrorCode.PASSWORD_TOO_WEAK,
      { requireSymbol: true },
    ],
  ] as const)('rejects %s', (_name, password, code, options) => {
    try {
      new PasswordPolicy(options).validate(password);
      throw new Error('Expected password validation to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(AerealithError);
      expect(error).toMatchObject({
        code,
        statusCode: HttpStatus.UnprocessableEntity,
      });
    }
  });

  it('allows individual strength requirements to be disabled', () => {
    const policy = new PasswordPolicy({
      minimumLength: 1,
      requireLowercase: false,
      requireUppercase: false,
      requireNumber: false,
      requireSymbol: false,
    });
    expect(() => policy.validate('x')).not.toThrow();
  });
});
