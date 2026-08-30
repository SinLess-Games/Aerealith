/** Exposes a process-wide health registry through a small functional API. */
import { HealthRegistry } from './health-check';
import type { HealthCheckDefinition, HealthResult } from './health.types';

// Most services need one registry; the class remains exported for isolated use.
const healthRegistry = new HealthRegistry();

/** Registers a check and returns a function that removes that exact check. */
export function registerHealthCheck(
  definition: HealthCheckDefinition,
): () => void {
  return healthRegistry.register(definition);
}

/** Removes a named check from the process registry. */
export function unregisterHealthCheck(name: string): void {
  healthRegistry.unregister(name);
}

/** Executes all registered checks and returns their aggregate status. */
export function runHealthChecks(): Promise<HealthResult> {
  return healthRegistry.run();
}

/** Clears shared state so unit tests do not leak checks between cases. */
export function resetHealthChecksForTesting(): void {
  healthRegistry.clear();
}
