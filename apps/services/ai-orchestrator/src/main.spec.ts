import type { WorkflowRunParams } from './bindings';
import app from './main';

describe('AI orchestrator service', () => {
  it('reports health with a request id', async () => {
    const response = await app.request(
      'http://localhost/health',
      {
        headers: { 'x-request-id': 'test-request-1' },
      },
      { ENVIRONMENT: 'test' },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('x-request-id')).toBe('test-request-1');
    await expect(response.json()).resolves.toMatchObject({
      service: 'ai-orchestrator',
      status: 'ok',
      environment: 'test',
      meta: { requestId: 'test-request-1' },
    });
  });

  it('propagates correlation ids through the shared request context', async () => {
    const response = await app.request('http://localhost/api/V1/ai/capabilities', {
      headers: { 'x-correlation-id': 'correlation-123' },
    });

    expect(response.headers.get('x-correlation-id')).toBe('correlation-123');
    await expect(response.json()).resolves.toMatchObject({
      meta: { correlationId: 'correlation-123' },
    });
  });

  it('reports Qdrant vector-store configuration without exposing credentials', async () => {
    const response = await app.request(
      'http://localhost/api/V1/ai/vector-store',
      undefined,
      {
        QDRANT_URL: 'https://qdrant.example.test',
        QDRANT_API_KEY: 'super-secret',
        QDRANT_COLLECTION_PREFIX: 'aerealith-test-',
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toMatchObject({
      ok: true,
      data: {
        provider: 'qdrant',
        configured: true,
        collectionPrefix: 'aerealith-test-',
      },
    });
    expect(JSON.stringify(body)).not.toContain('super-secret');
    expect(JSON.stringify(body)).not.toContain('qdrant.example.test');
  });

  it('reports not ready when the production Workflow binding is missing', async () => {
    const response = await app.request(
      'http://localhost/ready',
      undefined,
      { ENVIRONMENT: 'production' },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      service: 'ai-orchestrator',
      status: 'not_ready',
    });
  });

  it('rejects invalid JSON with the shared API error envelope', async () => {
    const response = await app.request('http://localhost/api/V1/ai/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: 'BAD_REQUEST',
        message: 'A valid JSON body is required.',
      },
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
      error: { code: 'VALIDATION_FAILED' },
    });
  });

  it('accepts a normalized orchestration request locally', async () => {
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

  it('dispatches production runs to the Workflow binding', async () => {
    const create = vi.fn(
      async (_options: { id?: string; params: WorkflowRunParams }) => undefined,
    );
    const response = await app.request(
      'http://localhost/api/V1/ai/runs',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          capability: 'text',
          input: 'hello',
        }),
      },
      {
        ENVIRONMENT: 'production',
        AI_ORCHESTRATION_WORKFLOW: { create },
      },
    );

    expect(response.status).toBe(202);
    expect(create).toHaveBeenCalledTimes(1);

    const options = create.mock.calls[0]?.[0] as
      | { id?: string; params: WorkflowRunParams }
      | undefined;

    expect(options?.params.request.capability).toBe('text');
  });
});
