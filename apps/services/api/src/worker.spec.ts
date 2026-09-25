import { afterEach, describe, expect, it, vi } from 'vitest';

import worker from './worker';
import type { ApiWorkerBindings } from './main';

describe('API Cloudflare Worker observability', () => {
  afterEach(() => vi.restoreAllMocks());

  it('records health-request completion metrics', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const writeDataPoint = vi.fn();
    const environment = {
      AEREALITH_ANALYTICS: { writeDataPoint },
    } as unknown as ApiWorkerBindings;

    const response = await worker.fetch(
      new Request('https://api.aerealith.com/health'),
      environment,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      service: 'api',
      status: 'ok',
    });
    expect(info).toHaveBeenCalledWith(
      expect.stringContaining('"event":"worker.request.completed"'),
    );
    expect(info).toHaveBeenCalledWith(
      expect.stringContaining('"service":"api"'),
    );
    expect(writeDataPoint).toHaveBeenCalledWith(
      expect.objectContaining({
        indexes: ['api'],
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
