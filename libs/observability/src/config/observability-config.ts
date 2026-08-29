import { LogLevel } from '@aerealith-ai/core';
import { z } from 'zod';

const optionalNonEmptyString = z.string().trim().min(1).optional();

export const observabilityConfigSchema = z.object({
  service: z.string().trim().min(1),
  environment: z.string().trim().min(1).default('development'),
  version: optionalNonEmptyString,
  instanceId: optionalNonEmptyString,
  logging: z
    .object({
      enabled: z.boolean().default(true),
      level: z.enum(LogLevel).default(LogLevel.Info),
      pretty: z.boolean().optional(),
      component: optionalNonEmptyString,
    })
    .default({ enabled: true, level: LogLevel.Info }),
  sentry: z
    .object({
      enabled: z.boolean().default(true),
      dsn: z.url().optional(),
      environment: optionalNonEmptyString,
      release: optionalNonEmptyString,
      tracesSampleRate: z.number().min(0).max(1).default(0),
    })
    .default({ enabled: true, tracesSampleRate: 0 }),
  metrics: z
    .object({
      enabled: z.boolean().default(true),
      collectProcessMetrics: z.boolean().default(true),
      prefix: z
        .string()
        .trim()
        .regex(/^[a-zA-Z_:][a-zA-Z0-9_:]*$/u)
        .default('aerealith_'),
    })
    .default({
      enabled: true,
      collectProcessMetrics: true,
      prefix: 'aerealith_',
    }),
  tracing: z
    .object({
      enabled: z.boolean().default(true),
    })
    .default({ enabled: true }),
  node: z
    .object({
      enabled: z.boolean().default(false),
      environment: z.record(z.string(), z.string().optional()).optional(),
    })
    .default({ enabled: false }),
});

export type ObservabilityConfig = z.output<typeof observabilityConfigSchema>;
export type ObservabilityConfigInput = z.input<
  typeof observabilityConfigSchema
>;

export interface SafeObservabilityConfig {
  readonly service: string;
  readonly environment: string;
  readonly version?: string;
  readonly instanceId?: string;
  readonly logging: ObservabilityConfig['logging'];
  readonly sentry: {
    readonly enabled: boolean;
    readonly configured: boolean;
    readonly environment?: string;
    readonly release?: string;
    readonly tracesSampleRate: number;
  };
  readonly metrics: ObservabilityConfig['metrics'];
  readonly tracing: ObservabilityConfig['tracing'];
  readonly node: { readonly enabled: boolean };
}

export function resolveObservabilityConfig(
  input: ObservabilityConfigInput,
): ObservabilityConfig {
  return observabilityConfigSchema.parse(input);
}

/** Returns diagnostics that deliberately omit DSNs, headers, and credentials. */
export function toSafeObservabilityConfig(
  config: ObservabilityConfig,
): SafeObservabilityConfig {
  return {
    service: config.service,
    environment: config.environment,
    ...(config.version === undefined ? {} : { version: config.version }),
    ...(config.instanceId === undefined
      ? {}
      : { instanceId: config.instanceId }),
    logging: config.logging,
    sentry: {
      enabled: config.sentry.enabled,
      configured: config.sentry.dsn !== undefined,
      ...(config.sentry.environment === undefined
        ? {}
        : { environment: config.sentry.environment }),
      ...(config.sentry.release === undefined
        ? {}
        : { release: config.sentry.release }),
      tracesSampleRate: config.sentry.tracesSampleRate,
    },
    metrics: config.metrics,
    tracing: config.tracing,
    node: { enabled: config.node.enabled },
  };
}
