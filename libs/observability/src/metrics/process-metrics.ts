/** Registers standard Node process metrics into the shared registry once. */
import { collectDefaultMetrics } from '@prometheus-io/client';

import { metricsRegistry } from './registry';

let processMetricsRegistered = false;

/** Enables CPU, memory, event-loop, and garbage-collection process metrics. */
export function registerProcessMetrics(
  prefix = 'aerealith_',
  labels: Readonly<Record<string, string>> = {},
): void {
  // The client schedules collectors, so duplicate registration would create
  // duplicate metrics and timers.
  if (processMetricsRegistered) return;
  collectDefaultMetrics({
    register: metricsRegistry,
    prefix,
    labels,
  });
  processMetricsRegistered = true;
}

/** Resets the registration guard used by isolated unit tests. */
export function resetProcessMetricsForTesting(): void {
  processMetricsRegistered = false;
}
