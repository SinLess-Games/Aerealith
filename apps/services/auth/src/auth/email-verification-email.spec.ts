import { describe, expect, it } from 'vitest';

import { createEmailVerificationEmail } from './email-verification-email';

describe('createEmailVerificationEmail', () => {
  it('creates branded HTML and a plain-text fallback', () => {
    const message = createEmailVerificationEmail({
      displayName: 'Ada <Admin>',
      verificationUrl: 'https://aerealith.example/verify-email?token=secret',
      expiresInHours: 24,
    });

    expect(message.subject).toContain('Aerealith');
    expect(message.html).toContain('AEREALITH');
    expect(message.html).toContain('Verify my email');
    expect(message.html).toContain('Ada &lt;Admin&gt;');
    expect(message.html).not.toContain('Ada <Admin>');
    expect(message.text).toContain(
      'https://aerealith.example/verify-email?token=secret',
    );
    expect(message.text).toContain('expires in 24 hours');
  });
});
