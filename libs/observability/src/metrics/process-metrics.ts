import { collectDefaultMetrics } from '@prometheus-io/client';

import { metricsRegistry } from './registry';

let processMetricsRegistered = false;

export function registerProcessMetrics(
  prefix = 'aerealith_',
  labels: Readonly<Record<string, string>> = {},
): void {
  if (processMetricsRegistered) return;
  collectDefaultMetrics({
    register: metricsRegistry,
    prefix,
    labels,
  });
  processMetricsRegistered = true;
}

export function resetProcessMetricsForTesting(): void {
  processMetricsRegistered = false;
}
