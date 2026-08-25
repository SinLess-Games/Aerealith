import { expect, type Page } from '@playwright/test';

import type { E2EUser } from '../fixtures/users.fixture';

export async function loginThroughBrowser(
  page: Page,
  user: Pick<E2EUser, 'email' | 'password'>,
  identifier = user.email,
): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel('Username or email').fill(identifier);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/app$/u);
}

export async function expectAuthenticated(page: Page): Promise<void> {
  await expect(
    page.getByRole('navigation', { name: 'Dashboard' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
}

export async function expectUnauthenticated(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/sign-in$/u);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Welcome back' }),
  ).toBeVisible();
}

export async function installAdminFlashDetector(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const privileged =
      /super admin|admin dashboard|protected platform administration/iu;
    Object.defineProperty(window, '__aerealithAdminFlashSeen', {
      value: false,
      configurable: true,
      writable: true,
    });
    const observe = () => {
      const privilegedUiIsPresent = () =>
        privileged.test(document.body?.textContent ?? '') ||
        [...document.querySelectorAll<HTMLAnchorElement>('a[href]')].some(
          ({ pathname }) => pathname.startsWith('/app/admin'),
        );
      const detector = new MutationObserver(() => {
        if (privilegedUiIsPresent()) {
          (
            window as unknown as Window & {
              __aerealithAdminFlashSeen: boolean;
            }
          ).__aerealithAdminFlashSeen = true;
        }
      });
      detector.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    };
    if (document.documentElement) observe();
    else document.addEventListener('DOMContentLoaded', observe, { once: true });
  });
}

export async function expectNoAdminFlash(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as Window & {
              __aerealithAdminFlashSeen?: boolean;
            }
          ).__aerealithAdminFlashSeen ?? false,
      ),
    )
    .toBe(false);
}
