import { test, expect } from '../../fixtures/auth.fixture';
import {
  expectAuthenticated,
  expectUnauthenticated,
  loginThroughBrowser,
} from '../../helpers/auth';
import { AuthPaths } from '../../helpers/api';
import { expectNoSessionCookie } from '../../helpers/cookies';

test.describe('account lifecycle authentication', () => {
  test('allows an active verified account to authenticate', async ({
    auth,
    browser,
  }) => {
    const user = await auth.users.create();
    const context = await auth.newBrowserContext(browser);
    try {
      const page = await context.newPage();
      await loginThroughBrowser(page, user);
      await expectAuthenticated(page);
    } finally {
      await context.close();
    }
  });

  for (const state of [
    'disabled',
    'suspended',
    'deleted',
    'unverified',
  ] as const) {
    test(`rejects login for a ${state} account`, async ({ auth, browser }) => {
      const user = await auth.users.create({
        status:
          state === 'disabled' || state === 'suspended' ? state : 'active',
        emailVerified: state !== 'unverified',
      });
      if (state === 'deleted') await auth.database.softDeleteUser(user.id);

      const context = await auth.newBrowserContext(browser);
      try {
        const page = await context.newPage();
        await page.goto('/sign-in');
        await page.getByLabel('Username or email').fill(user.email);
        await page.getByLabel('Password').fill(user.password);
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page.getByRole('alert')).toBeVisible();
        await expect(page).toHaveURL(/\/sign-in$/u);
        await expectNoSessionCookie(context);
      } finally {
        await context.close();
      }
    });

    test(`invalidates an existing session after the account becomes ${state}`, async ({
      auth,
      browser,
    }) => {
      const user = await auth.users.create();
      const context = await auth.newBrowserContext(browser, {
        authenticatedAs: user,
      });
      try {
        const page = await context.newPage();
        const authenticatedSession = page.waitForResponse(
          (response) =>
            response.request().method() === 'GET' &&
            new URL(response.url()).pathname === AuthPaths.me,
        );
        await page.goto('/app');
        expect((await authenticatedSession).status()).toBe(200);
        await expectAuthenticated(page);

        if (state === 'disabled' || state === 'suspended') {
          await auth.database.setLifecycleStatus(user.id, state);
        } else if (state === 'unverified') {
          await auth.database.setEmailVerified(user.id, false);
        } else {
          await auth.database.softDeleteUser(user.id);
        }

        expect((await context.request.get(AuthPaths.me)).status()).toBe(401);
        const rejectedSession = page.waitForResponse(
          (response) =>
            response.request().method() === 'GET' &&
            new URL(response.url()).pathname === AuthPaths.me,
        );
        await page.reload();
        expect((await rejectedSession).status()).toBe(401);
        await expectUnauthenticated(page);
        await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0);
      } finally {
        await context.close();
      }
    });
  }
});
