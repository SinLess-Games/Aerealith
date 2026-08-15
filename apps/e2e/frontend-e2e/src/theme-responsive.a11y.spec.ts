import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`keeps the public shell responsive and accessible in the ${theme} theme`, async ({
    page,
  }) => {
    await page.addInitScript((selectedTheme) => {
      window.localStorage.setItem('aerealith-theme', selectedTheme);
      window.localStorage.setItem(
        'aerealith-consent-v1',
        JSON.stringify({
          necessary: true,
          analytics: false,
          advertising: false,
          sessionReplay: false,
        }),
      );
    }, theme);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(
      page.getByRole('button', { name: 'Open navigation menu' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
    ).toBe(true);

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);

    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(
      page.getByRole('navigation', { name: 'Primary navigation' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Open navigation menu' }),
    ).toBeHidden();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
    ).toBe(true);
  });
}

test('keeps the public skip link on the active route and focuses main content', async ({
  page,
}) => {
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
  await page.goto('/about');

  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await skipLink.focus();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/\/about#main-content$/);
  await expect(page.locator('#main-content')).toBeFocused();
});

for (const theme of ['light', 'dark'] as const) {
  test(`reacts to consent choices with accessible controls in the ${theme} theme`, async ({
    page,
  }) => {
    await page.addInitScript((selectedTheme) => {
      window.localStorage.setItem('aerealith-theme', selectedTheme);
    }, theme);
    await page.goto('/');

    const privacySettings = page.getByRole('region', {
      name: 'Privacy settings',
    });
    await expect(privacySettings).toBeVisible();
    await expect(
      privacySettings.getByRole('switch', { name: 'Analytics' }),
    ).toHaveAttribute('aria-checked', 'false');

    const accessibility = await new AxeBuilder({ page })
      .include('[aria-label="Privacy settings"]')
      .analyze();
    expect(accessibility.violations).toEqual([]);

    await privacySettings.getByRole('switch', { name: 'Analytics' }).click();
    await privacySettings.getByRole('button', { name: 'Save choices' }).click();
    await expect(privacySettings).toBeHidden();
  });
}
