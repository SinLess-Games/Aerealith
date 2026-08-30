/** Verifies metric registration, mutation, exposition, and label safety. */
import { afterEach, describe, expect, it } from 'vitest';

import {
  configureMetrics,
  createCounter,
  createGauge,
  createHistogram,
  getMetrics,
  incrementCounter,
  observeHistogram,
  resetMetricsForTesting,
  setGauge,
} from './metrics';
import { resetProcessMetricsForTesting } from './process-metrics';

describe('Prometheus metrics', () => {
  afterEach(() => {
    resetMetricsForTesting();
    resetProcessMetricsForTesting();
  });

  it('records counters, gauges, and histograms in the central registry', async () => {
    configureMetrics({ service: 'test', collectProcessMetrics: false });
    const counter = createCounter({
      name: 'test_jobs_total',
      help: 'Completed jobs.',
      labelNames: ['outcome'],
    });
    const gauge = createGauge({
      name: 'test_jobs_active',
      help: 'Active jobs.',
    });
    const histogram = createHistogram({
      name: 'test_job_duration_seconds',
      help: 'Job duration.',
      labelNames: ['outcome'],
    });

    incrementCounter(counter, { outcome: 'success' }, 2);
    setGauge(gauge, 3);
    observeHistogram(histogram, 0.25, { outcome: 'success' });

    const output = await getMetrics();
    expect(output).toContain(
      'test_jobs_total{outcome="success",service="test"} 2',
    );
    expect(output).toContain('test_jobs_active{service="test"} 3');
    expect(output).toContain('test_job_duration_seconds_count');
  });

  it('reuses duplicate definitions and rejects metric type conflicts', () => {
    const first = createCounter({ name: 'duplicate_total', help: 'First.' });
    const second = createCounter({ name: 'duplicate_total', help: 'Second.' });
    expect(second).toBe(first);
    expect(() =>
      createGauge({ name: 'duplicate_total', help: 'Wrong type.' }),
    ).toThrow('already registered');
  });

  it('rejects high-cardinality labels and safely disables helpers', async () => {
    expect(() =>
      createCounter({
        name: 'unsafe_total',
        help: 'Unsafe.',
        labelNames: ['correlation_id'],
      }),
    ).toThrow('forbidden');

    configureMetrics({ enabled: false });
    const counter = createCounter({
      name: 'disabled_total',
      help: 'Disabled.',
    });
    incrementCounter(counter);
    await expect(getMetrics()).resolves.toBe('');
  });
});
