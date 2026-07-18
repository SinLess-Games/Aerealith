import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/V1/auth/me', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      }),
    }),
  )
})

test('submits sign-in credentials and returns home', async ({ page }) => {
  await page.route('**/api/V1/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        data: {
          id: 'user-1',
          username: 'ada',
          email: 'ada@example.com',
          emailVerified: true,
        },
      }),
    }),
  )
  await page.goto('/sign-in')
  await page.getByLabel('Username or email').fill('ada@example.com')
  await page.getByLabel('Password').fill('correct-horse-battery-staple')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/app$/)
})

test('shows a rejected sign-in response', async ({ page }) => {
  await page.route('**/api/V1/auth/login', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' },
      }),
    }),
  )
  await page.goto('/sign-in')
  await page.getByLabel('Username or email').fill('ada@example.com')
  await page.getByLabel('Password').fill('incorrect-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('alert')).toHaveText(/invalid credentials/i)
})

test('submits a new account registration', async ({ page }) => {
  await page.route('**/api/V1/auth/sign-up', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        data: {
          id: 'user-2',
          username: 'grace',
          email: 'grace@example.com',
          emailVerified: false,
        },
      }),
    }),
  )
  await page.goto('/sign-up')
  await page.getByLabel('Username').fill('grace')
  await page
    .getByRole('textbox', { name: 'Email', exact: true })
    .fill('grace@example.com')
  await page.getByLabel('Password').fill('a-secure-password')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/app$/)
})
