import { EntitySchemas } from '@aerealith-ai/core';
import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { z } from 'zod';

import { videosRouter } from './ cdn/videos';
import { LazyWaitlistApplication } from './waitlist/lazy-waitlist-application';
import type { WaitlistApplication } from './waitlist/waitlist-application.service';

type SecretBinding = string | { get(): Promise<string> };

export type ApiWorkerBindings = {
  AEREALITH_AI: R2Bucket;
  DATABASE_URL?: SecretBinding;
};

type ApiEnvironment = { Bindings: ApiWorkerBindings };

export type CreateApiServiceAppOptions = {
  waitlist?: WaitlistApplication;
};

const allowedOrigins = [
  'https://aerealith.com',
  'https://www.aerealith.com',
  'http://localhost:4200',
  'http://127.0.0.1:4200',
] as const;

const JoinWaitlistSchema = EntitySchemas.CreateWaitlistEntitySchema.extend({
  newsletter: z.boolean().default(false),
});

export function createApiServiceApp(options: CreateApiServiceAppOptions = {}) {
  const app = new Hono<ApiEnvironment>();

  app.use('*', secureHeaders());
  app.use(
    '*',
    cors({
      origin: (origin) =>
        allowedOrigins.includes(origin as (typeof allowedOrigins)[number])
          ? origin
          : '',
      allowMethods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
      allowHeaders: ['Accept', 'Content-Type', 'X-Request-ID'],
      exposeHeaders: ['Content-Length', 'Content-Type', 'X-Request-ID'],
      maxAge: 86_400,
    }),
  );

  app.get('/health', (context) =>
    context.json({ service: 'api', status: 'ok' }),
  );
  app.get('/api/V1/services/api', (context) =>
    context.json({ service: 'api', status: 'ok' }),
  );
  app.get('/api/V1/services/api/health', (context) =>
    context.json({ service: 'api', status: 'ok' }),
  );

  app.post('/api/V1/waitlist', async (context) => {
    let body: unknown;
    try {
      body = await context.req.json();
    } catch {
      return failure(
        context,
        400,
        'INVALID_JSON',
        'A valid JSON body is required.',
      );
    }

    const parsed = JoinWaitlistSchema.safeParse(body);
    if (!parsed.success) {
      return failure(
        context,
        422,
        'VALIDATION_FAILED',
        'Enter a valid email address and waitlist details.',
        parsed.error.issues.map(({ code, message, path }) => ({
          code,
          message,
          path,
        })),
      );
    }

    const lazyApplication = options.waitlist
      ? undefined
      : new LazyWaitlistApplication(
          await resolveDatabaseUrl(context.env.DATABASE_URL),
        );
    const application = options.waitlist ?? lazyApplication!;

    try {
      const result = await application.join({
        email: parsed.data.email!,
        role: parsed.data.role ?? null,
        newsletter: parsed.data.newsletter,
      });
      return context.json({
        ok: true as const,
        data: result,
        meta: responseMeta(context),
      });
    } finally {
      await lazyApplication?.close();
    }
  });

  app.route('/api/V1/cdn/videos', videosRouter);

  app.onError((error, context) => {
    console.error('API request failed.', error);
    return context.json(
      {
        ok: false as const,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'The request could not be completed.',
        },
        meta: responseMeta(context),
      },
      500,
    );
  });

  return app;
}

async function resolveDatabaseUrl(binding: SecretBinding | undefined) {
  const value =
    typeof binding === 'string'
      ? binding
      : binding
        ? await binding.get()
        : process.env['DATABASE_URL'];

  if (!value?.trim()) throw new Error('DATABASE_URL is required.');
  return value.trim();
}

function responseMeta(context: Context<ApiEnvironment>) {
  return {
    requestId: context.req.header('x-request-id') ?? crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    path: new URL(context.req.url).pathname,
  };
}

function failure(
  context: Context<ApiEnvironment>,
  status: 400 | 422,
  code: string,
  message: string,
  details?: unknown,
) {
  return context.json(
    {
      ok: false as const,
      error: { code, message, ...(details ? { details } : {}) },
      meta: responseMeta(context),
    },
    status,
  );
}

export const app = createApiServiceApp();

export default app;
