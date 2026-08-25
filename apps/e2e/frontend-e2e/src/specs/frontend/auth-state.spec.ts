import { test, expect } from '../../fixtures/auth.fixture';
import {
  expectNoAdminFlash,
  installAdminFlashDetector,
} from '../../helpers/auth';

test.describe('frontend auth-state security', () => {
  test('does not flash protected content on an initial anonymous load', async ({
    auth,
    browser,
  }) => {
    const context = await auth.newBrowserContext(browser);
    try {
      const page = await context.newPage();
      await installAdminFlashDetector(page);
      await page.goto('/app/admin');
      await expect(page).toHaveURL(/\/sign-in$/u);
      await expect(
        page.getByRole('navigation', { name: 'Dashboard' }),
      ).toHaveCount(0);
      await expectNoAdminFlash(page);
    } finally {
      await context.close();
    }
  });

  test('treats temporary auth-service failure differently from confirmed logout', async ({
    auth,
    browser,
  }) => {
    const context = await auth.newBrowserContext(browser);
    try {
      const page = await context.newPage();
      let attempts = 0;
      await page.route('**/api/V1/auth/me', async (route) => {
        attempts += 1;
        if (attempts === 1) {
          await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({
              ok: false,
              error: {
                code: 'SERVICE_UNAVAILABLE',
                message: 'Authentication is temporarily unavailable.',
              },
            }),
          });
          return;
        }
        await route.continue();
      });

      await page.goto('/app');
      await expect(
        page.getByRole('heading', {
          name: 'Authentication is temporarily unavailable',
        }),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/app$/u);
      await expect(
        page.getByRole('navigation', { name: 'Dashboard' }),
      ).toHaveCount(0);

      await page.getByRole('button', { name: 'Try again' }).click();
      await expect(page).toHaveURL(/\/sign-in$/u);
      expect(attempts).toBeGreaterThanOrEqual(2);
    } finally {
      await context.close();
    }
  });
});
