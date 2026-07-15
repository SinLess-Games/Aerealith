import { test, expect } from '@playwright/test'

test('loads the frontend shell', async ({ page }) => {
  await page.goto(process.env['BASE_URL'] ?? 'http://localhost:4200/')

  await expect(page).toHaveTitle('Frontend')
  await expect(page.locator('#root')).toBeAttached()
  await expect(page.getByRole('heading', { name: /welcome/i })).toHaveCount(0)
})
