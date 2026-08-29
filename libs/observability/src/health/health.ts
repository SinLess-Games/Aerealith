import { HealthRegistry } from './health-check';
import type { HealthCheckDefinition, HealthResult } from './health.types';

const healthRegistry = new HealthRegistry();

export function registerHealthCheck(
  definition: HealthCheckDefinition,
): () => void {
  return healthRegistry.register(definition);
}

export function unregisterHealthCheck(name: string): void {
  healthRegistry.unregister(name);
}

export function runHealthChecks(): Promise<HealthResult> {
  return healthRegistry.run();
}

export function resetHealthChecksForTesting(): void {
  healthRegistry.clear();
}
