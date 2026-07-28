export type VerificationEmail = {
  subject: string;
  html: string;
  text: string;
};

/** Builds a self-contained, responsive email that renders reliably in major clients. */
export function createEmailVerificationEmail(input: {
  displayName?: string;
  verificationUrl: string;
  expiresInHours: number;
}): VerificationEmail {
  const name = escapeHtml(input.displayName?.trim() || 'there');
  const url = escapeHtml(input.verificationUrl);
  const subject = 'Verify your Aerealith email';

  return {
    subject,
    text: [
      `Hello ${input.displayName?.trim() || 'there'},`,
      '',
      'Welcome to Aerealith. Verify your email address to secure your account:',
      input.verificationUrl,
      '',
      `This link expires in ${input.expiresInHours} hours and can only be used once.`,
      'If you did not create this account, you can safely ignore this email.',
    ].join('\n'),
    html: `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${subject}</title></head>
<body style="margin:0;background:#070b18;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#eaf0ff">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#070b18"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px">
<tr><td style="padding:0 8px 24px;color:#c5a6ff;font-size:22px;font-weight:800;letter-spacing:3px">AEREALITH</td></tr>
<tr><td style="background:#11182c;border:1px solid #283354;border-radius:24px;padding:48px 42px">
<div style="display:inline-block;padding:7px 12px;border-radius:999px;background:#211942;color:#c9b5ff;font-size:12px;font-weight:700;letter-spacing:1px">SECURE YOUR ACCOUNT</div>
<h1 style="margin:24px 0 14px;color:#fff;font-size:32px;line-height:1.2">One click, and you’re verified.</h1>
<p style="margin:0 0 16px;color:#b9c3da;font-size:16px;line-height:1.7">Hello ${name},</p>
<p style="margin:0 0 30px;color:#b9c3da;font-size:16px;line-height:1.7">Welcome to Aerealith. Confirm this email address to protect your identity and unlock your command center.</p>
<table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="border-radius:12px;background:#8b5cf6">
<a href="${url}" style="display:inline-block;padding:15px 25px;color:#fff;text-decoration:none;font-size:16px;font-weight:800">Verify my email&nbsp; →</a>
</td></tr></table>
<p style="margin:30px 0 0;color:#8490aa;font-size:13px;line-height:1.6">This private link expires in ${input.expiresInHours} hours and works once. If you didn’t create an Aerealith account, no action is needed.</p>
<div style="height:1px;background:#283354;margin:30px 0"></div>
<p style="margin:0;color:#65718d;font-size:12px;line-height:1.6">Button not working? Copy this link into your browser:<br><a href="${url}" style="color:#ad91ff;word-break:break-all">${url}</a></p>
</td></tr>
<tr><td style="padding:22px 8px;color:#65718d;font-size:12px;line-height:1.6">Aerealith · Trust-first infrastructure for your digital life<br>This is an automated security message.</td></tr>
</table></td></tr></table></body></html>`,
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
