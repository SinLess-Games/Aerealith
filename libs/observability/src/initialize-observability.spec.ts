import { afterEach, describe, expect, it } from 'vitest';

import {
  initializeObservability,
  resetObservabilityForTesting,
} from './initialize-observability';

describe('initializeObservability', () => {
  afterEach(() => resetObservabilityForTesting());

  it('initializes optional subsystems safely and is idempotent', async () => {
    const first = initializeObservability({
      service: 'worker',
      environment: 'test',
      logging: { enabled: false },
      sentry: { enabled: false },
      metrics: { enabled: false, collectProcessMetrics: false },
      tracing: { enabled: false },
    });
    const second = initializeObservability({ service: 'ignored' });

    expect(second).toBe(first);
    await expect(first).resolves.toMatchObject({
      config: { service: 'worker', environment: 'test' },
      metricsEnabled: false,
      sentryEnabled: false,
    });
  });
});
