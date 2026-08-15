import { describe, expect, it } from 'vitest';

import {
  isValidEmail,
  validateLoginIdentity,
  validateSignUpFields,
} from './auth-form-validation';
import { meetsPasswordPolicy, passwordPolicyHint } from './password-policy';

describe('authentication form validation', () => {
  it.each([
    ['person@example.com', true],
    [' person@example.com ', true],
    ['missing-domain@', false],
    ['two words@example.com', false],
  ])('validates email %s', (value, expected) => {
    expect(isValidEmail(value)).toBe(expected);
  });

  it('accepts valid login identifiers and explains invalid identifiers', () => {
    expect(validateLoginIdentity('aerealith_user')).toBeUndefined();
    expect(validateLoginIdentity('person@example.com')).toBeUndefined();
    expect(validateLoginIdentity('')).toBe('Enter your username or email.');
    expect(validateLoginIdentity('bad@address')).toBe(
      'Enter a valid email address.',
    );
    expect(validateLoginIdentity('Upper Case')).toBe(
      'Enter a valid username or email address.',
    );
  });

  it('returns only the invalid sign-up fields', () => {
    expect(
      validateSignUpFields({
        username: 'valid_user',
        email: 'person@example.com',
        password: 'LongEnough1a',
      }),
    ).toEqual({});

    expect(
      validateSignUpFields({
        username: 'NO',
        email: 'invalid',
        password: 'short',
      }),
    ).toEqual({
      username: 'Use 3–32 lowercase letters, numbers, or underscores.',
      email: 'Enter a valid email address.',
      password: passwordPolicyHint,
    });
  });

  it.each([
    ['LongEnough1a', true],
    ['lowercaseonly1', false],
    ['UPPERCASEONLY1', false],
    ['NoNumberHere', false],
    ['Short1a', false],
  ])('applies the password policy to %s', (password, expected) => {
    expect(meetsPasswordPolicy(password)).toBe(expected);
  });
});
