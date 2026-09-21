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
    this.records.set(run.id, run);
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
