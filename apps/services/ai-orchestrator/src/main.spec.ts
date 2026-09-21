import app from './main';

describe('AI orchestrator service', () => {
  it('reports health', async () => {
    const response = await app.request(
      'http://localhost/health',
      undefined,
      { ENVIRONMENT: 'test' },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      service: 'ai-orchestrator',
      status: 'ok',
      environment: 'test',
    });
  });

  it('rejects invalid orchestration requests', async () => {
    const response = await app.request('http://localhost/api/V1/ai/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ capability: 'invalid', input: 'hello' }),
    });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: 'VALIDATION_FAILED' },
    });
  });

  it('accepts a normalized orchestration request', async () => {
    const response = await app.request('http://localhost/api/V1/ai/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        capability: 'code',
        input: { prompt: 'Write a TypeScript function.' },
        priority: 'interactive',
        preferences: {
          provider: 'example-provider',
          allowFallback: true,
        },
      }),
    });

    expect(response.status).toBe(202);
    const body = (await response.json()) as {
      ok: boolean;
      data: { id: string; status: string; capability: string };
    };

    expect(body.ok).toBe(true);
    expect(body.data.id).toBeTruthy();
    expect(body.data.status).toBe('accepted');
    expect(body.data.capability).toBe('code');
  });
});
