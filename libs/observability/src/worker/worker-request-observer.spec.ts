import { describe, expect, it, vi } from 'vitest';

import {
  normalizeWorkerRoute,
  recordWorkerRequest,
  type WorkerAnalyticsDataPoint,
} from './worker-request-observer';

describe('recordWorkerRequest', () => {
  it('writes low-cardinality request metrics and structured completion logs', () => {
    const points: WorkerAnalyticsDataPoint[] = [];
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const request = new Request(
      'https://aerealith.com/api/V1/ai/runs/123e4567-e89b-42d3-a456-426614174000',
      {
        method: 'GET',
        headers: {
          'x-request-id': 'request-1',
          'cf-ray': 'ray-1',
        },
      },
    );

    recordWorkerRequest({
      service: 'ai-orchestrator',
      request,
      status: 200,
      durationMs: 12.345,
      analytics: {
        writeDataPoint(dataPoint) {
          points.push(dataPoint);
        },
      },
    });

    expect(points).toEqual([
      {
        indexes: ['ai-orchestrator'],
        blobs: ['http_request', 'GET', '/api/V1/ai/runs/:id', '200', 'ok'],
        doubles: [1, 12.345, 0],
      },
    ]);
    expect(info).toHaveBeenCalledWith(
      expect.stringContaining('"event":"worker.request.completed"'),
    );
    expect(info).toHaveBeenCalledWith(
      expect.stringContaining('"requestId":"request-1"'),
    );

    info.mockRestore();
  });

  it('records failures without serializing error messages', () => {
    const errorLog = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const request = new Request('https://aerealith.com/api/V1/users/42', {
      method: 'POST',
    });

    recordWorkerRequest({
      service: 'api',
      request,
      status: 500,
      durationMs: 5,
      error: new TypeError('secret user content'),
    });

    const serialized = String(errorLog.mock.calls[0]?.[0] ?? '');
    expect(serialized).toContain('"errorType":"TypeError"');
    expect(serialized).not.toContain('secret user content');
    errorLog.mockRestore();
  });
});

describe('normalizeWorkerRoute', () => {
  it('normalizes numeric and UUID path identifiers', () => {
    expect(
      normalizeWorkerRoute(
        '/api/V1/runs/123e4567-e89b-42d3-a456-426614174000/items/123',
      ),
    ).toBe('/api/V1/runs/:id/items/:id');
    expect(
      normalizeWorkerRoute(
        '/api/V1/ai/knowledge-bases/base-slug/documents/customer-upload-abc',
      ),
    ).toBe('/api/V1/ai/knowledge-bases/:id/documents/:id');
    expect(normalizeWorkerRoute('/api/V1/auth/sessions/session-token-like-id')).toBe(
      '/api/V1/auth/sessions/:id',
    );
  });
});
