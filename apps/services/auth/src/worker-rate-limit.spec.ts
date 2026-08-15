import { describe, expect, it, vi } from 'vitest';

import worker, { type AuthWorkerEnvironment } from './worker';

function databaseSecret(environment: AuthWorkerEnvironment) {
  const binding = environment.DATABASE_URL;
  if (typeof binding === 'string') throw new Error('Expected test binding.');
  return binding;
}

function environment(): AuthWorkerEnvironment {
  return {
    DATABASE_URL: { get: vi.fn(async () => 'postgres://test') },
    RESEND_API_KEY: { get: vi.fn(async () => 're_test') },
    FLAGSHIP_FLAGS: {
      getBooleanValue: vi.fn(
        async (_key: string, fallback: boolean) => fallback,
      ),
    },
    AUTH_SENSITIVE_RATE_LIMIT: {
      limit: vi.fn(async () => ({ success: false })),
    },
  } as unknown as AuthWorkerEnvironment;
}

describe('auth Worker rate-limit transport', () => {
  it('returns a stable, retryable 429 before sensitive authentication work', async () => {
    const workerEnvironment = environment();
    const response = await worker.fetch(
      new Request(
        'https://auth.aerealith.com/api/V1/auth/password-reset/request',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: 'ada@example.com' }),
        },
      ),
      workerEnvironment,
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('60');
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
      },
    });
    expect(databaseSecret(workerEnvironment).get).not.toHaveBeenCalled();
    expect(
      workerEnvironment.AUTH_SENSITIVE_RATE_LIMIT.limit,
    ).toHaveBeenCalledOnce();
  });

  it('lets an allowed sensitive request reach transport validation', async () => {
    const workerEnvironment = environment();
    workerEnvironment.AUTH_SENSITIVE_RATE_LIMIT.limit = vi.fn(async () => ({
      success: true,
    }));
    const response = await worker.fetch(
      new Request('https://auth.aerealith.com/api/V1/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: '', password: '' }),
      }),
      workerEnvironment,
    );

    expect(response.status).toBe(422);
    expect(databaseSecret(workerEnvironment).get).toHaveBeenCalledOnce();
  });

  it('does not charge health, flags, or ordinary safe requests', async () => {
    for (const path of ['/health', '/api/V1/flags']) {
      const workerEnvironment = environment();
      await worker.fetch(
        new Request(`https://auth.aerealith.com${path}`),
        workerEnvironment,
      );
      expect(
        workerEnvironment.AUTH_SENSITIVE_RATE_LIMIT.limit,
      ).not.toHaveBeenCalled();
    }
  });
});
