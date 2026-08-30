/** Provides the one Prometheus registry shared by all service instruments. */
import { Registry, type RegistryContentType } from '@prometheus-io/client';

// A single registry is required for consistent default labels and exposition.
export const metricsRegistry = new Registry();

/** Returns the registry for integrations that need direct client access. */
export function getMetricsRegistry(): Registry<RegistryContentType> {
  return metricsRegistry;
}
