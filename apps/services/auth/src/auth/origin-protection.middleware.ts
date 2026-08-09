import type { MiddlewareHandler } from 'hono';

import type { AuthApiEnv } from './auth-api-context';

const UnsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Rejects cross-origin browser writes before a session cookie can be used.
 * Requests without an Origin header remain supported for same-origin tests,
 * non-browser clients, and infrastructure callers. Browsers attach Origin to
 * CORS and unsafe same-origin requests, which is the CSRF boundary here.
 */
export function requireTrustedOrigin(
  allowedOrigins: readonly string[] = [],
): MiddlewareHandler<AuthApiEnv> {
  const allowed = new Set(allowedOrigins.map(normalizeOrigin).filter(Boolean));

  return async (context, next) => {
    if (!UnsafeMethods.has(context.req.method)) return next();

    const origin = context.req.header('origin');
    if (!origin) return next();

    const requestOrigin = new URL(context.req.url).origin;
    if (origin === requestOrigin || allowed.has(normalizeOrigin(origin))) {
      return next();
    }

    return context.json(
      {
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message: 'The request origin is not allowed.',
        },
      },
      403,
    );
  };
}

function normalizeOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}
