import type {
  RunRecord,
  RunStatus,
} from '@aerealith-ai/ai-orchestration';

import type { WorkersAiBinding } from '@aerealith-ai/ai-cloudflare-workers';

import type { DurableObjectRunStore } from './run-store';
import { startStreamingTextRun } from './streaming-runtime';

describe('streaming runtime cancellation', () => {
  it('cancels the provider stream and preserves cancelled durable state', async () => {
    let current: RunRecord | undefined;
    const updateStatus = vi.fn(
      async (
        _runId: string,
        status: RunStatus,
        patch: Partial<RunRecord> = {},
      ) => {
        if (!current) throw new Error('run missing');
        current = {
          ...current,
          ...patch,
          id: current.id,
          status,
          createdAt: current.createdAt,
          updatedAt: new Date().toISOString(),
        };
      },
    );
    const runs = {
      async create(run: RunRecord) {
        current = {
          ...run,
          status: 'cancelled',
          completedAt: '2026-09-21T00:00:02.000Z',
        };
      },
      async get() {
        return current;
      },
      updateStatus,
    } as unknown as DurableObjectRunStore;

    const cancel = vi.fn();
    const providerStream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"choices":[{"delta":{"content":"never persisted"}}]}\n\n',
          ),
        );
      },
      cancel,
    });
    const ai = {
      run: vi.fn(async () => providerStream),
    } as unknown as WorkersAiBinding;

    const streaming = await startStreamingTextRun(
      { AI: ai },
      {
        capability: 'text',
        tenantId: 'user-123',
        actorId: 'user-123',
        input: {
          messages: [{ role: 'user', content: 'hello' }],
        },
      },
      runs,
    );

    expect(streaming.run.executionMode).toBe('streaming');

    await expect(streaming.completion).resolves.toBeUndefined();
    await expect(new Response(streaming.stream).text()).resolves.toBe('');
    expect(cancel).toHaveBeenCalled();
    expect(updateStatus).not.toHaveBeenCalled();
    expect(current?.status).toBe('cancelled');
  });
});
