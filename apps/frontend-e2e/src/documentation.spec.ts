import { expect, test } from '@playwright/test'

test.describe('documentation site', () => {
  test('offers both documentation audiences', async ({ page }) => {
    await page.goto('/documentation')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Aerealith Documentation' }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /explore user documentation/i }),
    ).toHaveAttribute('href', '/documentation/user')
    await expect(
      page.getByRole('link', { name: /explore developer documentation/i }),
    ).toHaveAttribute('href', '/documentation/developer')
  })

  for (const [path, heading] of [
    ['/documentation/user', 'User Documentation'],
    ['/documentation/user/credits/honorable-mentions', 'Honorable Mentions'],
    ['/documentation/developer', 'Developer Documentation'],
    ['/documentation/developer/api', 'API'],
  ]) {
    test(`renders ${path}`, async ({ page }) => {
      await page.goto(path)
      await expect(
        page.getByRole('heading', { level: 1, name: heading }),
      ).toBeVisible()
    })
  }
})
