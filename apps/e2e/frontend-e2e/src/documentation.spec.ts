import { expect, test } from '@playwright/test';

test.describe('documentation site', () => {
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

  test('offers both documentation audiences', async ({ page }) => {
    await page.goto('/documentation');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Aerealith Documentation' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Explore user docs' }),
    ).toHaveAttribute('href', '/documentation/user');
    await expect(
      page.getByRole('link', { name: 'Explore developer docs' }),
    ).toHaveAttribute('href', '/documentation/developer');
  });

  for (const [path, heading] of [
    ['/documentation/user', 'User Documentation'],
    ['/documentation/user/credits/honorable-mentions', 'Honorable Mentions'],
    ['/documentation/developer', 'Developer Documentation'],
    ['/documentation/developer/api', 'API'],
  ]) {
    test(`renders ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(
        page.getByRole('heading', { level: 1, name: heading }),
      ).toBeVisible();
    });
  }

  test('keeps audience navigation, sidebar navigation, and search in the documentation application', async ({
    page,
  }) => {
    await page.goto('/documentation/user');

    await page
      .getByRole('navigation', { name: 'Documentation audience' })
      .getByRole('link', { name: 'Developer docs' })
      .click();
    await expect(page).toHaveURL(/\/documentation\/developer$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Developer Documentation' }),
    ).toBeVisible();

    await page
      .getByRole('navigation', { name: 'Developer documentation navigation' })
      .getByRole('link', { name: 'API' })
      .click();
    await expect(page).toHaveURL(/\/documentation\/developer\/api$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'API' }),
    ).toBeVisible();

    await page.goto('/documentation');
    await page.getByRole('button', { name: 'Search documentation' }).click();
    const search = page.getByRole('dialog', { name: 'Search documentation' });
    await search.getByRole('searchbox').fill('webhooks');
    await expect(search.getByRole('link', { name: 'Webhooks' })).toBeVisible();
    await search.getByRole('link', { name: 'Webhooks' }).click();
    await expect(page).toHaveURL(/\/documentation\/developer\/api\/webhooks$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Webhooks' }),
    ).toBeVisible();
  });

  test('renders a local documentation not-found page for an unknown published slug', async ({
    page,
  }) => {
    await page.goto('/documentation/user/not-a-published-page');

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Documentation page not found',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Return to documentation' }),
    ).toHaveAttribute('href', '/documentation');
  });
});
