import type { RunRecord } from '@aerealith-ai/ai-orchestration';

import { createRunEventStream } from './run-events';
import type { DurableObjectRunStore } from './run-store';

describe('createRunEventStream', () => {
  it('streams the latest terminal run and closes', async () => {
    const run: RunRecord = {
      id: '5d9dd628-c0a3-4fb7-a03d-2a345278ebd5',
      tenantId: 'user-123',
      actorId: 'user-123',
      status: 'succeeded',
      capability: 'text',
      createdAt: '2026-09-21T00:00:00.000Z',
      updatedAt: '2026-09-21T00:01:00.000Z',
      completedAt: '2026-09-21T00:01:00.000Z',
      providerId: 'cloudflare-workers-ai',
      modelId: '@cf/zai-org/glm-4.7-flash',
    };
    const runs = {
      get: vi.fn(async () => run),
    } as unknown as DurableObjectRunStore;
    const controller = new AbortController();

    const response = createRunEventStream(
      runs,
      run.id,
      controller.signal,
    );

    expect(response.headers.get('content-type')).toContain(
      'text/event-stream',
    );

    const body = await response.text();

    expect(body).toContain('event: run');
    expect(body).toContain('"status":"succeeded"');
    expect(body).toContain('event: complete');
    expect(body).not.toContain('tenantId');
    expect(body).not.toContain('output');
  });
});
