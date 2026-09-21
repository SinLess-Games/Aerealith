import {
  authenticateRequest,
  AuthenticationRequiredError,
  AuthServiceUnavailableError,
} from './auth-runtime';

describe('AI auth runtime', () => {
  it('forwards session credentials to the auth service and returns the principal', async () => {
    const fetch = vi.fn(async (request: Request) => {
      expect(new URL(request.url).pathname).toBe('/api/V1/auth/me');
      expect(request.headers.get('cookie')).toBe('session=abc');
      expect(request.headers.get('authorization')).toBe('Bearer token');
      expect(request.headers.get('x-request-id')).toBe('request-1');

      return Response.json({
        ok: true,
        data: {
          id: 'user-123',
          username: 'tester',
          role: 'user',
          tier: 'free',
        },
      });
    });

    const principal = await authenticateRequest(
      new Request('https://aerealith.example/api/V1/ai/runs', {
        headers: {
          cookie: 'session=abc',
          authorization: 'Bearer token',
          'x-request-id': 'request-1',
        },
      }),
      {
        AUTH_WORKER: { fetch },
      },
    );

    expect(principal).toMatchObject({
      id: 'user-123',
      username: 'tester',
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('maps an auth 401 to AuthenticationRequiredError', async () => {
    await expect(
      authenticateRequest(
        new Request('https://aerealith.example/api/V1/ai/runs'),
        {
          AUTH_WORKER: {
            fetch: vi.fn(async () => new Response(null, { status: 401 })),
          },
        },
      ),
    ).rejects.toBeInstanceOf(AuthenticationRequiredError);
  });

  it('fails closed when the auth service binding is missing', async () => {
    await expect(
      authenticateRequest(
        new Request('https://aerealith.example/api/V1/ai/runs'),
        {},
      ),
    ).rejects.toBeInstanceOf(AuthServiceUnavailableError);
  });

  it('fails closed when the auth response shape is invalid', async () => {
    await expect(
      authenticateRequest(
        new Request('https://aerealith.example/api/V1/ai/runs'),
        {
          AUTH_WORKER: {
            fetch: vi.fn(async () =>
              Response.json({
                ok: true,
                data: {
                  username: 'missing-id',
                },
              }),
            ),
          },
        },
      ),
    ).rejects.toBeInstanceOf(AuthServiceUnavailableError);
  });
});
