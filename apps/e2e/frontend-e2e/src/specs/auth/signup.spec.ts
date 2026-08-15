import { randomBytes } from 'node:crypto';

import { test, expect } from '../../fixtures/auth.fixture';
import {
  AuthPaths,
  readSuccess,
  type AuthUserResponse,
} from '../../helpers/api';
import { e2eIdentityRules } from '../../helpers/database';

test.describe('browser signup', () => {
  test('creates an unverified least-privilege user and never authenticates it as admin', async ({
    auth,
    browser,
  }) => {
    const username = `${e2eIdentityRules.usernamePrefix}${randomBytes(5).toString('hex')}`;
    const email = `${username}${e2eIdentityRules.emailSuffix}`;
    const password = `Ae1!${randomBytes(18).toString('base64url')}`;
    const context = await auth.newBrowserContext(browser);
    try {
      const page = await context.newPage();
      await page.goto('/sign-up');
      await page.getByLabel('Username').fill(username);
      await page
        .getByRole('textbox', { name: 'Email', exact: true })
        .fill(email);
      await page.getByLabel('Password').fill(password);
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes(AuthPaths.signUp) &&
          response.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Create account' }).click();
      const response = await responsePromise;
      expect(response.status()).toBe(201);
      const body = (await response.json()) as {
        ok: true;
        data: AuthUserResponse;
      };
      const userId = body.data.id;
      auth.users.track(userId);
      await auth.database.markFixture(userId);

      await expect(page).toHaveURL(/\/verify-email\?email=/u);
      await expect(
        page.getByRole('heading', { name: 'Check your inbox' }),
      ).toBeVisible();
      expect((await context.request.get(AuthPaths.me)).status()).toBe(401);

      const snapshot = await auth.database.authorizationSnapshot(userId);
      expect(snapshot.legacyRole).toBe('user');
      expect(snapshot.roleSlugs).toEqual(['user']);
      expect(snapshot.permissionKeys).toEqual([]);

      await auth.database.setEmailVerified(userId, true);
      expect((await context.request.get(AuthPaths.me)).status()).toBe(200);
      expect(
        (await context.request.get('/api/V1/admin/overview')).status(),
      ).toBe(403);
    } finally {
      await context.close();
    }
  });

  test('handles duplicate email and username with the same safe conflict', async ({
    auth,
  }) => {
    const existing = await auth.users.create();
    const password = `Ae1!${randomBytes(18).toString('base64url')}`;
    const request = await auth.newRequestContext({ base: 'frontend' });
    try {
      const duplicateEmail = await request.post(AuthPaths.signUp, {
        data: {
          username: `${e2eIdentityRules.usernamePrefix}${randomBytes(5).toString('hex')}`,
          email: existing.email,
          password,
        },
      });
      const duplicateUsername = await request.post(AuthPaths.signUp, {
        data: {
          username: existing.username,
          email: `${e2eIdentityRules.usernamePrefix}${randomBytes(5).toString('hex')}${e2eIdentityRules.emailSuffix}`,
          password,
        },
      });
      expect(duplicateEmail.status()).toBe(409);
      expect(duplicateUsername.status()).toBe(409);
      const [emailError, usernameError] = (await Promise.all([
        duplicateEmail.json(),
        duplicateUsername.json(),
      ])) as Array<{ error: { code: string; message: string } }>;
      expect(usernameError.error).toMatchObject({
        code: emailError.error.code,
        message: emailError.error.message,
      });
    } finally {
      await request.dispose();
    }
  });

  test('rejects invalid browser fields and malformed API payloads', async ({
    auth,
    browser,
  }) => {
    const context = await auth.newBrowserContext(browser);
    try {
      const page = await context.newPage();
      let signupRequests = 0;
      page.on('request', (request) => {
        if (request.url().includes(AuthPaths.signUp)) signupRequests += 1;
      });
      await page.goto('/sign-up');
      await page.getByLabel('Username').fill('bad username');
      await page
        .getByRole('textbox', { name: 'Email', exact: true })
        .fill('not-an-email');
      await page.getByLabel('Password').fill('weak');
      await page.getByRole('button', { name: 'Create account' }).click();
      await expect(page.getByRole('alert')).toHaveCount(3);
      expect(signupRequests).toBe(0);

      const malformed = await context.request.post(AuthPaths.signUp, {
        data: { username: 'ab', email: 'invalid', password: 'weak' },
      });
      expect(malformed.status()).toBe(422);
    } finally {
      await context.close();
    }
  });
});
