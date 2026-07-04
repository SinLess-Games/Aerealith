import { expect, test } from '@playwright/test'

test('has title', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('h1')).toContainText('Aerealith AI')
})
