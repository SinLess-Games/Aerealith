import { test, expect } from '../../fixtures/auth.fixture';
import {
  expectAuthenticated,
  expectUnauthenticated,
  loginThroughBrowser,
} from '../../helpers/auth';
import { AuthPaths, readSuccess, type SessionSummary } from '../../helpers/api';
import {
  expectNoSessionCookie,
  sessionCookieMetadata,
} from '../../helpers/cookies';

test.describe('browser sessions', () => {
  test('persists only the cookie-backed session across refresh and navigation', async ({
    auth,
    browser,
  }) => {
    const user = await auth.users.create();
    const context = await auth.newBrowserContext(browser);
    try {
      const page = await context.newPage();
      await loginThroughBrowser(page, user);
      await page.reload();
      await expectAuthenticated(page);
      await page
        .getByRole('link', { name: 'Security & sessions', exact: true })
        .click();
      await expect(page).toHaveURL(/\/app\/security$/u);
      await expect(
        page.getByRole('heading', { name: 'Security & sessions' }),
      ).toBeVisible();

      const secondPage = await context.newPage();
      await secondPage.goto('/app');
      await expectAuthenticated(secondPage);
      expect(
        await page.evaluate(() =>
          Object.keys(localStorage).filter((key) =>
            /auth|session|token/iu.test(key),
          ),
        ),
      ).toEqual([]);
    } finally {
      await context.close();
    }
  });

  test('revokes logout, clears its cookie, blocks Back, and stays idempotent', async ({
    auth,
    browser,
  }) => {
    const user = await auth.users.create();
    const context = await auth.newBrowserContext(browser);
    let revokedState;
    try {
      const page = await context.newPage();
      await loginThroughBrowser(page, user);
      revokedState = await context.storageState();
      await page.getByRole('button', { name: 'Sign out' }).click();
      await expectUnauthenticated(page);
      await expectNoSessionCookie(context);
      expect((await context.request.get(AuthPaths.me)).status()).toBe(401);

      await page.goBack();
      await expectUnauthenticated(page);
    } finally {
      await context.close();
    }

    const replay = await browser.newContext({
      baseURL: auth.environment.frontendUrl,
      storageState: revokedState,
      extraHTTPHeaders: { 'cf-connecting-ip': auth.nextIp() },
    });
    try {
      expect((await replay.request.get(AuthPaths.me)).status()).toBe(401);
      expect(
        (await replay.request.post(AuthPaths.logout, { data: {} })).status(),
      ).toBe(200);
      expect((await replay.request.get(AuthPaths.me)).status()).toBe(401);
    } finally {
      await replay.close();
    }
  });

  test('keeps independent sessions and revokes only the intended peers', async ({
    auth,
  }) => {
    const user = await auth.users.create();
    const browserA = await auth.loginRequest(user, { base: 'frontend' });
    const browserB = await auth.loginRequest(user, { base: 'frontend' });
    let browserBReplacement;
    try {
      expect((await browserA.get(AuthPaths.me)).status()).toBe(200);
      expect((await browserB.get(AuthPaths.me)).status()).toBe(200);

      const sessionsA = await readSuccess<{ sessions: SessionSummary[] }>(
        await browserA.get(AuthPaths.sessions),
        200,
      );
      const sessionsB = await readSuccess<{ sessions: SessionSummary[] }>(
        await browserB.get(AuthPaths.sessions),
        200,
      );
      expect(
        sessionsA.sessions.filter(({ status }) => status === 'active').length,
      ).toBeGreaterThanOrEqual(2);
      const browserBSession = sessionsB.sessions.find(({ current }) => current);
      expect(browserBSession).toBeDefined();

      expect(
        (
          await browserA.delete(`${AuthPaths.sessions}/${browserBSession!.id}`)
        ).status(),
      ).toBe(200);
      expect((await browserA.get(AuthPaths.me)).status()).toBe(200);
      expect((await browserB.get(AuthPaths.me)).status()).toBe(401);

      browserBReplacement = await auth.loginRequest(user, { base: 'frontend' });
      expect((await browserA.delete(AuthPaths.sessions)).status()).toBe(200);
      expect((await browserA.get(AuthPaths.me)).status()).toBe(200);
      expect((await browserBReplacement.get(AuthPaths.me)).status()).toBe(401);
    } finally {
      await browserA.dispose();
      await browserB.dispose();
      await browserBReplacement?.dispose();
    }
  });

  test('rejects an expired session at the integration boundary and in the UI', async ({
    auth,
    browser,
  }) => {
    const user = await auth.users.create();
    const session = await auth.loginRequest(user, { base: 'frontend' });
    const state = await session.storageState();
    try {
      const history = await readSuccess<{ sessions: SessionSummary[] }>(
        await session.get(AuthPaths.sessions),
        200,
      );
      const current = history.sessions.find(({ current }) => current);
      expect(current).toBeDefined();

      await auth.database.expireSession(
        current!.id,
        new Date(Date.now() + 60_000),
      );
      expect((await session.get(AuthPaths.me)).status()).toBe(200);

      await auth.database.expireSession(current!.id, new Date());
      expect((await session.get(AuthPaths.me)).status()).toBe(401);
    } finally {
      await session.dispose();
    }

    const context = await browser.newContext({
      baseURL: auth.environment.frontendUrl,
      storageState: state,
      extraHTTPHeaders: { 'cf-connecting-ip': auth.nextIp() },
    });
    try {
      const page = await context.newPage();
      await page.goto('/app');
      await expectUnauthenticated(page);
      await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test('uses an HttpOnly session cookie with environment-appropriate security', async ({
    auth,
    browser,
  }) => {
    const user = await auth.users.create();
    const context = await auth.newBrowserContext(browser);
    try {
      const page = await context.newPage();
      await loginThroughBrowser(page, user);
      const cookie = await sessionCookieMetadata(context);
      expect(cookie).toEqual({
        name: 'aerealith_session',
        httpOnly: true,
        sameSite: 'Lax',
        secure: auth.environment.target === 'preview',
        path: '/',
        expires: expect.any(Number),
        hasValue: true,
      });
      expect(cookie!.expires).toBeGreaterThan(Date.now() / 1000);
    } finally {
      await context.close();
    }
  });
});
