import { expect, type BrowserContext } from '@playwright/test';

export const SessionCookieName = 'aerealith_session';

export async function sessionCookieMetadata(context: BrowserContext) {
  const cookie = (await context.cookies()).find(
    ({ name }) => name === SessionCookieName,
  );
  if (!cookie) return null;
  return {
    name: cookie.name,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    secure: cookie.secure,
    path: cookie.path,
    expires: cookie.expires,
    hasValue: cookie.value.length > 0,
  };
}

export async function expectNoSessionCookie(
  context: BrowserContext,
): Promise<void> {
  const names = (await context.cookies()).map(({ name }) => name);
  expect(names).not.toContain(SessionCookieName);
}
