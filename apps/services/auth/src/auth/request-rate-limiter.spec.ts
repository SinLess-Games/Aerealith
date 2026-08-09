import { describe, expect, it, vi } from 'vitest';

import {
  CloudflareRequestRateLimiter,
  createRateLimitKey,
} from './request-rate-limiter';

describe('CloudflareRequestRateLimiter', () => {
  it('uses a hashed normalized identity scoped to the operation', async () => {
    const request = new Request('https://auth.test/api/V1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: ' Ada@Example.COM ' }),
    });
    const key = await createRateLimitKey(request, 'login');
    expect(key).not.toContain('Ada');
    expect(key).not.toContain('@');
    expect(key).not.toEqual(await createRateLimitKey(request, 'reset'));
  });

  it('returns the provider decision', async () => {
    const limit = vi.fn(async () => ({ success: false }));
    const limiter = new CloudflareRequestRateLimiter({ limit } as RateLimit);
    await expect(
      limiter.allow(new Request('https://auth.test'), 'login'),
    ).resolves.toBe(false);
    expect(limit).toHaveBeenCalledOnce();
  });
});
