import { test, expect } from '../../fixtures/auth.fixture';

test.describe('CSRF origin and CORS boundaries', () => {
  test('accepts the trusted frontend origin for browser mutations', async ({
    auth,
  }) => {
    const request = await auth.newRequestContext();
    try {
      const response = await request.post('/api/V1/auth/logout', { data: {} });
      expect(response.status()).toBe(200);
    } finally {
      await request.dispose();
    }
  });

  for (const origin of [
    'https://evil.example',
    'http://localhost:9999',
    'null',
    'https://aerealith.com.evil.example',
    'http://localhost:4200/path',
    'https://user@evil.example',
  ]) {
    test(`rejects unsafe requests from ${origin}`, async ({ auth }) => {
      const request = await auth.newRequestContext({ origin });
      try {
        const response = await request.post('/api/V1/auth/logout', {
          data: {},
        });
        expect(response.status()).toBe(403);
        const body = (await response.json()) as {
          error: { code: string };
        };
        expect(body.error.code).toBe('FORBIDDEN');
      } finally {
        await request.dispose();
      }
    });
  }

  test('returns credentialed CORS headers only to an approved origin', async ({
    auth,
  }) => {
    const trusted = await auth.newRequestContext();
    const untrusted = await auth.newRequestContext({
      origin: 'https://evil.example',
    });
    try {
      const trustedPreflight = await trusted.fetch('/api/V1/auth/login', {
        method: 'OPTIONS',
        headers: {
          origin: auth.environment.trustedOrigin,
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type',
        },
      });
      expect(trustedPreflight.status()).toBe(204);
      expect(trustedPreflight.headers()['access-control-allow-origin']).toBe(
        auth.environment.trustedOrigin,
      );
      expect(
        trustedPreflight.headers()['access-control-allow-credentials'],
      ).toBe('true');
      expect(
        trustedPreflight.headers()['access-control-allow-origin'],
      ).not.toBe('*');

      const untrustedPreflight = await untrusted.fetch('/api/V1/auth/login', {
        method: 'OPTIONS',
        headers: {
          origin: 'https://evil.example',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type',
        },
      });
      expect(untrustedPreflight.headers()['access-control-allow-origin']).toBe(
        undefined,
      );
      expect(
        untrustedPreflight.headers()['access-control-allow-credentials'],
      ).toBeUndefined();
    } finally {
      await trusted.dispose();
      await untrusted.dispose();
    }
  });
});
