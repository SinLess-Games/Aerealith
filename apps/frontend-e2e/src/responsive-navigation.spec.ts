import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 390, height: 844 } })

test('uses the mobile navigation at a phone viewport', async ({ page }) => {
  await page.goto('/')
  const menuButton = page.getByRole('button', { name: /open navigation menu/i })
  await expect(menuButton).toBeVisible()
  await menuButton.click()

  const mobileNavigation = page.getByRole('navigation', {
    name: 'Mobile primary navigation',
  })
  await expect(mobileNavigation).toBeVisible()
  await mobileNavigation.getByRole('link', { name: 'Pricing' }).click()
  await expect(page).toHaveURL(/\/pricing$/)
  await expect(mobileNavigation).toBeHidden()
})

test('closes the mobile menu with Escape', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /open navigation menu/i }).click()
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('navigation', { name: 'Mobile primary navigation' }),
  ).toBeHidden()
})
