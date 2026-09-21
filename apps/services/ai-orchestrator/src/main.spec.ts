import type {
  RunRecord,
  RunStatus,
} from '@aerealith-ai/ai-orchestration';

import type {
  RunStateNamespace,
  RunStateStub,
  WorkflowRunParams,
} from './bindings';
import app from './main';

function createRunStateNamespace() {
  const records = new Map<string, RunRecord>();

  const namespace: RunStateNamespace = {
    idFromName(name: string) {
      return name;
    },
    get(id: unknown): RunStateStub {
      const runId = String(id);

      return {
        async createRun(run) {
          const existing = records.get(runId);
          if (existing) return existing;
          records.set(runId, run);
          return run;
        },
        async getRun() {
          return records.get(runId);
        },
        async updateStatus(
          status: RunStatus,
          patch = {},
        ) {
          const current = records.get(runId);
          if (!current) throw new Error('missing run');

          const updated: RunRecord = {
            ...current,
            ...patch,
            id: current.id,
            status,
            createdAt: current.createdAt,
            updatedAt: new Date().toISOString(),
          };

          records.set(runId, updated);
          return updated;
        },
        async cancelRun() {
          const current = records.get(runId);
          if (!current) throw new Error('missing run');

          const updated: RunRecord = {
            ...current,
            status: 'cancelled',
            updatedAt: new Date().toISOString(),
          };

          records.set(runId, updated);
          return updated;
        },
      };
    },
  };

  return { namespace, records };
}

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
    const response = await app.request(
      'http://localhost/api/V1/ai/capabilities',
      {
        headers: { 'x-correlation-id': 'correlation-123' },
      },
    );

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
        QDRANT_COLLECTION: 'aerealith-test-knowledge',
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toMatchObject({
      ok: true,
      data: {
        provider: 'qdrant',
        configured: true,
        collection: 'aerealith-test-knowledge',
      },
    });
    expect(JSON.stringify(body)).not.toContain('super-secret');
    expect(JSON.stringify(body)).not.toContain('qdrant.example.test');
  });

  it('reports missing production Workflow and run-state bindings', async () => {
    const response = await app.request(
      'http://localhost/ready',
      undefined,
      { ENVIRONMENT: 'production' },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      service: 'ai-orchestrator',
      status: 'not_ready',
      missing: ['AI_ORCHESTRATION_WORKFLOW', 'AI_RUN_STATE'],
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

  it('persists production runs before Workflow dispatch', async () => {
    const create = vi.fn(
      async (_options: { id?: string; params: WorkflowRunParams }) => undefined,
    );
    const { namespace, records } = createRunStateNamespace();

    const response = await app.request(
      'http://localhost/api/V1/ai/runs',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          capability: 'text',
          input: {
            messages: [{ role: 'user', content: 'hello' }],
          },
        }),
      },
      {
        ENVIRONMENT: 'production',
        AI_ORCHESTRATION_WORKFLOW: { create },
        AI_RUN_STATE: namespace,
      },
    );

    expect(response.status).toBe(202);
    expect(create).toHaveBeenCalledTimes(1);

    const body = (await response.json()) as {
      data: RunRecord;
    };

    expect(records.get(body.data.id)).toEqual(body.data);

    const options = create.mock.calls[0]?.[0] as
      | { id?: string; params: WorkflowRunParams }
      | undefined;

    expect(options?.params.request.capability).toBe('text');
  });

  it('returns durable run status by run id', async () => {
    const { namespace, records } = createRunStateNamespace();
    const run: RunRecord = {
      id: '5d9dd628-c0a3-4fb7-a03d-2a345278ebd5',
      status: 'queued',
      capability: 'text',
      createdAt: '2026-09-21T00:00:00.000Z',
      updatedAt: '2026-09-21T00:00:01.000Z',
    };
    records.set(run.id, run);

    const response = await app.request(
      `http://localhost/api/V1/ai/runs/${run.id}`,
      undefined,
      { AI_RUN_STATE: namespace },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: run,
    });
  });

  it('returns 404 when a durable run does not exist', async () => {
    const { namespace } = createRunStateNamespace();

    const response = await app.request(
      'http://localhost/api/V1/ai/runs/5d9dd628-c0a3-4fb7-a03d-2a345278ebd5',
      undefined,
      { AI_RUN_STATE: namespace },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'NOT_FOUND' },
    });
  });
});
