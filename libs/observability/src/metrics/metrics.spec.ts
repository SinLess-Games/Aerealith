/** Verifies metric registration, mutation, exposition, and label safety. */
import { Counter, Gauge, Histogram } from '@prometheus-io/client';
import { afterEach, describe, expect, it } from 'vitest';

import {
  configureMetrics,
  createCounter,
  createGauge,
  createHistogram,
  getMetrics,
  getMetricsContentType,
  incrementGauge,
  incrementCounter,
  decrementGauge,
  observeHistogram,
  resetMetricsForTesting,
  setGauge,
} from './metrics';
import { resetProcessMetricsForTesting } from './process-metrics';
import { metricsRegistry } from './registry';

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

  it('reuses compatible externally registered instruments', () => {
    const counter = new Counter({
      name: 'external_total',
      help: 'External counter.',
      registers: [metricsRegistry],
    });
    const gauge = new Gauge({
      name: 'external_gauge',
      help: 'External gauge.',
      registers: [metricsRegistry],
    });
    const histogram = new Histogram({
      name: 'external_duration_seconds',
      help: 'External duration.',
      registers: [metricsRegistry],
    });

    expect(createCounter({ name: 'external_total', help: 'Reused.' })).toBe(
      counter,
    );
    expect(createGauge({ name: 'external_gauge', help: 'Reused.' })).toBe(
      gauge,
    );
    expect(
      createHistogram({
        name: 'external_duration_seconds',
        help: 'Reused.',
      }),
    ).toBe(histogram);
  });

  it('rejects every incompatible metric type and safely ignores missing handles', () => {
    createGauge({ name: 'gauge_conflict', help: 'Gauge.' });
    createHistogram({ name: 'histogram_conflict', help: 'Histogram.' });

    expect(() =>
      createCounter({ name: 'gauge_conflict', help: 'Counter.' }),
    ).toThrow('other than counter');
    expect(() =>
      createGauge({ name: 'histogram_conflict', help: 'Gauge.' }),
    ).toThrow('other than gauge');
    expect(() =>
      createHistogram({ name: 'gauge_conflict', help: 'Histogram.' }),
    ).toThrow('other than histogram');

    incrementCounter(undefined);
    setGauge(undefined, 1);
    incrementGauge(undefined);
    decrementGauge(undefined);
    observeHistogram(undefined, 1);
    expect(getMetricsContentType()).toContain('text/plain');
  });
});
