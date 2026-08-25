import type { VerificationEmail } from './email-verification-email';

export function createPasswordResetEmail(input: {
  displayName?: string;
  resetUrl: string;
  expiresInHours: number;
}): VerificationEmail {
  const name = input.displayName?.trim() || 'there';
  const subject = 'Reset your Aerealith password';
  return {
    subject,
    text: [
      `Hello ${name},`,
      '',
      'Use this link to reset your Aerealith password:',
      input.resetUrl,
      '',
      `This link expires in ${input.expiresInHours} hour(s) and can only be used once.`,
      'If you did not request a password reset, you can safely ignore this email.',
    ].join('\n'),
    html: `<p>Hello ${escapeHtml(name)},</p><p>Use this link to reset your Aerealith password:</p><p><a href="${escapeHtml(input.resetUrl)}">Reset password</a></p><p>This link expires in ${input.expiresInHours} hour(s) and can only be used once. If you did not request it, you can safely ignore this email.</p>`,
  };
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ] ?? character,
  );
}
