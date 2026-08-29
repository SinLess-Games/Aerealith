import { ServiceHealthStatus } from '@aerealith-ai/core';

export const HealthStatus = ServiceHealthStatus;
export type HealthStatus = ServiceHealthStatus;

export interface HealthCheckOutcome {
  readonly status?: HealthStatus;
  readonly message?: string;
}

export interface HealthCheckDefinition {
  readonly name: string;
  readonly required?: boolean;
  readonly timeoutMs?: number;
  readonly check: () =>
    void | HealthCheckOutcome | Promise<void | HealthCheckOutcome>;
}

export interface HealthCheckError {
  readonly name: string;
  readonly code?: string;
}

export interface HealthCheckResult {
  readonly status: HealthStatus;
  readonly required: boolean;
  readonly durationMs: number;
  readonly message?: string;
  readonly error?: HealthCheckError;
}

export interface HealthResult {
  readonly status: HealthStatus;
  readonly timestamp: string;
  readonly uptime: number;
  readonly checks: Readonly<Record<string, HealthCheckResult>>;
}
