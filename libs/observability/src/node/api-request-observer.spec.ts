import type { Meter } from '@opentelemetry/api';
import { describe, expect, it, vi } from 'vitest';

import { createApiRequestObserver } from './api-request-observer';

describe('createApiRequestObserver', () => {
  it('records active, request, duration, and failure signals', () => {
    const add = vi.fn();
    const record = vi.fn();
    const meter = {
      createCounter: vi.fn(() => ({ add })),
      createHistogram: vi.fn(() => ({ record })),
      createUpDownCounter: vi.fn(() => ({ add })),
    } as unknown as Meter;
    const observer = createApiRequestObserver(meter);
    const request = {
      service: 'auth',
      requestId: 'request-1',
      method: 'POST',
      route: '/api/V1/users/42',
      startedAt: new Date(),
    };

    observer.requestStarted(request);
    observer.requestCompleted({ ...request, durationMs: 12, status: 201 });
    observer.requestStarted(request);
    observer.requestFailed(
      { ...request, durationMs: 8, status: 500 },
      new TypeError('failure'),
    );

    expect(add).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ 'http.route': '/api/V1/users/:id' }),
    );
    expect(add).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ 'error.type': 'TypeError' }),
    );
    expect(record).toHaveBeenCalledWith(
      12,
      expect.objectContaining({ 'http.response.status_code': 201 }),
    );
  });
});
