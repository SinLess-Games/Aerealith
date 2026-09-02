/** Public types used to register and report service health checks. */
import { ServiceHealthStatus } from '@aerealith-ai/core';

/** Re-export the canonical core status values for observability consumers. */
export const HealthStatus = ServiceHealthStatus;
export type HealthStatus = ServiceHealthStatus;

/** Optional details returned by a successful health-check callback. */
export interface HealthCheckOutcome {
  readonly status?: HealthStatus;
  readonly message?: string;
}

/** Definition stored by the health registry for one dependency or subsystem. */
export interface HealthCheckDefinition {
  readonly name: string;
  readonly required?: boolean;
  readonly timeoutMs?: number;
  readonly check: () =>
    void | HealthCheckOutcome | Promise<void | HealthCheckOutcome>;
}

/** Safe failure identity; raw messages and stacks are intentionally omitted. */
export interface HealthCheckError {
  readonly name: string;
  readonly code?: string;
}

/** Timed result of one registered check. */
export interface HealthCheckResult {
  readonly status: HealthStatus;
  readonly required: boolean;
  readonly durationMs: number;
  readonly message?: string;
  readonly error?: HealthCheckError;
}

/** Aggregate process-health snapshot returned to a health endpoint. */
export interface HealthResult {
  readonly status: HealthStatus;
  readonly timestamp: string;
  readonly uptime: number;
  readonly checks: Readonly<Record<string, HealthCheckResult>>;
}
