/** Defines and sanitizes the process-wide observability configuration. */
import { LogLevel } from '@aerealith-ai/core';
import { z } from 'zod';

// Reuse the same optional-string rule so whitespace-only identifiers never
// reach log, metric, trace, or Sentry resource metadata.
const optionalNonEmptyString = z.string().trim().min(1).optional();

/** Runtime schema that applies safe defaults and rejects invalid configuration. */
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
        // Prometheus names must start with a letter, underscore, or colon and
        // contain only its supported identifier characters.
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
/** Input permits omitted values that the Zod schema fills with defaults. */
export type ObservabilityConfigInput = z.input<
  typeof observabilityConfigSchema
>;

/** Credential-free configuration shape safe to return in runtime diagnostics. */
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

/** Parses caller input and returns a complete, validated configuration. */
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
      // Expose only whether a DSN exists, never the DSN itself.
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
