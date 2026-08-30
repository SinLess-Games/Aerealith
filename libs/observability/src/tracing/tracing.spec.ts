/** Verifies tracing context, span lifecycle, and failure behavior. */
import {
  SpanStatusCode,
  type Span,
  type SpanContext,
  type Tracer,
} from '@opentelemetry/api';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { runWithObservabilityContext } from '../context';
import {
  configureTracing,
  getTraceContext,
  isTracingEnabled,
  startSpan,
  withSpan,
} from './tracing';

describe('tracing abstraction', () => {
  afterEach(() => {
    // Leave the process-wide tracer disabled for unrelated test files.
    configureTracing({ enabled: false, service: 'test' });
  });

  it('executes operations and exposes context when tracing is disabled', async () => {
    configureTracing({ enabled: false, service: 'test' });
    await expect(withSpan('operation', async () => 'result')).resolves.toBe(
      'result',
    );
    const handle = startSpan('inactive');
    expect(handle.span).toBeUndefined();
    expect(handle.run(() => 'value')).toBe('value');
    expect(() => handle.end()).not.toThrow();
  });

  it('falls back to operation trace context without a provider', () => {
    configureTracing({ enabled: false, service: 'test' });
    runWithObservabilityContext(
      { traceId: 'trace-1', spanId: 'span-1' },
      () => {
        expect(getTraceContext()).toEqual({
          traceId: 'trace-1',
          spanId: 'span-1',
        });
      },
    );
  });

  it('ends enabled synchronous and asynchronous spans successfully', async () => {
    const span = createSpan();
    const tracer = createTracer(span);
    configureTracing({ enabled: true, service: 'test', tracer });

    expect(isTracingEnabled()).toBe(true);
    expect(
      withSpan('sync-operation', () => {
        expect(getTraceContext()).toEqual({
          traceId: 'trace-1',
          spanId: 'span-1',
        });
        return 'sync-result';
      }),
    ).toBe('sync-result');
    await expect(
      withSpan('async-operation', async () => 'async-result'),
    ).resolves.toBe('async-result');

    expect(tracer.startActiveSpan).toHaveBeenCalledTimes(2);
    expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
    expect(span.end).toHaveBeenCalledTimes(2);
  });

  it('records synchronous and asynchronous failures before rethrowing', async () => {
    const span = createSpan();
    configureTracing({
      enabled: true,
      service: 'test',
      tracer: createTracer(span),
    });
    const synchronousFailure = new Error('sync failed');

    expect(() =>
      withSpan('sync-failure', () => {
        throw synchronousFailure;
      }),
    ).toThrow(synchronousFailure);
    await expect(
      withSpan('async-failure', async () => {
        throw 'async failed';
      }),
    ).rejects.toBe('async failed');

    expect(span.recordException).toHaveBeenCalledTimes(2);
    expect(span.recordException).toHaveBeenNthCalledWith(1, synchronousFailure);
    expect(span.recordException.mock.calls[1]?.[0]).toBeInstanceOf(Error);
    expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
    expect(span.end).toHaveBeenCalledTimes(2);
  });

  it('exposes an idempotent manual span handle', () => {
    const span = createSpan();
    const tracer = createTracer(span);
    configureTracing({ enabled: true, service: 'test', tracer });

    const handle = startSpan('manual', { attributes: { operation: 'test' } });
    handle.setAttribute('result', 'ok');
    handle.recordException(new Error('recorded'));
    expect(handle.run(() => getTraceContext())).toEqual({
      traceId: 'trace-1',
      spanId: 'span-1',
    });
    handle.end();
    handle.end();

    expect(handle).toMatchObject({
      span,
      traceId: 'trace-1',
      spanId: 'span-1',
    });
    expect(tracer.startSpan).toHaveBeenCalledWith('manual', {
      attributes: { operation: 'test' },
    });
    expect(span.setAttribute).toHaveBeenCalledWith('result', 'ok');
    expect(span.recordException).toHaveBeenCalledOnce();
    expect(span.end).toHaveBeenCalledOnce();
  });

  it('treats non-promises as synchronous span results', () => {
    const span = createSpan();
    configureTracing({
      enabled: true,
      service: 'test',
      tracer: createTracer(span),
    });

    expect(withSpan('null-result', () => null)).toBeNull();
    expect(withSpan('plain-then', () => ({ then: 'not-a-function' }))).toEqual({
      then: 'not-a-function',
    });
  });
});

function createSpan(
  spanContext: SpanContext = {
    traceId: 'trace-1',
    spanId: 'span-1',
    traceFlags: 1,
  },
): Span & {
  setStatus: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  recordException: ReturnType<typeof vi.fn>;
  setAttribute: ReturnType<typeof vi.fn>;
} {
  return {
    spanContext: vi.fn(() => spanContext),
    setStatus: vi.fn(),
    end: vi.fn(),
    recordException: vi.fn(),
    setAttribute: vi.fn(),
  } as unknown as Span & {
    setStatus: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
    recordException: ReturnType<typeof vi.fn>;
    setAttribute: ReturnType<typeof vi.fn>;
  };
}

function createTracer(span: Span): Tracer & {
  startActiveSpan: ReturnType<typeof vi.fn>;
  startSpan: ReturnType<typeof vi.fn>;
} {
  return {
    startActiveSpan: vi.fn(
      (
        _name: string,
        _options: unknown,
        callback: (activeSpan: Span) => unknown,
      ) => callback(span),
    ),
    startSpan: vi.fn(() => span),
  } as unknown as Tracer & {
    startActiveSpan: ReturnType<typeof vi.fn>;
    startSpan: ReturnType<typeof vi.fn>;
  };
}
