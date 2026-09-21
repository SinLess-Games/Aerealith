import type { RunRecord } from '@aerealith-ai/ai-orchestration';

import { AiRunState, RunOutputTooLargeError } from './run-state';

function createState() {
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

  return new AiRunState(ctx as never, {} as never);
}

function acceptedRun(): RunRecord {
  return {
    id: '5d9dd628-c0a3-4fb7-a03d-2a345278ebd5',
    status: 'accepted',
    capability: 'text',
    createdAt: '2026-09-21T00:00:00.000Z',
    updatedAt: '2026-09-21T00:00:00.000Z',
  };
}

describe('AiRunState', () => {
  it('persists a run and enforces valid lifecycle transitions', async () => {
    const state = createState();
    const run = acceptedRun();

    await expect(state.createRun(run)).resolves.toEqual(run);
    await state.updateStatus('planning');
    await state.updateStatus('queued');
    const running = await state.updateStatus('running');

    expect(running.status).toBe('running');
    expect(running.startedAt).toBeTruthy();

    const succeeded = await state.updateStatus('succeeded', {
      providerId: 'provider-a',
      modelId: 'model-a',
      output: {
        providerId: 'provider-a',
        modelId: 'model-a',
        content: { text: 'done' },
      },
    });

    expect(succeeded.status).toBe('succeeded');
    expect(succeeded.completedAt).toBeTruthy();
    expect(succeeded.output).toMatchObject({
      providerId: 'provider-a',
      modelId: 'model-a',
    });
  });

  it('rejects invalid transitions out of terminal state', async () => {
    const state = createState();

    await state.createRun(acceptedRun());
    await state.updateStatus('failed', {
      errorCode: 'TEST_FAILURE',
    });

    await expect(state.updateStatus('running')).rejects.toThrow(
      'Invalid AI run status transition',
    );
  });

  it('rejects oversized inline results so large output can move to artifacts', async () => {
    const state = createState();

    await state.createRun(acceptedRun());
    await state.updateStatus('planning');
    await state.updateStatus('running');

    await expect(
      state.updateStatus('succeeded', {
        output: {
          providerId: 'provider-a',
          modelId: 'model-a',
          content: 'x'.repeat(600 * 1024),
        },
      }),
    ).rejects.toBeInstanceOf(RunOutputTooLargeError);
  });

  it('makes cancellation idempotent after a terminal state', async () => {
    const state = createState();

    await state.createRun(acceptedRun());
    const cancelled = await state.cancelRun();
    const cancelledAgain = await state.cancelRun();

    expect(cancelled.status).toBe('cancelled');
    expect(cancelledAgain).toEqual(cancelled);
  });
});
