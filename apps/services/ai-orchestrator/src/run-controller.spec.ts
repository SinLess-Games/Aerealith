import type {
  RunRecord,
  RunStatus,
} from '@aerealith-ai/ai-orchestration';

import type {
  RunStateNamespace,
  RunStateStub,
  WorkflowBinding,
  WorkflowRunParams,
} from './bindings';
import { AiRunController } from './run-controller';
import { DurableObjectRunStore } from './run-store';

function createStore(run: RunRecord) {
  const records = new Map([[run.id, run]]);
  const namespace: RunStateNamespace = {
    idFromName(name: string) {
      return name;
    },
    get(id: unknown): RunStateStub {
      const runId = String(id);

      return {
        async createRun(value) {
          records.set(runId, value);
          return value;
        },
        async getRun() {
          return records.get(runId);
        },
        async updateStatus(status: RunStatus, patch = {}) {
          const current = records.get(runId)!;
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
          const current = records.get(runId)!;
          if (
            current.status === 'succeeded' ||
            current.status === 'failed' ||
            current.status === 'cancelled'
          ) {
            return current;
          }

          const updated: RunRecord = {
            ...current,
            status: 'cancelled',
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          records.set(runId, updated);
          return updated;
        },
      };
    },
  };

  return new DurableObjectRunStore(namespace);
}

describe('AiRunController', () => {
  it('terminates the Workflow before marking an active run cancelled', async () => {
    const run: RunRecord = {
      id: '5d9dd628-c0a3-4fb7-a03d-2a345278ebd5',
      status: 'running',
      capability: 'text',
      createdAt: '2026-09-21T00:00:00.000Z',
      updatedAt: '2026-09-21T00:00:01.000Z',
    };
    const store = createStore(run);
    const terminate = vi.fn(async () => undefined);
    const workflow: WorkflowBinding<WorkflowRunParams> = {
      create: vi.fn(async () => undefined),
      get: vi.fn(async () => ({
        status: vi.fn(async () => ({ status: 'running' })),
        terminate,
      })),
    };

    const controller = new AiRunController(workflow, store);
    const cancelled = await controller.cancel(run.id);

    expect(terminate).toHaveBeenCalledTimes(1);
    expect(cancelled?.status).toBe('cancelled');
  });

  it('cancels streaming runs without looking up a Workflow', async () => {
    const run: RunRecord = {
      id: '5d9dd628-c0a3-4fb7-a03d-2a345278ebd5',
      executionMode: 'streaming',
      status: 'running',
      capability: 'text',
      createdAt: '2026-09-21T00:00:00.000Z',
      updatedAt: '2026-09-21T00:00:01.000Z',
    };
    const store = createStore(run);
    const get = vi.fn();
    const workflow: WorkflowBinding<WorkflowRunParams> = {
      create: vi.fn(async () => undefined),
      get,
    };

    const controller = new AiRunController(workflow, store);
    const cancelled = await controller.cancel(run.id);

    expect(cancelled?.status).toBe('cancelled');
    expect(get).not.toHaveBeenCalled();
  });

  it('does not terminate a Workflow for an already completed run', async () => {
    const run: RunRecord = {
      id: '5d9dd628-c0a3-4fb7-a03d-2a345278ebd5',
      status: 'succeeded',
      capability: 'text',
      createdAt: '2026-09-21T00:00:00.000Z',
      updatedAt: '2026-09-21T00:00:01.000Z',
    };
    const store = createStore(run);
    const get = vi.fn();
    const workflow: WorkflowBinding<WorkflowRunParams> = {
      create: vi.fn(async () => undefined),
      get,
    };

    const controller = new AiRunController(workflow, store);
    const result = await controller.cancel(run.id);

    expect(result).toEqual(run);
    expect(get).not.toHaveBeenCalled();
  });
});
