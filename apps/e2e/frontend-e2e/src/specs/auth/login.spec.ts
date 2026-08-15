import { test, expect } from '../../fixtures/auth.fixture';
import { loginThroughBrowser, expectAuthenticated } from '../../helpers/auth';
import { AuthPaths } from '../../helpers/api';
import { expectNoSessionCookie } from '../../helpers/cookies';

test.describe('browser login', () => {
  test('authenticates the platform owner through the real sign-in page', async ({
    auth,
    browser,
  }) => {
    const context = await auth.newBrowserContext(browser);
    try {
      const page = await context.newPage();
      await loginThroughBrowser(page, auth.platformOwner);
      await expectAuthenticated(page);
      await expect(
        page.getByText('Super Admin', { exact: true }),
      ).toBeVisible();
      const me = await context.request.get(AuthPaths.me);
      expect(me.status()).toBe(200);
    } finally {
      await context.close();
    }
  });

  test('supports a normal user logging in by email and by username', async ({
    auth,
    browser,
  }) => {
    const user = await auth.users.create();

    for (const identifier of [user.email, user.username]) {
      const context = await auth.newBrowserContext(browser);
      try {
        const page = await context.newPage();
        await loginThroughBrowser(page, user, identifier);
        await expectAuthenticated(page);
        await expect(
          page.getByText('Super Admin', { exact: true }),
        ).toHaveCount(0);
      } finally {
        await context.close();
      }
    }
  });

  test('keeps wrong-password and unknown-account errors enumeration-safe', async ({
    auth,
    browser,
  }) => {
    const user = await auth.users.create();
    const visibleErrors: string[] = [];
    for (const credentials of [
      { identifier: user.email, password: `${user.password}wrong` },
      {
        identifier: `missing_${Date.now()}@e2e.aerealith.invalid`,
        password: user.password,
      },
    ]) {
      const context = await auth.newBrowserContext(browser);
      try {
        const page = await context.newPage();
        await page.goto('/sign-in');
        await page.getByLabel('Username or email').fill(credentials.identifier);
        await page.getByLabel('Password').fill(credentials.password);
        await page.getByRole('button', { name: 'Sign in' }).click();
        const alert = page.getByRole('alert');
        await expect(alert).toBeVisible();
        visibleErrors.push((await alert.textContent())?.trim() ?? '');
        await expect(page).toHaveURL(/\/sign-in$/u);
        await expectNoSessionCookie(context);
      } finally {
        await context.close();
      }
    }
    expect(visibleErrors[0]).toBeTruthy();
    expect(visibleErrors[1]).toBe(visibleErrors[0]);
  });

  test('preserves intentional password whitespace', async ({
    auth,
    browser,
  }) => {
    const password = `  Ae1!${Date.now()}Password  `;
    const user = await auth.users.create({ password });

    const exactContext = await auth.newBrowserContext(browser);
    try {
      const page = await exactContext.newPage();
      await loginThroughBrowser(page, user);
      await expectAuthenticated(page);
    } finally {
      await exactContext.close();
    }

    const trimmedContext = await auth.newBrowserContext(browser);
    try {
      const page = await trimmedContext.newPage();
      await page.goto('/sign-in');
      await page.getByLabel('Username or email').fill(user.email);
      await page.getByLabel('Password').fill(password.trim());
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page.getByRole('alert')).toBeVisible();
      await expectNoSessionCookie(trimmedContext);
    } finally {
      await trimmedContext.close();
    }
  });
});
