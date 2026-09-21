import { createIdempotentRunIdentity } from './idempotency';

describe('createIdempotentRunIdentity', () => {
  it('creates the same UUID and fingerprint for the same request', async () => {
    const request = {
      capability: 'text' as const,
      input: {
        messages: [{ role: 'user', content: 'hello' }],
      },
      tenantId: 'user-123',
      actorId: 'user-123',
    };

    const first = await createIdempotentRunIdentity(
      'user-123',
      'request-1',
      request,
    );
    const second = await createIdempotentRunIdentity(
      'user-123',
      'request-1',
      request,
    );

    expect(second).toEqual(first);
    expect(first.runId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('canonicalizes object key order for request fingerprints', async () => {
    const first = await createIdempotentRunIdentity(
      'user-123',
      'request-1',
      {
        capability: 'analytics',
        input: {
          question: 'hello',
          data: { a: 1, b: 2 },
        },
      },
    );
    const second = await createIdempotentRunIdentity(
      'user-123',
      'request-1',
      {
        capability: 'analytics',
        input: {
          data: { b: 2, a: 1 },
          question: 'hello',
        },
      },
    );

    expect(second.requestFingerprint).toBe(
      first.requestFingerprint,
    );
  });

  it('separates keys between tenants', async () => {
    const request = {
      capability: 'text' as const,
      input: {
        messages: [{ role: 'user', content: 'hello' }],
      },
    };

    const first = await createIdempotentRunIdentity(
      'user-123',
      'same-key',
      request,
    );
    const second = await createIdempotentRunIdentity(
      'user-999',
      'same-key',
      request,
    );

    expect(first.runId).not.toBe(second.runId);
  });
});
