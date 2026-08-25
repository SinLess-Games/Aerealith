import { createHash, randomBytes } from 'node:crypto';

import { test, expect } from '../../fixtures/auth.fixture';
import { AuthPaths } from '../../helpers/api';

test.describe('password recovery', () => {
  test('keeps known and unknown password-reset requests enumeration-safe', async ({
    auth,
    browser,
  }) => {
    const user = await auth.users.create();
    const messages: string[] = [];
    for (const email of [
      user.email,
      `missing_${Date.now()}@e2e.aerealith.invalid`,
    ]) {
      const context = await auth.newBrowserContext(browser);
      try {
        const page = await context.newPage();
        await page.goto('/forgot-password');
        await page.getByLabel('Email address').fill(email);
        await page.getByRole('button', { name: 'Send reset link' }).click();
        const status = page.getByRole('status');
        await expect(status).toBeVisible();
        messages.push((await status.textContent())?.trim() ?? '');
      } finally {
        await context.close();
      }
    }
    expect(messages[0]).toBeTruthy();
    expect(messages[1]).toBe(messages[0]);
  });

  test('changes the password once and revokes every existing session', async ({
    auth,
    browser,
  }) => {
    const user = await auth.users.create();
    const existingSession = await auth.loginRequest(user, { base: 'frontend' });
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const newPassword = `Nw2!${randomBytes(18).toString('base64url')}`;
    await auth.database.createPasswordResetToken(user.id, tokenHash);

    const context = await auth.newBrowserContext(browser);
    try {
      const page = await context.newPage();
      await page.goto(`/reset-password?token=${encodeURIComponent(rawToken)}`);
      await page.getByLabel('New password').fill(newPassword);
      await page.getByRole('button', { name: 'Update password' }).click();
      await expect(
        page.getByRole('heading', { name: 'Password updated' }),
      ).toBeVisible();
      expect((await existingSession.get(AuthPaths.me)).status()).toBe(401);

      const oldCredentials = await auth.newRequestContext({ base: 'frontend' });
      try {
        expect(
          (
            await oldCredentials.post(AuthPaths.login, {
              data: {
                usernameOrEmail: user.email,
                password: user.password,
              },
            })
          ).status(),
        ).toBe(401);
      } finally {
        await oldCredentials.dispose();
      }

      const updated = { ...user, password: newPassword };
      const newSession = await auth.loginRequest(updated, { base: 'frontend' });
      try {
        expect((await newSession.get(AuthPaths.me)).status()).toBe(200);
      } finally {
        await newSession.dispose();
      }

      const reused = await context.request.post(
        '/api/V1/auth/password-reset/complete',
        {
          data: { token: rawToken, newPassword: `${newPassword}3` },
        },
      );
      expect(reused.status()).toBe(400);
    } finally {
      await existingSession.dispose();
      await context.close();
    }
  });
});
