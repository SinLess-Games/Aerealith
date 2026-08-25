import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';

import { AuthSessionCookie } from './auth-application.service';

const SessionMaxAgeSeconds = 60 * 60 * 24 * 30;

function cookieOptions(context: Context) {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax' as const,
    secure: new URL(context.req.url).protocol === 'https:',
  };
}

export function readSessionCookie(context: Context): string | undefined {
  return getCookie(context, AuthSessionCookie);
}

export function writeSessionCookie(context: Context, token: string): void {
  setCookie(context, AuthSessionCookie, token, {
    ...cookieOptions(context),
    maxAge: SessionMaxAgeSeconds,
  });
}

export function clearSessionCookie(context: Context): void {
  deleteCookie(context, AuthSessionCookie, cookieOptions(context));
}
