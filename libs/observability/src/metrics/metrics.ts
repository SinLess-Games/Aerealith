import {
  Counter,
  Gauge,
  Histogram,
  type CounterConfiguration,
  type GaugeConfiguration,
  type HistogramConfiguration,
} from '@prometheus-io/client';

import { metricsRegistry } from './registry';

export type MetricLabels = Readonly<Record<string, string | number>>;

export interface MetricsConfiguration {
  readonly enabled?: boolean;
  readonly service?: string;
  readonly prefix?: string;
  readonly collectProcessMetrics?: boolean;
}

export interface StandardServiceMetrics {
  readonly errors: Counter<string>;
  readonly operations: Counter<string>;
  readonly operationDuration: Histogram<string>;
  readonly activeOperations: Gauge<string>;
  readonly processUp: Gauge<string>;
}

const counters = new Map<string, Counter<string>>();
const gauges = new Map<string, Gauge<string>>();
const histograms = new Map<string, Histogram<string>>();
const forbiddenLabelNames = new Set([
  'userid',
  'guildid',
  'requestid',
  'correlationid',
  'traceid',
  'spanid',
  'exceptionmessage',
  'message',
  'url',
  'uri',
]);

let metricsEnabled = true;
let standardMetrics: StandardServiceMetrics | undefined;

export function configureMetrics(
  configuration: MetricsConfiguration = {},
): StandardServiceMetrics | undefined {
  metricsEnabled = configuration.enabled ?? true;
  if (!metricsEnabled) return undefined;

  const prefix = normalizePrefix(configuration.prefix ?? 'aerealith_');
  if (configuration.service) {
    metricsRegistry.setDefaultLabels({ service: configuration.service });
  }

  standardMetrics = {
    errors: createCounter({
      name: `${prefix}errors_total`,
      help: 'Total captured errors by component and stable error code.',
      labelNames: ['component', 'code'],
    }),
    operations: createCounter({
      name: `${prefix}operations_total`,
      help: 'Total operations by stable operation name and outcome.',
      labelNames: ['operation', 'outcome'],
    }),
    operationDuration: createHistogram({
      name: `${prefix}operation_duration_seconds`,
      help: 'Operation duration in seconds by stable operation name and outcome.',
      labelNames: ['operation', 'outcome'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    }),
    activeOperations: createGauge({
      name: `${prefix}active_operations`,
      help: 'Operations currently in progress by stable operation name.',
      labelNames: ['operation'],
    }),
    processUp: createGauge({
      name: `${prefix}process_up`,
      help: 'Whether the current process is running.',
    }),
  };
  standardMetrics.processUp.set(1);

  return standardMetrics;
}

export function isMetricsEnabled(): boolean {
  return metricsEnabled;
}

export function getStandardServiceMetrics():
  StandardServiceMetrics | undefined {
  return standardMetrics;
}

export function createCounter(
  configuration: CounterConfiguration<string>,
): Counter<string> {
  assertSafeMetricLabelNames(configuration.labelNames);
  const existing = counters.get(configuration.name);
  if (existing) return existing;

  const registered = metricsRegistry.getSingleMetric(configuration.name);
  if (registered instanceof Counter) {
    const counter = registered as Counter<string>;
    counters.set(configuration.name, counter);
    return counter;
  }
  if (registered) throw metricTypeConflict(configuration.name, 'counter');

  const counter = new Counter({
    ...configuration,
    registers: [metricsRegistry],
  });
  counters.set(configuration.name, counter);
  return counter;
}

export function createGauge(
  configuration: GaugeConfiguration<string>,
): Gauge<string> {
  assertSafeMetricLabelNames(configuration.labelNames);
  const existing = gauges.get(configuration.name);
  if (existing) return existing;

  const registered = metricsRegistry.getSingleMetric(configuration.name);
  if (registered instanceof Gauge) {
    const gauge = registered as Gauge<string>;
    gauges.set(configuration.name, gauge);
    return gauge;
  }
  if (registered) throw metricTypeConflict(configuration.name, 'gauge');

  const gauge = new Gauge({
    ...configuration,
    registers: [metricsRegistry],
  });
  gauges.set(configuration.name, gauge);
  return gauge;
}

export function createHistogram(
  configuration: HistogramConfiguration<string>,
): Histogram<string> {
  assertSafeMetricLabelNames(configuration.labelNames);
  const existing = histograms.get(configuration.name);
  if (existing) return existing;

  const registered = metricsRegistry.getSingleMetric(configuration.name);
  if (registered instanceof Histogram) {
    const histogram = registered as Histogram<string>;
    histograms.set(configuration.name, histogram);
    return histogram;
  }
  if (registered) throw metricTypeConflict(configuration.name, 'histogram');

  const histogram = new Histogram({
    ...configuration,
    registers: [metricsRegistry],
  });
  histograms.set(configuration.name, histogram);
  return histogram;
}

export function incrementCounter(
  counter: Counter<string> | undefined,
  labels: MetricLabels = {},
  value = 1,
): void {
  if (!metricsEnabled || counter === undefined) return;
  counter.inc(labels, value);
}

export function setGauge(
  gauge: Gauge<string> | undefined,
  value: number,
  labels: MetricLabels = {},
): void {
  if (!metricsEnabled || gauge === undefined) return;
  gauge.set(labels, value);
}

export function incrementGauge(
  gauge: Gauge<string> | undefined,
  labels: MetricLabels = {},
  value = 1,
): void {
  if (!metricsEnabled || gauge === undefined) return;
  gauge.inc(labels, value);
}

export function decrementGauge(
  gauge: Gauge<string> | undefined,
  labels: MetricLabels = {},
  value = 1,
): void {
  if (!metricsEnabled || gauge === undefined) return;
  gauge.dec(labels, value);
}

export function observeHistogram(
  histogram: Histogram<string> | undefined,
  value: number,
  labels: MetricLabels = {},
): void {
  if (!metricsEnabled || histogram === undefined) return;
  histogram.observe(labels, value);
}

export async function getMetrics(): Promise<string> {
  return metricsEnabled ? metricsRegistry.metrics() : '';
}

export function getMetricsContentType(): string {
  return metricsRegistry.contentType;
}

export function resetMetricsForTesting(): void {
  metricsRegistry.clear();
  counters.clear();
  gauges.clear();
  histograms.clear();
  standardMetrics = undefined;
  metricsEnabled = true;
}

export const metrics = {
  configure: configureMetrics,
  createCounter,
  createGauge,
  createHistogram,
  incrementCounter,
  setGauge,
  incrementGauge,
  decrementGauge,
  observeHistogram,
  getMetrics,
  getContentType: getMetricsContentType,
};

function assertSafeMetricLabelNames(
  labelNames: readonly string[] | undefined,
): void {
  for (const labelName of labelNames ?? []) {
    const normalized = labelName.replace(/[^a-zA-Z0-9]/gu, '').toLowerCase();
    if (forbiddenLabelNames.has(normalized)) {
      throw new Error(
        `Metric label "${labelName}" is forbidden because it is high-cardinality or sensitive.`,
      );
    }
  }
}

function normalizePrefix(prefix: string): string {
  const normalized = prefix.trim();
  return normalized.endsWith('_') ? normalized : `${normalized}_`;
}

function metricTypeConflict(name: string, expected: string): Error {
  return new Error(
    `Metric "${name}" is already registered with a type other than ${expected}.`,
  );
}
