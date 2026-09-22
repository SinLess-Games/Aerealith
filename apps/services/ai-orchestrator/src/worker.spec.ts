import { afterEach, describe, expect, it, vi } from 'vitest';

import worker from './worker';
import type { AiOrchestratorBindings } from './bindings';

describe('AI orchestrator Worker observability', () => {
  afterEach(() => vi.restoreAllMocks());

  it('records health-request completion metrics', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const writeDataPoint = vi.fn();
    const environment = {
      AEREALITH_ANALYTICS: { writeDataPoint },
      ENVIRONMENT: 'test',
    } as unknown as AiOrchestratorBindings;

    const response = await worker.fetch(
      new Request('https://ai.aerealith.com/health'),
      environment,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      service: 'ai-orchestrator',
      status: 'ok',
      environment: 'test',
    });
    expect(info).toHaveBeenCalledWith(
      expect.stringContaining('"event":"worker.request.completed"'),
    );
    expect(info).toHaveBeenCalledWith(
      expect.stringContaining('"service":"ai-orchestrator"'),
    );
    expect(writeDataPoint).toHaveBeenCalledWith(
      expect.objectContaining({
        indexes: ['ai-orchestrator'],
        blobs: expect.arrayContaining([
          'http_request',
          'GET',
          '/health',
          '200',
          'ok',
        ]),
      }),
    );
  });
});
