import { describe, expect, it, vi } from 'vitest';

import worker, { type AuthWorkerEnvironment } from './worker';

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
    expect(workerEnvironment.DATABASE_URL.get).not.toHaveBeenCalled();
    expect(
      workerEnvironment.AUTH_SENSITIVE_RATE_LIMIT.limit,
    ).toHaveBeenCalledOnce();
  });
});
