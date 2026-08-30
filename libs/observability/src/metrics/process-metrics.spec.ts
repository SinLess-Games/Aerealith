/** Verifies process metrics registration and its duplicate guard. */
import { afterEach, describe, expect, it } from 'vitest';

import { getMetrics, resetMetricsForTesting } from './metrics';
import {
  registerProcessMetrics,
  resetProcessMetricsForTesting,
} from './process-metrics';

describe('process metrics', () => {
  afterEach(() => {
    resetMetricsForTesting();
    resetProcessMetricsForTesting();
  });

  it('registers default Node metrics with a prefix and labels once', async () => {
    registerProcessMetrics('test_', { service: 'worker' });
    registerProcessMetrics('ignored_');

    const output = await getMetrics();
    expect(output).toContain('test_process_cpu_user_seconds_total');
    expect(output).toContain('service="worker"');
    expect(output).not.toContain('ignored_process_cpu_user_seconds_total');
  });

  it('supports its default prefix and labels', async () => {
    registerProcessMetrics();

    await expect(getMetrics()).resolves.toContain(
      'aerealith_process_cpu_user_seconds_total',
    );
  });
});
