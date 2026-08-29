import { describe, expect, it } from 'vitest';

import { runWithObservabilityContext } from '../context';
import {
  configureTracing,
  getTraceContext,
  startSpan,
  withSpan,
} from './tracing';

describe('tracing abstraction', () => {
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
});
