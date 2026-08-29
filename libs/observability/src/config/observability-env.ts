import type { ObservabilityConfigInput } from './observability-config';
import { resolveObservabilityConfig } from './observability-config';
import { LogLevel } from '@aerealith-ai/core';

export interface ObservabilityEnv {
  readonly [key: string]: string | undefined;
}

/** Resolves all supported observability environment variables in one place. */
export function resolveObservabilityConfigFromEnv(
  environment: ObservabilityEnv,
  overrides: Partial<ObservabilityConfigInput> = {},
) {
  const service =
    readOptional(environment, 'OBSERVABILITY_SERVICE_NAME') ??
    readOverrideService(overrides);

  return resolveObservabilityConfig({
    ...overrides,
    service,
    environment:
      readOptional(environment, 'OBSERVABILITY_ENVIRONMENT') ??
      readOptional(environment, 'NODE_ENV') ??
      overrides.environment,
    logging: {
      ...readObject(overrides.logging),
      level:
        readLogLevel(environment, 'OBSERVABILITY_LOG_LEVEL') ??
        readObject(overrides.logging).level,
      pretty:
        readBoolean(environment, 'OBSERVABILITY_PRETTY_LOGS') ??
        readObject(overrides.logging).pretty,
    },
    sentry: {
      ...readObject(overrides.sentry),
      dsn:
        readOptional(environment, 'SENTRY_DSN') ??
        readObject(overrides.sentry).dsn,
      environment:
        readOptional(environment, 'SENTRY_ENVIRONMENT') ??
        readObject(overrides.sentry).environment,
      release:
        readOptional(environment, 'SENTRY_RELEASE') ??
        readObject(overrides.sentry).release,
      tracesSampleRate:
        readNumber(environment, 'SENTRY_TRACES_SAMPLE_RATE') ??
        readObject(overrides.sentry).tracesSampleRate,
    },
    metrics: {
      ...readObject(overrides.metrics),
      enabled:
        readBoolean(environment, 'METRICS_ENABLED') ??
        readObject(overrides.metrics).enabled,
    },
    tracing: {
      ...readObject(overrides.tracing),
      enabled:
        readBoolean(environment, 'TRACING_ENABLED') ??
        readObject(overrides.tracing).enabled,
    },
  });
}

function readOverrideService(
  overrides: Partial<ObservabilityConfigInput>,
): string {
  if (typeof overrides.service !== 'string' || !overrides.service.trim()) {
    throw new Error(
      'OBSERVABILITY_SERVICE_NAME or an explicit service name is required.',
    );
  }
  return overrides.service;
}

function readOptional(
  environment: ObservabilityEnv,
  name: string,
): string | undefined {
  const value = environment[name]?.trim();
  return value ? value : undefined;
}

function readBoolean(
  environment: ObservabilityEnv,
  name: string,
): boolean | undefined {
  const value = readOptional(environment, name)?.toLowerCase();
  if (value === undefined) return undefined;
  if (['1', 'true', 'yes', 'on'].includes(value)) return true;
  if (['0', 'false', 'no', 'off'].includes(value)) return false;
  throw new Error(`${name} must be a boolean value.`);
}

function readNumber(
  environment: ObservabilityEnv,
  name: string,
): number | undefined {
  const value = readOptional(environment, name);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be a number.`);
  return parsed;
}

function readLogLevel(
  environment: ObservabilityEnv,
  name: string,
): LogLevel | undefined {
  const value = readOptional(environment, name);
  if (value === undefined) return undefined;
  const level = Object.values(LogLevel).find(
    (candidate) => candidate === value,
  );
  if (level === undefined) {
    throw new Error(`${name} must be a supported log level.`);
  }
  return level;
}

function readObject<T extends object>(value: T | undefined): Partial<T> {
  return value ?? {};
}
