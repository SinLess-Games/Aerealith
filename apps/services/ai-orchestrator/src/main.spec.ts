import type {
  RunRecord,
  RunStatus,
} from '@aerealith-ai/ai-orchestration';

import type {
  RunIndexNamespace,
  RunIndexStub,
  RunStateNamespace,
  RunStateStub,
  WorkflowRunParams,
} from './bindings';
import app from './main';

function createAuthWorker(userId = 'user-123') {
  return {
    fetch: vi.fn(
      async (_request: Request) =>
        Response.json({
          ok: true,
          data: {
            id: userId,
            username: 'tester',
            role: 'user',
            tier: 'free',
          },
        }),
    ),
  };
}

function createUnauthorizedAuthWorker() {
  return {
    fetch: vi.fn(
      async (_request: Request) =>
        Response.json(
          {
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication is required.',
            },
          },
          { status: 401 },
        ),
    ),
  };
}

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
        async createRunIfAbsent(run) {
          const existing = records.get(runId);
          if (existing) {
            return { run: existing, created: false };
          }

          records.set(runId, run);
          return { run, created: true };
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

function createRunIndexNamespace() {
  const runsByTenant = new Map<
    string,
    Array<Omit<RunRecord, 'output'>>
  >();

  const namespace: RunIndexNamespace = {
    idFromName(name: string) {
      return name;
    },
    get(id: unknown): RunIndexStub {
      const tenantId = String(id);

      return {
        async upsertRun(run) {
          const { output, ...indexed } = run;
          void output;
          const current = runsByTenant.get(tenantId) ?? [];
          runsByTenant.set(tenantId, [
            indexed,
            ...current.filter((candidate) => candidate.id !== run.id),
          ]);
        },
        async listRuns(limit = 50, before?: string) {
          const current = runsByTenant.get(tenantId) ?? [];
          const filtered = before
            ? current.filter((run) => run.createdAt < before)
            : current;
          const items = filtered.slice(0, limit);

          return {
            items,
            ...(filtered.length > items.length && items.at(-1)
              ? { nextBefore: items.at(-1)!.createdAt }
              : {}),
          };
        },
      };
    },
  };

  return { namespace, runsByTenant };
}

function createUsageNamespace(options?: {
  runs?: number;
  estimatedCostUsd?: number;
}) {
  const state = {
    day: '2026-09-21',
    runs: options?.runs ?? 0,
    inputUnits: 0,
    outputUnits: 0,
    totalUnits: 0,
    estimatedCostUsd: options?.estimatedCostUsd ?? 0,
  };

  return {
    idFromName(name: string) {
      return name;
    },
    get(_id: unknown) {
      return {
        async consumeRun(
          dailyRunLimit: number,
          dailyCostBudgetUsd: number,
        ) {
          if (dailyRunLimit > 0 && state.runs >= dailyRunLimit) {
            return {
              allowed: false,
              reason: 'DAILY_RUN_LIMIT' as const,
              usage: { ...state },
            };
          }

          if (
            dailyCostBudgetUsd > 0 &&
            state.estimatedCostUsd >= dailyCostBudgetUsd
          ) {
            return {
              allowed: false,
              reason: 'DAILY_COST_BUDGET' as const,
              usage: { ...state },
            };
          }

          state.runs += 1;
          return {
            allowed: true,
            usage: { ...state },
          };
        },
        async releaseRun() {
          state.runs = Math.max(0, state.runs - 1);
          return { ...state };
        },
        async recordUsage(usage?: {
          inputUnits?: number;
          outputUnits?: number;
          totalUnits?: number;
          estimatedCostUsd?: number;
        }) {
          state.inputUnits += usage?.inputUnits ?? 0;
          state.outputUnits += usage?.outputUnits ?? 0;
          state.totalUnits += usage?.totalUnits ?? 0;
          state.estimatedCostUsd += usage?.estimatedCostUsd ?? 0;
          return { ...state };
        },
        async getUsage() {
          return { ...state };
        },
      };
    },
    getState() {
      return { ...state };
    },
  };
}

function createRateLimitNamespace(limit = 60) {
  const counts = new Map<string, number>();

  return {
    idFromName(name: string) {
      return name;
    },
    get(id: unknown) {
      const tenantId = String(id);

      return {
        async consume(requestLimit: number) {
          const current = counts.get(tenantId) ?? 0;
          const effectiveLimit = Math.min(limit, requestLimit);

          if (current >= effectiveLimit) {
            return {
              allowed: false,
              limit: effectiveLimit,
              remaining: 0,
              retryAfterSeconds: 60,
            };
          }

          counts.set(tenantId, current + 1);

          return {
            allowed: true,
            limit: effectiveLimit,
            remaining: Math.max(0, effectiveLimit - current - 1),
            retryAfterSeconds: 60,
          };
        },
      };
    },
  };
}

describe('AI orchestrator service', () => {
  it('allows credentialed CORS for the Aerealith UI origin', async () => {
    const response = await app.request(
      'http://localhost/api/V1/ai/capabilities',
      {
        headers: {
          origin: 'https://aerealith.com',
        },
      },
      {},
    );

    expect(response.headers.get('access-control-allow-origin')).toBe(
      'https://aerealith.com',
    );
    expect(response.headers.get('access-control-allow-credentials')).toBe(
      'true',
    );
  });

  it('does not grant CORS access to unknown browser origins', async () => {
    const response = await app.request(
      'http://localhost/api/V1/ai/capabilities',
      {
        headers: {
          origin: 'https://evil.example',
        },
      },
      {},
    );

    expect(response.headers.get('access-control-allow-origin')).toBeNull();
    expect(
      response.headers.get('access-control-allow-credentials'),
    ).toBeNull();
  });

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

  it('reports configured model providers without exposing provider secrets', async () => {
    const response = await app.request(
      'http://localhost/api/V1/ai/providers',
      undefined,
      {
        AI_PROVIDER_CATALOG: JSON.stringify([
          {
            id: 'primary',
            kind: 'openai-compatible',
            baseUrl: 'https://models.example.test/v1',
            apiKeyBinding: 'PRIMARY_MODEL_API_KEY',
            models: [
              {
                id: 'chat-model',
                capabilities: ['text', 'code'],
              },
            ],
          },
        ]),
        PRIMARY_MODEL_API_KEY: 'provider-secret',
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toMatchObject({
      ok: true,
      data: {
        configuredProviders: 1,
        totalProviders: 1,
        capabilities: ['text', 'code'],
        providers: [
          {
            id: 'primary',
            configured: true,
            modelCount: 1,
            capabilities: ['text', 'code'],
          },
        ],
      },
    });
    expect(JSON.stringify(body)).not.toContain('provider-secret');
    expect(JSON.stringify(body)).not.toContain('models.example.test');
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
      missing: [
        'AUTH_WORKER',
        'AI_ORCHESTRATION_WORKFLOW',
        'AI_RUN_STATE',
        'AI_RUN_INDEX',
        'AI_RATE_LIMIT',
        'AI_USAGE',
        'AI_CODE_SANDBOX',
        'AI_CONVERSATION_STATE',
        'AI_CONVERSATION_INDEX',
        'AI_KNOWLEDGE_CATALOG',
        'AI_ARTIFACTS',
        'QDRANT',
        'AI',
      ],
    });
  });

  it('rejects unauthenticated run submission', async () => {
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
      { AUTH_WORKER: createUnauthorizedAuthWorker() },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it('rejects invalid JSON with the shared API error envelope', async () => {
    const response = await app.request(
      'http://localhost/api/V1/ai/runs',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{',
      },
      { AUTH_WORKER: createAuthWorker() },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: 'BAD_REQUEST',
        message: 'A valid JSON body is required.',
      },
    });
  });

  it('rejects invalid orchestration requests', async () => {
    const response = await app.request(
      'http://localhost/api/V1/ai/runs',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ capability: 'invalid', input: 'hello' }),
      },
      { AUTH_WORKER: createAuthWorker() },
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'VALIDATION_FAILED' },
    });
  });

  it('accepts a normalized orchestration request locally', async () => {
    const response = await app.request(
      'http://localhost/api/V1/ai/runs',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          capability: 'code',
          input: {
            mode: 'generate',
            instruction: 'Write a TypeScript function.',
          },
          priority: 'interactive',
          preferences: {
            provider: 'example-provider',
            allowFallback: true,
          },
        }),
      },
      { AUTH_WORKER: createAuthWorker() },
    );

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
    const { namespace: runIndex } = createRunIndexNamespace();

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
        AUTH_WORKER: createAuthWorker(),
        AI_ORCHESTRATION_WORKFLOW: { create },
        AI_RUN_STATE: namespace,
        AI_RUN_INDEX: runIndex,
        AI_RATE_LIMIT: createRateLimitNamespace(),
        AI_USAGE: createUsageNamespace(),
        AI_PROVIDER_CATALOG: JSON.stringify([
          {
            id: 'primary',
            kind: 'openai-compatible',
            baseUrl: 'https://models.example.test/v1',
            apiKeyBinding: 'PRIMARY_MODEL_API_KEY',
            models: [
              {
                id: 'chat-model',
                capabilities: ['text', 'code'],
              },
            ],
          },
        ]),
        PRIMARY_MODEL_API_KEY: 'provider-secret',
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

  it('replays the same run for the same Idempotency-Key without redispatching', async () => {
    const create = vi.fn(
      async (_options: { id?: string; params: WorkflowRunParams }) => undefined,
    );
    const { namespace, records } = createRunStateNamespace();
    const { namespace: runIndex } = createRunIndexNamespace();
    const env = {
      ENVIRONMENT: 'production',
      AUTH_WORKER: createAuthWorker(),
      AI_ORCHESTRATION_WORKFLOW: { create },
      AI_RUN_STATE: namespace,
      AI_RUN_INDEX: runIndex,
      AI_RATE_LIMIT: createRateLimitNamespace(),
      AI_USAGE: createUsageNamespace(),
      AI_PROVIDER_CATALOG: JSON.stringify([
        {
          id: 'primary',
          kind: 'openai-compatible',
          baseUrl: 'https://models.example.test/v1',
          apiKeyBinding: 'PRIMARY_MODEL_API_KEY',
          models: [
            {
              id: 'chat-model',
              capabilities: ['text'],
            },
          ],
        },
      ]),
      PRIMARY_MODEL_API_KEY: 'provider-secret',
    };

    const request = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'ui-submit-1',
      },
      body: JSON.stringify({
        capability: 'text',
        input: {
          messages: [{ role: 'user', content: 'hello' }],
        },
      }),
    } satisfies RequestInit;

    const first = await app.request(
      'http://localhost/api/V1/ai/runs',
      request,
      env,
    );
    const second = await app.request(
      'http://localhost/api/V1/ai/runs',
      request,
      env,
    );

    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
    const firstBody = (await first.json()) as { data: RunRecord };
    const secondBody = (await second.json()) as { data: RunRecord };

    expect(secondBody.data.id).toBe(firstBody.data.id);
    expect(records).toHaveProperty('size', 1);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('releases the losing quota reservation during concurrent idempotent submission', async () => {
    const create = vi.fn(
      async (_options: { id?: string; params: WorkflowRunParams }) =>
        undefined,
    );
    const { namespace, records } = createRunStateNamespace();
    const { namespace: runIndex } = createRunIndexNamespace();
    const baseUsage = createUsageNamespace();
    let consumeCount = 0;
    let releaseBarrier: (() => void) | undefined;
    const barrier = new Promise<void>((resolve) => {
      releaseBarrier = resolve;
    });
    const usage = {
      ...baseUsage,
      get(id: unknown) {
        const stub = baseUsage.get(id);

        return {
          ...stub,
          async consumeRun(
            dailyRunLimit: number,
            dailyCostBudgetUsd: number,
          ) {
            const decision = await stub.consumeRun(
              dailyRunLimit,
              dailyCostBudgetUsd,
            );
            consumeCount += 1;

            if (consumeCount === 2) {
              releaseBarrier?.();
            } else {
              await barrier;
            }

            return decision;
          },
        };
      },
    };
    const env = {
      ENVIRONMENT: 'production',
      AUTH_WORKER: createAuthWorker(),
      AI_ORCHESTRATION_WORKFLOW: { create },
      AI_RUN_STATE: namespace,
      AI_RUN_INDEX: runIndex,
      AI_RATE_LIMIT: createRateLimitNamespace(),
      AI_USAGE: usage,
      AI_PROVIDER_CATALOG: JSON.stringify([
        {
          id: 'primary',
          kind: 'openai-compatible',
          baseUrl: 'https://models.example.test/v1',
          models: [
            {
              id: 'chat-model',
              capabilities: ['text'],
            },
          ],
        },
      ]),
    };
    const request = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'concurrent-submit',
      },
      body: JSON.stringify({
        capability: 'text',
        input: {
          messages: [{ role: 'user', content: 'hello concurrently' }],
        },
      }),
    } satisfies RequestInit;

    const [first, second] = await Promise.all([
      app.request('http://localhost/api/V1/ai/runs', request, env),
      app.request('http://localhost/api/V1/ai/runs', request, env),
    ]);

    expect(first.status).toBe(202);
    expect(second.status).toBe(202);

    const firstBody = (await first.json()) as { data: RunRecord };
    const secondBody = (await second.json()) as { data: RunRecord };

    expect(firstBody.data.id).toBe(secondBody.data.id);
    expect(records).toHaveProperty('size', 1);
    expect(create).toHaveBeenCalledTimes(1);
    expect(baseUsage.getState().runs).toBe(1);
  });

  it('rejects a conflicting payload that races on the same Idempotency-Key', async () => {
    const create = vi.fn(
      async (_options: { id?: string; params: WorkflowRunParams }) =>
        undefined,
    );
    const { namespace, records } = createRunStateNamespace();
    const { namespace: runIndex } = createRunIndexNamespace();
    const baseUsage = createUsageNamespace();
    let consumeCount = 0;
    let releaseBarrier: (() => void) | undefined;
    const barrier = new Promise<void>((resolve) => {
      releaseBarrier = resolve;
    });
    const usage = {
      ...baseUsage,
      get(id: unknown) {
        const stub = baseUsage.get(id);

        return {
          ...stub,
          async consumeRun(
            dailyRunLimit: number,
            dailyCostBudgetUsd: number,
          ) {
            const decision = await stub.consumeRun(
              dailyRunLimit,
              dailyCostBudgetUsd,
            );
            consumeCount += 1;

            if (consumeCount === 2) {
              releaseBarrier?.();
            } else {
              await barrier;
            }

            return decision;
          },
        };
      },
    };
    const env = {
      ENVIRONMENT: 'production',
      AUTH_WORKER: createAuthWorker(),
      AI_ORCHESTRATION_WORKFLOW: { create },
      AI_RUN_STATE: namespace,
      AI_RUN_INDEX: runIndex,
      AI_RATE_LIMIT: createRateLimitNamespace(),
      AI_USAGE: usage,
      AI_PROVIDER_CATALOG: JSON.stringify([
        {
          id: 'primary',
          kind: 'openai-compatible',
          baseUrl: 'https://models.example.test/v1',
          models: [
            {
              id: 'chat-model',
              capabilities: ['text'],
            },
          ],
        },
      ]),
    };
    const request = (content: string): RequestInit => ({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'concurrent-conflict',
      },
      body: JSON.stringify({
        capability: 'text',
        input: {
          messages: [{ role: 'user', content }],
        },
      }),
    });

    const responses = await Promise.all([
      app.request(
        'http://localhost/api/V1/ai/runs',
        request('first payload'),
        env,
      ),
      app.request(
        'http://localhost/api/V1/ai/runs',
        request('different payload'),
        env,
      ),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([
      202,
      409,
    ]);
    expect(records).toHaveProperty('size', 1);
    expect(create).toHaveBeenCalledTimes(1);
    expect(baseUsage.getState().runs).toBe(1);
  });

  it('returns conflict when an Idempotency-Key is reused for another request', async () => {
    const create = vi.fn(
      async (_options: { id?: string; params: WorkflowRunParams }) => undefined,
    );
    const { namespace } = createRunStateNamespace();
    const { namespace: runIndex } = createRunIndexNamespace();
    const env = {
      ENVIRONMENT: 'production',
      AUTH_WORKER: createAuthWorker(),
      AI_ORCHESTRATION_WORKFLOW: { create },
      AI_RUN_STATE: namespace,
      AI_RUN_INDEX: runIndex,
      AI_RATE_LIMIT: createRateLimitNamespace(),
      AI_USAGE: createUsageNamespace(),
      AI_PROVIDER_CATALOG: JSON.stringify([
        {
          id: 'primary',
          kind: 'openai-compatible',
          baseUrl: 'https://models.example.test/v1',
          apiKeyBinding: 'PRIMARY_MODEL_API_KEY',
          models: [
            {
              id: 'chat-model',
              capabilities: ['text'],
            },
          ],
        },
      ]),
      PRIMARY_MODEL_API_KEY: 'provider-secret',
    };

    const createRequest = (content: string): RequestInit => ({
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'ui-submit-2',
      },
      body: JSON.stringify({
        capability: 'text',
        input: {
          messages: [{ role: 'user', content }],
        },
      }),
    });

    const first = await app.request(
      'http://localhost/api/V1/ai/runs',
      createRequest('first'),
      env,
    );
    const second = await app.request(
      'http://localhost/api/V1/ai/runs',
      createRequest('different'),
      env,
    );

    expect(first.status).toBe(202);
    expect(second.status).toBe(409);
    await expect(second.json()).resolves.toMatchObject({
      error: { code: 'CONFLICT' },
    });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('rejects production runs when no provider supports the capability', async () => {
    const create = vi.fn(
      async (_options: { id?: string; params: WorkflowRunParams }) => undefined,
    );
    const { namespace } = createRunStateNamespace();
    const { namespace: runIndex } = createRunIndexNamespace();

    const response = await app.request(
      'http://localhost/api/V1/ai/runs',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          capability: 'image',
          input: {
            prompt: 'A mountain at sunrise',
          },
        }),
      },
      {
        ENVIRONMENT: 'production',
        AUTH_WORKER: createAuthWorker(),
        AI_ORCHESTRATION_WORKFLOW: { create },
        AI_RUN_STATE: namespace,
        AI_RUN_INDEX: runIndex,
        AI_RATE_LIMIT: createRateLimitNamespace(),
        AI_USAGE: createUsageNamespace(),
        AI_PROVIDER_CATALOG: JSON.stringify([
          {
            id: 'primary',
            kind: 'openai-compatible',
            baseUrl: 'https://models.example.test/v1',
            apiKeyBinding: 'PRIMARY_MODEL_API_KEY',
            models: [
              {
                id: 'chat-model',
                capabilities: ['text'],
              },
            ],
          },
        ]),
        PRIMARY_MODEL_API_KEY: 'provider-secret',
      },
    );

    expect(response.status).toBe(503);
    expect(create).not.toHaveBeenCalled();
  });

  it('lists only the authenticated user\'s run history', async () => {
    const { namespace: runIndex, runsByTenant } =
      createRunIndexNamespace();

    runsByTenant.set('user-123', [
      {
        id: '5d9dd628-c0a3-4fb7-a03d-2a345278ebd5',
        tenantId: 'user-123',
        actorId: 'user-123',
        status: 'succeeded',
        capability: 'text',
        createdAt: '2026-09-21T00:02:00.000Z',
        updatedAt: '2026-09-21T00:03:00.000Z',
      },
    ]);
    runsByTenant.set('user-999', [
      {
        id: 'b49ff1ee-17d0-44ef-a81e-d727e8be4b67',
        tenantId: 'user-999',
        actorId: 'user-999',
        status: 'succeeded',
        capability: 'text',
        createdAt: '2026-09-21T00:01:00.000Z',
        updatedAt: '2026-09-21T00:02:00.000Z',
      },
    ]);

    const response = await app.request(
      'http://localhost/api/V1/ai/runs?limit=25',
      undefined,
      {
        AUTH_WORKER: createAuthWorker('user-123'),
        AI_RUN_INDEX: runIndex,
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toMatchObject({
      ok: true,
      data: [
        {
          tenantId: 'user-123',
          status: 'succeeded',
        },
      ],
    });
    expect(JSON.stringify(body)).not.toContain('user-999');
  });

  it('deletes one knowledge document without deleting its knowledge base', async () => {
    const knowledgeBaseId = '5d9dd628-c0a3-4fb7-a03d-2a345278ebd5';
    const knowledgeBase = {
      id: knowledgeBaseId,
      tenantId: 'user-123',
      name: 'Docs',
      createdAt: '2026-09-21T00:00:00.000Z',
      updatedAt: '2026-09-21T00:01:00.000Z',
      documents: [
        {
          id: 'doc-1',
          createdAt: '2026-09-21T00:01:00.000Z',
        },
        {
          id: 'doc-2',
          createdAt: '2026-09-21T00:01:00.000Z',
        },
      ],
    };
    const deleteDocument = vi.fn(async () => true);
    const catalogStub = {
      createKnowledgeBase: vi.fn(),
      getKnowledgeBase: vi.fn(async () => knowledgeBase),
      listKnowledgeBases: vi.fn(async () => []),
      recordDocuments: vi.fn(),
      deleteDocument,
      deleteKnowledgeBase: vi.fn(async () => true),
    };
    const fetchImplementation = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body)) as {
          filter: {
            must: Array<{
              key: string;
              match: { value: string };
            }>;
          };
        };

        expect(body.filter.must).toEqual([
          {
            key: 'namespace',
            match: {
              value:
                `user:user-123:knowledge:${knowledgeBaseId}`,
            },
          },
          {
            key: 'metadata.documentId',
            match: { value: 'doc-1' },
          },
        ]);

        return Response.json({ status: 'ok' });
      },
    );
    vi.stubGlobal('fetch', fetchImplementation);

    try {
      const response = await app.request(
        `http://localhost/api/V1/ai/knowledge-bases/${knowledgeBaseId}/documents/doc-1`,
        { method: 'DELETE' },
        {
          AUTH_WORKER: createAuthWorker('user-123'),
          AI_KNOWLEDGE_CATALOG: {
            idFromName(name: string) {
              return name;
            },
            get() {
              return catalogStub;
            },
          },
          QDRANT_URL: 'https://qdrant.example.test',
          QDRANT_API_KEY: 'secret',
          QDRANT_COLLECTION: 'aerealith-test-knowledge',
        },
      );

      expect(response.status).toBe(204);
      expect(fetchImplementation).toHaveBeenCalledTimes(1);
      expect(deleteDocument).toHaveBeenCalledWith(
        knowledgeBaseId,
        'doc-1',
      );
      expect(catalogStub.deleteKnowledgeBase).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('returns durable run status by run id', async () => {
    const { namespace, records } = createRunStateNamespace();
    const run: RunRecord = {
      id: '5d9dd628-c0a3-4fb7-a03d-2a345278ebd5',
      tenantId: 'user-123',
      actorId: 'user-123',
      status: 'queued',
      capability: 'text',
      createdAt: '2026-09-21T00:00:00.000Z',
      updatedAt: '2026-09-21T00:00:01.000Z',
    };
    records.set(run.id, run);

    const response = await app.request(
      `http://localhost/api/V1/ai/runs/${run.id}`,
      undefined,
      {
        AUTH_WORKER: createAuthWorker(),
        AI_RUN_STATE: namespace,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: run,
    });
  });

  it('does not expose another user\'s run', async () => {
    const { namespace, records } = createRunStateNamespace();
    const run: RunRecord = {
      id: '5d9dd628-c0a3-4fb7-a03d-2a345278ebd5',
      tenantId: 'user-999',
      actorId: 'user-999',
      status: 'queued',
      capability: 'text',
      createdAt: '2026-09-21T00:00:00.000Z',
      updatedAt: '2026-09-21T00:00:01.000Z',
    };
    records.set(run.id, run);

    const response = await app.request(
      `http://localhost/api/V1/ai/runs/${run.id}`,
      undefined,
      {
        AUTH_WORKER: createAuthWorker('user-123'),
        AI_RUN_STATE: namespace,
      },
    );

    expect(response.status).toBe(404);
  });

  it('returns 404 when a durable run does not exist', async () => {
    const { namespace } = createRunStateNamespace();

    const response = await app.request(
      'http://localhost/api/V1/ai/runs/5d9dd628-c0a3-4fb7-a03d-2a345278ebd5',
      undefined,
      {
        AUTH_WORKER: createAuthWorker(),
        AI_RUN_STATE: namespace,
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'NOT_FOUND' },
    });
  });
});
