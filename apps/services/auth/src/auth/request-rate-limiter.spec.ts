import { describe, expect, it, vi } from 'vitest';

import {
  classifySensitiveAuthOperations,
  CloudflareRequestRateLimiter,
  createRateLimitKeys,
} from './request-rate-limiter';

describe('CloudflareRequestRateLimiter', () => {
  it('uses hashed IP and normalized identity keys scoped to the operation', async () => {
    const request = new Request('https://auth.test/api/V1/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cf-connecting-ip': '192.0.2.10',
      },
      body: JSON.stringify({ usernameOrEmail: ' Ada@Example.COM ' }),
    });
    const keys = await createRateLimitKeys(request, 'auth.login');
    expect(keys).toHaveLength(2);
    expect(keys.join('')).not.toContain('Ada');
    expect(keys.join('')).not.toContain('@');
    expect(keys).not.toEqual(
      await createRateLimitKeys(request, 'auth.password-reset.request'),
    );
  });

  it('enforces the provider decision for every applicable bucket', async () => {
    const limit = vi
      .fn()
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false });
    const limiter = new CloudflareRequestRateLimiter({ limit } as RateLimit);
    await expect(
      limiter.allow(
        new Request('https://auth.test', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: 'ada@example.com' }),
        }),
        'auth.login',
      ),
    ).resolves.toBe(false);
    expect(limit).toHaveBeenCalledTimes(2);
  });

  it('uses the same canonical operation across HTTP, GraphQL, and tRPC login', async () => {
    const requests = [
      new Request('https://auth.test/api/V1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail: 'ada@example.com' }),
      }),
      new Request('https://auth.test/graphql', {
        method: 'POST',
        body: JSON.stringify({
          query:
            'mutation Login($input: LoginInput!) { login(input: $input) { id } }',
          variables: { input: { usernameOrEmail: 'ada@example.com' } },
        }),
      }),
      new Request('https://auth.test/trpc/auth.login', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail: 'ada@example.com' }),
      }),
    ];

    for (const request of requests) {
      await expect(classifySensitiveAuthOperations(request)).resolves.toEqual([
        'auth.login',
      ]);
    }
    const keys = await Promise.all(
      requests.map((request) => createRateLimitKeys(request, 'auth.login')),
    );
    expect(keys[0]).toEqual(keys[1]);
    expect(keys[1]).toEqual(keys[2]);
  });

  it('retains a shared IP quota when GraphQL credentials are inline', async () => {
    const headers = { 'cf-connecting-ip': '192.0.2.20' };
    const http = new Request('https://auth.test/api/V1/auth/login', {
      method: 'POST',
      headers,
      body: JSON.stringify({ usernameOrEmail: 'ada@example.com' }),
    });
    const graphql = new Request('https://auth.test/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query:
          'mutation { login(input: { usernameOrEmail: "ada@example.com", password: "Password 1!" }) { id } }',
      }),
    });

    const [httpKeys, graphqlKeys] = await Promise.all([
      createRateLimitKeys(http, 'auth.login'),
      createRateLimitKeys(graphql, 'auth.login'),
    ]);
    expect(httpKeys[0]).toBe(graphqlKeys[0]);
  });

  it('classifies GraphQL resend verification without limiting me or logout', async () => {
    await expect(
      classifySensitiveAuthOperations(
        new Request('https://auth.test/graphql', {
          method: 'POST',
          body: JSON.stringify({
            query:
              'mutation Resend($email: String!) { resendVerification(email: $email) }',
            variables: { email: 'ada@example.com' },
          }),
        }),
      ),
    ).resolves.toEqual(['auth.resend-verification']);
  });

  it.each([
    ['/api/V1/auth/sign-up', 'auth.sign-up'],
    ['/api/V1/auth/resend-verification', 'auth.resend-verification'],
    ['/api/V1/auth/password-reset/request', 'auth.password-reset.request'],
    ['/api/V1/auth/password-reset/complete', 'auth.password-reset.complete'],
    ['/trpc/auth.resendVerification', 'auth.resend-verification'],
  ])('classifies sensitive POST %s', async (path, operation) => {
    await expect(
      classifySensitiveAuthOperations(
        new Request(`https://auth.test${path}`, { method: 'POST' }),
      ),
    ).resolves.toEqual([operation]);
  });

  it('does not classify safe requests or non-sensitive GraphQL operations', async () => {
    const requests = [
      new Request('https://auth.test/health'),
      new Request('https://auth.test/api/V1/flags'),
      new Request('https://auth.test/api/V1/auth/me'),
      new Request('https://auth.test/graphql', {
        method: 'POST',
        body: JSON.stringify({ query: '{ me { id } }' }),
      }),
      new Request('https://auth.test/graphql', {
        method: 'POST',
        body: JSON.stringify({ query: 'mutation { logout }' }),
      }),
    ];
    for (const request of requests) {
      await expect(classifySensitiveAuthOperations(request)).resolves.toEqual(
        [],
      );
    }
  });
});
