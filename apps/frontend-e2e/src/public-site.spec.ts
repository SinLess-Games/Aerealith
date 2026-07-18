import { expect, test } from '@playwright/test'

test.describe('public marketing site', () => {
  test('navigates through the primary public routes', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Aerealith/i)
    await expect(
      page.getByRole('heading', { level: 1, name: /your digital life/i }),
    ).toBeVisible()

    const primary = page.getByRole('navigation', { name: 'Primary navigation' })
    await primary.getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveURL(/\/about$/)
    await expect(
      page.getByRole('heading', { level: 1, name: /intelligent by design/i }),
    ).toBeVisible()

    await primary.getByRole('link', { name: 'Pricing' }).click()
    await expect(page).toHaveURL(/\/pricing$/)
    await expect(
      page.getByRole('heading', { level: 1, name: /one platform/i }),
    ).toBeVisible()

    await primary.getByRole('link', { name: 'Contact' }).click()
    await expect(page).toHaveURL(/\/contact$/)
    await expect(
      page.getByRole('heading', { level: 1, name: /build the future/i }),
    ).toBeVisible()
  })

  test('renders policy and not-found routes', async ({ page }) => {
    await page.goto('/policies/privacy')
    await expect(
      page.getByRole('heading', { level: 1, name: /privacy policy/i }),
    ).toBeVisible()

    await page.goto('/this-route-does-not-exist')
    await expect(page.getByText(/error 404/i)).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 1, name: /not found/i }),
    ).toBeVisible()
  })

  test('persists the selected theme', async ({ page }) => {
    await page.goto('/')
    const themeToggle = page.getByRole('button', {
      name: /switch to (dark|light) theme/i,
    })
    await themeToggle.click()
    const selectedTheme = await page.locator('html').getAttribute('data-theme')

    expect(selectedTheme).toMatch(/^(dark|light)$/)
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      selectedTheme ?? 'dark',
    )
  })
})
