/** Verifies configuration defaults, environment parsing, and secret-safe diagnostics. */
import { LogLevel } from '@aerealith-ai/core';
import { describe, expect, it } from 'vitest';

import {
  resolveObservabilityConfig,
  toSafeObservabilityConfig,
} from './observability-config';
import { resolveObservabilityConfigFromEnv } from './observability-env';

describe('observability configuration', () => {
  it('applies safe optional defaults', () => {
    const config = resolveObservabilityConfig({ service: 'worker' });
    expect(config).toMatchObject({
      service: 'worker',
      environment: 'development',
      logging: { enabled: true, level: LogLevel.Info },
      metrics: { enabled: true },
      tracing: { enabled: true },
      node: { enabled: false },
    });
  });

  it('validates environment settings and omits secrets from diagnostics', () => {
    const config = resolveObservabilityConfigFromEnv({
      OBSERVABILITY_SERVICE_NAME: 'jobs',
      OBSERVABILITY_LOG_LEVEL: 'debug',
      OBSERVABILITY_PRETTY_LOGS: 'false',
      SENTRY_DSN: 'https://public@example.ingest.sentry.io/1',
      SENTRY_TRACES_SAMPLE_RATE: '0.2',
      METRICS_ENABLED: 'true',
    });

    expect(config.logging).toMatchObject({
      level: LogLevel.Debug,
      pretty: false,
    });
    const safe = toSafeObservabilityConfig(config);
    expect(safe.sentry.configured).toBe(true);
    expect(JSON.stringify(safe)).not.toContain('example.ingest.sentry.io');
  });

  it('rejects invalid service names, rates, booleans, and levels', () => {
    expect(() => resolveObservabilityConfig({ service: ' ' })).toThrow();
    expect(() =>
      resolveObservabilityConfig({
        service: 'test',
        sentry: { tracesSampleRate: 2 },
      }),
    ).toThrow();
    expect(() =>
      resolveObservabilityConfigFromEnv({
        OBSERVABILITY_SERVICE_NAME: 'test',
        METRICS_ENABLED: 'sometimes',
      }),
    ).toThrow('METRICS_ENABLED');
    expect(() =>
      resolveObservabilityConfigFromEnv({
        OBSERVABILITY_SERVICE_NAME: 'test',
        OBSERVABILITY_LOG_LEVEL: 'verbose',
      }),
    ).toThrow('OBSERVABILITY_LOG_LEVEL');
  });

  it('retains every credential-free optional diagnostic field', () => {
    const safe = toSafeObservabilityConfig(
      resolveObservabilityConfig({
        service: 'api',
        version: '1.0.0',
        instanceId: 'api-1',
        sentry: {
          dsn: 'https://public@sentry.example/1',
          environment: 'staging',
          release: 'release-1',
        },
      }),
    );

    expect(safe).toMatchObject({
      version: '1.0.0',
      instanceId: 'api-1',
      sentry: {
        configured: true,
        environment: 'staging',
        release: 'release-1',
      },
    });
  });
});
