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

export interface HealthRegistryOptions {
  readonly defaultTimeoutMs?: number;
  readonly now?: () => Date;
  readonly uptime?: () => number;
}

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
    if (!name) throw new Error('A health check name is required.');
    if (this.checks.has(name)) {
      throw new Error(`Health check "${name}" is already registered.`);
    }

    this.checks.set(name, { ...definition, name });
    return () => this.unregister(name);
  }

  public unregister(name: string): void {
    this.checks.delete(name.trim());
  }

  public clear(): void {
    this.checks.clear();
  }

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
      const result = await withTimeout(definition.check(), timeoutMs);
      const outcome = normalizeOutcome(result);
      return {
        status: outcome?.status ?? HealthStatus.Healthy,
        required,
        durationMs: timer.end(),
        ...(outcome?.message ? { message: redactText(outcome.message) } : {}),
      };
    } catch (error) {
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
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

function aggregateStatus(
  checks: Readonly<Record<string, HealthCheckResult>>,
): HealthStatus {
  const results = Object.values(checks);
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
  return outcome === undefined ? {} : (outcome as HealthCheckOutcome);
}

function normalizeTimeout(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}
