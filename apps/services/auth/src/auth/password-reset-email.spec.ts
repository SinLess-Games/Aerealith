import { describe, expect, it } from 'vitest';

import { createPasswordResetEmail } from './password-reset-email';

describe('createPasswordResetEmail', () => {
  it('uses reset-specific content rather than email verification copy', () => {
    const email = createPasswordResetEmail({
      resetUrl: 'https://app.test/reset-password?token=opaque',
      expiresInHours: 1,
    });
    expect(email.subject).toMatch(/reset/i);
    expect(email.text).toContain('reset your Aerealith password');
    expect(email.text).not.toContain('Verify your email');
  });
});
