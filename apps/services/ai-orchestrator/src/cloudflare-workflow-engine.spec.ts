import type {
  OrchestrationRequest,
  RunRecord,
  RunStatus,
  RunStore,
} from '@aerealith-ai/ai-orchestration';

import type { WorkflowRunParams } from './bindings';
import { CloudflareWorkflowOrchestrationEngine } from './cloudflare-workflow-engine';

class TestRunStore implements RunStore {
  readonly records = new Map<string, RunRecord>();

  async create(run: RunRecord): Promise<void> {
    await this.createIfAbsent(run);
  }

  async createIfAbsent(
    run: RunRecord,
  ): Promise<{ run: RunRecord; created: boolean }> {
    const existing = this.records.get(run.id);
    if (existing) {
      return { run: existing, created: false };
    }

    this.records.set(run.id, run);
    return { run, created: true };
  }

  async get(runId: string): Promise<RunRecord | undefined> {
    return this.records.get(runId);
  }

  async updateStatus(
    runId: string,
    status: RunStatus,
    patch: Partial<Omit<RunRecord, 'id' | 'status' | 'createdAt'>> = {},
  ): Promise<void> {
    const current = this.records.get(runId);
    if (!current) throw new Error('missing run');

    this.records.set(runId, {
      ...current,
      ...patch,
      id: current.id,
      status,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    });
  }
}

describe('CloudflareWorkflowOrchestrationEngine', () => {
  it('persists an accepted run before creating the Workflow instance', async () => {
    const create = vi.fn(
      async (_options: { id?: string; params: WorkflowRunParams }) => undefined,
    );
    const runs = new TestRunStore();
    const engine = new CloudflareWorkflowOrchestrationEngine(
      { create },
      runs,
    );
    const request: OrchestrationRequest = {
      capability: 'text',
      input: 'hello',
    };

    const run = await engine.submit(request);

    expect(run.status).toBe('accepted');
    expect(run.capability).toBe('text');
    await expect(runs.get(run.id)).resolves.toEqual(run);
    expect(create).toHaveBeenCalledTimes(1);

    const options = create.mock.calls[0]?.[0] as
      | { id?: string; params: WorkflowRunParams }
      | undefined;

    expect(options?.id).toBe(run.id);
    expect(options?.params.runId).toBe(run.id);
    expect(options?.params.request).toEqual(request);
  });

  it('does not dispatch a duplicate idempotent run', async () => {
    const create = vi.fn(
      async (_options: { id?: string; params: WorkflowRunParams }) => undefined,
    );
    const runs = new TestRunStore();
    const engine = new CloudflareWorkflowOrchestrationEngine(
      { create },
      runs,
    );
    const request: OrchestrationRequest = {
      capability: 'text',
      input: 'hello',
      tenantId: 'user-123',
    };
    const options = {
      runId: '5d9dd628-c0a3-4fb7-a03d-2a345278ebd5',
      requestFingerprint: 'fingerprint-1',
    };

    const first = await engine.submit(request, options);
    const second = await engine.submit(request, options);

    expect(second).toEqual(first);
    expect(create).toHaveBeenCalledTimes(1);
    expect(runs.records).toHaveProperty('size', 1);
  });

  it('marks the durable run failed when Workflow dispatch fails', async () => {
    const create = vi.fn(
      async (_options: { id?: string; params: WorkflowRunParams }) => {
        throw new Error('dispatch failed');
      },
    );
    const runs = new TestRunStore();
    const engine = new CloudflareWorkflowOrchestrationEngine(
      { create },
      runs,
    );

    await expect(
      engine.submit({
        capability: 'code',
        input: { instruction: 'fix it' },
      }),
    ).rejects.toThrow('dispatch failed');

    expect([...runs.records.values()]).toHaveLength(1);
    expect([...runs.records.values()][0]).toMatchObject({
      status: 'failed',
      errorCode: 'WORKFLOW_DISPATCH_FAILED',
    });
  });
});
