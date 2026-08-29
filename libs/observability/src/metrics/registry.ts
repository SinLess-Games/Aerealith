import { Registry, type RegistryContentType } from '@prometheus-io/client';

export const metricsRegistry = new Registry();

export function getMetricsRegistry(): Registry<RegistryContentType> {
  return metricsRegistry;
}
