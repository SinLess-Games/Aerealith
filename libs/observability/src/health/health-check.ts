/** Runs registered service checks with deadlines and safe result aggregation. */
import { redactText } from '@aerealith-ai/utils';

import { normalizeError } from '../errors';
import { startTimer } from '../performance';
import {
  HealthStatus,
  type HealthCheckDefinition,
  type HealthCheckOutcome,
  type HealthCheckResult,
  type HealthResult,
} from './health.types';

/** Runtime hooks allow deterministic clocks and uptime values in tests. */
export interface HealthRegistryOptions {
  readonly defaultTimeoutMs?: number;
  readonly now?: () => Date;
  readonly uptime?: () => number;
}

/** Mutable registry that owns named health checks for one service context. */
export class HealthRegistry {
  private readonly checks = new Map<string, HealthCheckDefinition>();
  private readonly defaultTimeoutMs: number;
  private readonly now: () => Date;
  private readonly uptime: () => number;

  public constructor(options: HealthRegistryOptions = {}) {
    this.defaultTimeoutMs = normalizeTimeout(options.defaultTimeoutMs, 5_000);
    this.now = options.now ?? (() => new Date());
    this.uptime = options.uptime ?? (() => process.uptime());
  }

  public register(definition: HealthCheckDefinition): () => void {
    const name = definition.name.trim();
    // Names are unique keys in API responses, so duplicates would overwrite
    // results and hide a dependency's true state.
    if (!name) throw new Error('A health check name is required.');
    if (this.checks.has(name)) {
      throw new Error(`Health check "${name}" is already registered.`);
    }

    this.checks.set(name, { ...definition, name });
    // Returning an unregister callback makes component cleanup straightforward.
    return () => this.unregister(name);
  }

  /** Removes a check; deleting an unknown name is intentionally harmless. */
  public unregister(name: string): void {
    this.checks.delete(name.trim());
  }

  /** Removes every check, primarily for lifecycle cleanup and unit tests. */
  public clear(): void {
    this.checks.clear();
  }

  /** Executes independent checks concurrently and aggregates their results. */
  public async run(): Promise<HealthResult> {
    const entries = await Promise.all(
      [...this.checks.entries()].map(
        async ([name, definition]) =>
          [name, await this.runCheck(definition)] as const,
      ),
    );
    const checks = Object.fromEntries(entries);

    return {
      status: aggregateStatus(checks),
      timestamp: this.now().toISOString(),
      uptime: this.uptime(),
      checks,
    };
  }

  private async runCheck(
    definition: HealthCheckDefinition,
  ): Promise<HealthCheckResult> {
    const timer = startTimer();
    const required = definition.required ?? true;
    const timeoutMs = normalizeTimeout(
      definition.timeoutMs,
      this.defaultTimeoutMs,
    );

    try {
      // Promise.race enforces the same upper bound for synchronous and async
      // definitions once their return value is normalized to a promise.
      const result = await withTimeout(definition.check(), timeoutMs);
      const outcome = normalizeOutcome(result);
      return {
        status: outcome?.status ?? HealthStatus.Healthy,
        required,
        durationMs: timer.end(),
        ...(outcome?.message ? { message: redactText(outcome.message) } : {}),
      };
    } catch (error) {
      // Public health responses expose a stable error identity only; detailed
      // messages and stacks belong in protected telemetry.
      const normalized = normalizeError(error);
      return {
        status: HealthStatus.Unhealthy,
        required,
        durationMs: timer.end(),
        message:
          error instanceof HealthCheckTimeoutError
            ? 'Health check timed out.'
            : 'Health check failed.',
        error: {
          name: normalized.name,
          ...(normalized.code === undefined ? {} : { code: normalized.code }),
        },
      };
    }
  }
}

class HealthCheckTimeoutError extends Error {
  public constructor(timeoutMs: number) {
    super(`Health check exceeded ${timeoutMs.toString()}ms.`);
    this.name = 'HealthCheckTimeoutError';
  }
}

async function withTimeout(
  result: void | HealthCheckOutcome | Promise<void | HealthCheckOutcome>,
  timeoutMs: number,
): Promise<void | HealthCheckOutcome> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutResult = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(
      () => reject(new HealthCheckTimeoutError(timeoutMs)),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([Promise.resolve(result), timeoutResult]);
  } finally {
    // Always release the timer so successful checks do not retain event-loop
    // handles until the original deadline.
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

function aggregateStatus(
  checks: Readonly<Record<string, HealthCheckResult>>,
): HealthStatus {
  const results = Object.values(checks);
  // A failed required check makes the service unhealthy. Optional failures and
  // explicitly degraded results reduce status only to degraded.
  if (
    results.some(
      (result) => result.required && result.status === HealthStatus.Unhealthy,
    )
  ) {
    return HealthStatus.Unhealthy;
  }
  if (results.some((result) => result.status !== HealthStatus.Healthy)) {
    return HealthStatus.Degraded;
  }
  return HealthStatus.Healthy;
}

function normalizeOutcome(
  outcome: void | HealthCheckOutcome,
): HealthCheckOutcome {
  // A void callback means the check completed successfully with no message.
  return outcome === undefined ? {} : (outcome as HealthCheckOutcome);
}

function normalizeTimeout(value: number | undefined, fallback: number): number {
  // Invalid per-check values fall back to the registry's known-safe deadline.
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}
