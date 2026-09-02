/** Verifies process-wide initialization is safe, optional, and idempotent. */
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

  it('initializes the Node path with complete service metadata', async () => {
    const runtime = await initializeObservability({
      service: 'discord-bot',
      environment: 'production',
      version: '1.0.0',
      instanceId: 'bot-1',
      logging: {
        enabled: false,
        component: 'gateway',
      },
      metrics: {
        enabled: false,
        collectProcessMetrics: false,
      },
      sentry: { enabled: false },
      tracing: { enabled: true },
      node: { enabled: true, environment: {} },
    });

    expect(runtime).toMatchObject({
      config: {
        service: 'discord-bot',
        environment: 'production',
        version: '1.0.0',
        instanceId: 'bot-1',
        node: { enabled: true },
      },
      metricsEnabled: false,
      sentryEnabled: false,
      node: {
        enabled: false,
        profilingEnabled: false,
      },
    });
  });
});
