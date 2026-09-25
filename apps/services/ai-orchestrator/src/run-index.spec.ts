import type { RunRecord } from '@aerealith-ai/ai-orchestration';

import { AiRunIndex } from './run-index';

function createIndex() {
  const values = new Map<string, unknown>();
  const ctx = {
    storage: {
      kv: {
        get<T>(key: string): T | undefined {
          return values.get(key) as T | undefined;
        },
        put(key: string, value: unknown) {
          values.set(key, value);
        },
      },
    },
  };

  return new AiRunIndex(ctx as never, {} as never);
}

function run(id: string, createdAt: string): RunRecord {
  return {
    id,
    tenantId: 'user-123',
    actorId: 'user-123',
    status: 'queued',
    capability: 'text',
    createdAt,
    updatedAt: createdAt,
    output: {
      providerId: 'provider',
      modelId: 'model',
      content: 'large-output-is-not-indexed',
    },
  };
}

describe('AiRunIndex', () => {
  it('lists newest runs first without duplicating output payloads', async () => {
    const index = createIndex();

    await index.upsertRun(run('one', '2026-09-21T00:00:00.000Z'));
    await index.upsertRun(run('two', '2026-09-21T00:01:00.000Z'));

    const page = await index.listRuns(10);

    expect(page.items.map((item) => item.id)).toEqual(['two', 'one']);
    expect(page.items[0]).not.toHaveProperty('output');
  });

  it('updates an existing indexed run in place', async () => {
    const index = createIndex();
    const value = run('one', '2026-09-21T00:00:00.000Z');

    await index.upsertRun(value);
    await index.upsertRun({
      ...value,
      status: 'succeeded',
      completedAt: '2026-09-21T00:02:00.000Z',
      updatedAt: '2026-09-21T00:02:00.000Z',
    });

    const page = await index.listRuns(10);

    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      id: 'one',
      status: 'succeeded',
    });
  });
});
