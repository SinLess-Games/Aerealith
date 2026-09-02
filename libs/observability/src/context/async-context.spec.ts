/** Verifies async context inheritance, concurrency isolation, and ID creation. */
import { describe, expect, it } from 'vitest';

import {
  getCorrelationId,
  getObservabilityContext,
  runWithObservabilityContext,
  updateObservabilityContext,
} from './async-context';

describe('observability async context', () => {
  it('propagates context through nested asynchronous operations', async () => {
    await runWithObservabilityContext(
      { correlationId: 'corr-1', requestId: 'request-1' },
      async () => {
        await Promise.resolve();
        expect(getCorrelationId()).toBe('corr-1');

        await runWithObservabilityContext({ userId: 'user-1' }, async () => {
          await Promise.resolve();
          expect(getObservabilityContext()).toMatchObject({
            correlationId: 'corr-1',
            requestId: 'request-1',
            userId: 'user-1',
          });
        });
      },
    );
  });

  it('isolates concurrent operation contexts', async () => {
    const values = await Promise.all(
      ['one', 'two'].map((value) =>
        runWithObservabilityContext({ correlationId: value }, async () => {
          await new Promise((resolve) => setImmediate(resolve));
          return getCorrelationId();
        }),
      ),
    );

    expect(values).toEqual(['one', 'two']);
    expect(getCorrelationId()).toBeUndefined();
  });

  it('generates and updates correlation context when necessary', () => {
    runWithObservabilityContext({}, () => {
      expect(getCorrelationId()).toMatch(/^corr_/u);
      updateObservabilityContext({ jobId: 'job-1' });
      expect(getObservabilityContext()).toMatchObject({ jobId: 'job-1' });
    });
  });
});
