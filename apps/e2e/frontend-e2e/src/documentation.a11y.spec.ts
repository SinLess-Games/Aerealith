import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('documentation accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'aerealith-consent-v1',
        JSON.stringify({
          necessary: true,
          analytics: false,
          advertising: false,
          sessionReplay: false,
        }),
      );
    });
  });

  for (const [path, name] of [
    ['/documentation', 'documentation home'],
    ['/documentation/user', 'user documentation'],
    ['/documentation/developer', 'developer documentation'],
  ]) {
    test(`has no automatically detectable accessibility violations on ${name}`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page.locator('#docs-main-content')).toBeVisible();

      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test('moves keyboard focus past documentation navigation with the skip link', async ({
    page,
  }) => {
    await page.goto('/documentation/user');

    const skipLink = page.getByRole('link', { name: 'Skip to documentation' });
    await skipLink.focus();
    await expect(skipLink).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.locator('#docs-main-content')).toBeFocused();
  });
});

test.describe('documentation mobile navigation accessibility', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('focuses the drawer and restores focus to its trigger after Escape', async ({
    page,
  }) => {
    await page.goto('/documentation/user');

    const trigger = page.getByRole('button', {
      name: 'Open documentation navigation',
    });
    await trigger.click();

    const drawer = page.getByRole('dialog', {
      name: 'User documentation navigation',
    });
    await expect(drawer).toBeVisible();
    await expect(
      drawer
        .locator('aside')
        .getByRole('button', { name: 'Close documentation navigation' }),
    ).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
