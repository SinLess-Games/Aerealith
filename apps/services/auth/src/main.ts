import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

import { createAuthServiceApp } from './create-auth-service-app';

const app = createAuthServiceApp();

const productionOrigins = [
  'https://aerealith.com',
  'https://www.aerealith.com',
] as const;

const developmentOrigins = [
  'http://localhost:4200',
  'http://127.0.0.1:4200',
] as const;

function allowedOrigins(): readonly string[] {
  if (process.env['NODE_ENV'] === 'production') {
    return productionOrigins;
  }

  return [...productionOrigins, ...developmentOrigins];
}

/**
 * Security headers should apply to every response from the auth service.
 */
app.use('*', secureHeaders());

/**
 * CORS
 *
 * Authentication uses credentials, so never use `*` for the allowed origin.
 *
 * Hono handles OPTIONS/preflight requests through this middleware.
 */
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (allowedOrigins().includes(origin)) {
        return origin;
      }

      return '';
    },

    allowMethods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    allowHeaders: [
      'Accept',
      'Authorization',
      'Content-Type',
      'X-CSRF-Token',
      'X-Request-ID',
    ],

    exposeHeaders: ['Content-Length', 'Content-Type', 'X-Request-ID'],

    /**
     * Required when the frontend sends session cookies.
     *
     * Frontend requests must also use:
     *
     * fetch(url, {
     *   credentials: 'include',
     * })
     */
    credentials: true,

    /**
     * Cache successful browser preflight responses for 24 hours.
     */
    maxAge: 86_400,
  }),
);

export { createAuthServiceApp };
export default app;
