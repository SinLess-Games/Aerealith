import { describe, expect, it, vi } from 'vitest';

import { verifyRegistrationTurnstile } from './turnstile-verify';

const request = new Request('https://auth.example.com/api/V1/auth/sign-up', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ turnstileToken: 'valid-token' }),
});

describe('verifyRegistrationTurnstile', () => {
  it('is disabled when the server secret is absent', async () => {
    await expect(verifyRegistrationTurnstile(request, {})).resolves.toBe(true);
  });

  it('requires a successful matching action and hostname', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({
        success: true,
        action: 'registration',
        hostname: 'aerealith.com',
      }),
    );
    await expect(
      verifyRegistrationTurnstile(
        request,
        {
          TURNSTILE_SECRET: 'secret',
          TURNSTILE_HOSTNAMES: 'aerealith.com',
        },
        fetcher,
      ),
    ).resolves.toBe(true);
  });

  it('fails closed on verification errors', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('network'));
    await expect(
      verifyRegistrationTurnstile(
        request,
        {
          TURNSTILE_SECRET: 'secret',
          TURNSTILE_HOSTNAMES: 'aerealith.com',
        },
        fetcher,
      ),
    ).resolves.toBe(false);
  });
});
