import { describe, expect, it } from 'vitest';

import { startNodeObservability } from './start-node-observability';

describe('startNodeObservability', () => {
  it('remains a safe no-op when exporters are not configured', async () => {
    const observability = await startNodeObservability({
      service: 'test',
      environment: {},
    });

    expect(observability.enabled).toBe(false);
    expect(observability.profilingEnabled).toBe(false);
    await expect(observability.shutdown()).resolves.toBeUndefined();
  });
});
