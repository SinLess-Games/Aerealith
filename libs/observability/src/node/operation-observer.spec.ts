import type { Meter, Tracer } from '@opentelemetry/api';
import { describe, expect, it, vi } from 'vitest';

import { createOperationObserver } from './operation-observer';

describe('createOperationObserver', () => {
  it('records classified failures and closes the span', async () => {
    const add = vi.fn();
    const record = vi.fn();
    const span = {
      setAttribute: vi.fn(),
      setStatus: vi.fn(),
      recordException: vi.fn(),
      end: vi.fn(),
    };
    const meter = {
      createCounter: vi.fn(() => ({ add })),
      createHistogram: vi.fn(() => ({ record })),
    } as unknown as Meter;
    const tracer = {
      startActiveSpan: vi.fn(
        async (_name: string, callback: (value: typeof span) => unknown) =>
          callback(span),
      ),
    } as unknown as Tracer;
    const observer = createOperationObserver('auth', meter, tracer);

    await expect(
      observer.observe(
        'login',
        () => Promise.reject(new Error('private')),
        () => 'INVALID_CREDENTIALS',
      ),
    ).rejects.toThrow('private');

    expect(add).toHaveBeenCalledWith(1, {
      operation: 'login',
      outcome: 'failure',
    });
    expect(add).toHaveBeenCalledWith(1, {
      operation: 'login',
      'error.code': 'INVALID_CREDENTIALS',
    });
    expect(record).toHaveBeenCalled();
    expect(span.end).toHaveBeenCalledOnce();
  });

  it('records success and uses the default code for non-Error failures', async () => {
    const add = vi.fn();
    const record = vi.fn();
    const span = {
      setAttribute: vi.fn(),
      setStatus: vi.fn(),
      recordException: vi.fn(),
      end: vi.fn(),
    };
    const meter = {
      createCounter: vi.fn(() => ({ add })),
      createHistogram: vi.fn(() => ({ record })),
    } as unknown as Meter;
    const tracer = {
      startActiveSpan: vi.fn(
        async (_name: string, callback: (value: typeof span) => unknown) =>
          callback(span),
      ),
    } as unknown as Tracer;
    const observer = createOperationObserver('jobs', meter, tracer);

    await expect(observer.observe('run', async () => 'done')).resolves.toBe(
      'done',
    );
    await expect(
      observer.observe('fail', () => Promise.reject('failed')),
    ).rejects.toBe('failed');

    expect(add).toHaveBeenCalledWith(1, {
      operation: 'run',
      outcome: 'success',
    });
    expect(add).toHaveBeenCalledWith(1, {
      operation: 'fail',
      'error.code': 'INTERNAL_ERROR',
    });
    expect(span.recordException).not.toHaveBeenCalled();
  });
});
