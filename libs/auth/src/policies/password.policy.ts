import { AerealithError, AuthErrorCode, HttpStatus } from '@aerealith-ai/core';

import {
  DEFAULT_AUTH_OPTIONS,
  type PasswordPolicyOptions,
} from '../config/auth-options.interface';

export class PasswordPolicy {
  private readonly options: Required<PasswordPolicyOptions>;

  constructor(options: PasswordPolicyOptions = {}) {
    this.options = { ...DEFAULT_AUTH_OPTIONS.password, ...options };
  }

  validate(password: string): void {
    const { options } = this;

    if (password.length < options.minimumLength) {
      this.fail(AuthErrorCode.PASSWORD_TOO_SHORT);
    }
    if (password.length > options.maximumLength) {
      this.fail(AuthErrorCode.PASSWORD_TOO_LONG);
    }
    if (options.requireLowercase && !/[a-z]/u.test(password)) {
      this.fail(AuthErrorCode.PASSWORD_TOO_WEAK);
    }
    if (options.requireUppercase && !/[A-Z]/u.test(password)) {
      this.fail(AuthErrorCode.PASSWORD_TOO_WEAK);
    }
    if (options.requireNumber && !/\d/u.test(password)) {
      this.fail(AuthErrorCode.PASSWORD_TOO_WEAK);
    }
    if (options.requireSymbol && !/[^\p{L}\p{N}]/u.test(password)) {
      this.fail(AuthErrorCode.PASSWORD_TOO_WEAK);
    }
  }

  private fail(
    code: (typeof AuthErrorCode)[keyof typeof AuthErrorCode],
  ): never {
    throw new AerealithError('Password does not meet security requirements.', {
      code,
      statusCode: HttpStatus.UnprocessableEntity,
    });
  }
}
