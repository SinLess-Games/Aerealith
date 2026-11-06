import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';

import { AuthSessionCookie } from './auth-application.service';

const SessionMaxAgeSeconds = 60 * 60 * 24 * 30;

/**
 * Set AUTH_TRUST_PROXY=true only when this process is behind a trusted
 * TLS-terminating proxy that overwrites X-Forwarded-Proto. The header is
 * ignored otherwise, because a client can spoof it. Direct HTTPS requests
 * are Secure from the request URL and do not need the setting.
 */
const TrustProxyEnv = 'AUTH_TRUST_PROXY';

function cookieOptions(context: Context) {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax' as const,
    secure: isSecureRequest(context),
  };
}

function isSecureRequest(context: Context): boolean {
  if (new URL(context.req.url).protocol === 'https:') {
    return true;
  }

  if (process.env[TrustProxyEnv] !== 'true') {
    return false;
  }

  const forwarded = context.req.header('x-forwarded-proto');
  const proto = forwarded?.split(',')[0]?.trim().toLowerCase();
  return proto === 'https';
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
