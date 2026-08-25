import { describe, expect, it } from 'vitest';

import {
  isEmailIdentifier,
  normalizeEmail,
  normalizeUsername,
} from './normalize-email';

describe('authentication identifier normalization', () => {
  it('trims and lowercases email addresses', () => {
    expect(normalizeEmail('  USER@Example.COM ')).toBe('user@example.com');
  });

  it('trims and lowercases usernames', () => {
    expect(normalizeUsername('  AerealithUser ')).toBe('aerealithuser');
  });

  it('distinguishes email identifiers from usernames', () => {
    expect(isEmailIdentifier('user@example.com')).toBe(true);
    expect(isEmailIdentifier('aerealith-user')).toBe(false);
  });
});
