import type {
  RunRecord,
  RunStatus,
} from '@aerealith-ai/ai-orchestration';

import type {
  RunStateNamespace,
  RunStateStub,
} from './bindings';
import { DurableObjectRunStore } from './run-store';

function createNamespace() {
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
          if (!current) {
            throw new Error('missing run');
          }

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
          if (!current) {
            throw new Error('missing run');
          }

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

describe('DurableObjectRunStore', () => {
  it('persists and retrieves a run through the namespace', async () => {
    const { namespace } = createNamespace();
    const store = new DurableObjectRunStore(namespace);
    const run: RunRecord = {
      id: '5d9dd628-c0a3-4fb7-a03d-2a345278ebd5',
      status: 'accepted',
      capability: 'text',
      createdAt: '2026-09-21T00:00:00.000Z',
      updatedAt: '2026-09-21T00:00:00.000Z',
    };

    await store.create(run);

    await expect(store.get(run.id)).resolves.toEqual(run);
  });

  it('updates run status without changing immutable identity fields', async () => {
    const { namespace } = createNamespace();
    const store = new DurableObjectRunStore(namespace);
    const run: RunRecord = {
      id: '5d9dd628-c0a3-4fb7-a03d-2a345278ebd5',
      status: 'accepted',
      capability: 'code',
      createdAt: '2026-09-21T00:00:00.000Z',
      updatedAt: '2026-09-21T00:00:00.000Z',
    };

    await store.create(run);
    await store.updateStatus(run.id, 'running', {
      providerId: 'provider-a',
      modelId: 'model-a',
    });

    await expect(store.get(run.id)).resolves.toMatchObject({
      id: run.id,
      createdAt: run.createdAt,
      status: 'running',
      providerId: 'provider-a',
      modelId: 'model-a',
    });
  });
});
