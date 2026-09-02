/** Verifies shutdown runs once, contains partial failures, and honors deadlines. */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  registerObservabilityShutdownHandler,
  resetObservabilityShutdownForTesting,
  shutdownObservability,
} from './shutdown';

describe('observability shutdown', () => {
  afterEach(() => resetObservabilityShutdownForTesting());

  it('is idempotent and reports partial failures', async () => {
    const successful = vi.fn();
    registerObservabilityShutdownHandler('logger', successful);
    registerObservabilityShutdownHandler('reporter', () => {
      throw new Error('flush failed');
    });

    const first = shutdownObservability();
    const second = shutdownObservability();
    expect(second).toBe(first);
    await expect(first).resolves.toMatchObject({
      timedOut: false,
      failures: [{ name: 'reporter', error: { message: 'flush failed' } }],
    });
    expect(successful).toHaveBeenCalledOnce();
  });

  it('returns when a shutdown hook exceeds the deadline', async () => {
    registerObservabilityShutdownHandler(
      'stuck',
      () => new Promise(() => undefined),
    );
    await expect(shutdownObservability(5)).resolves.toEqual({
      timedOut: true,
      failures: [],
    });
  });
});
