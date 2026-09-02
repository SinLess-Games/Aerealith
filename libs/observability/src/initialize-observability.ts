/** Coordinates one-time startup for every shared observability subsystem. */
import {
  resolveObservabilityConfig,
  toSafeObservabilityConfig,
  type ObservabilityConfigInput,
  type SafeObservabilityConfig,
} from './config';
import { resetHealthChecksForTesting } from './health';
import {
  registerObservabilityShutdownHandler,
  resetObservabilityShutdownForTesting,
} from './lifecycle';
import {
  createLogger,
  resetDefaultLogger,
  setDefaultLogger,
  type ObservabilityLogger,
} from './logger';
import {
  configureMetrics,
  isMetricsEnabled,
  registerProcessMetrics,
  resetMetricsForTesting,
  resetProcessMetricsForTesting,
} from './metrics';
import {
  createNodeLogger,
  startNodeObservability,
  type NodeObservability,
} from './node';
import {
  flushSentry,
  initializeSentry,
  isSentryEnabled,
  resetSentryForTesting,
} from './sentry';
import { configureTracing } from './tracing';

/** Safe handles and status flags returned to the initialized application. */
export interface ObservabilityRuntime {
  readonly config: SafeObservabilityConfig;
  readonly logger: ObservabilityLogger;
  readonly metricsEnabled: boolean;
  readonly sentryEnabled: boolean;
  readonly node?: NodeObservability;
}

// Caching the promise, rather than only the completed value, also deduplicates
// concurrent initialization calls made during module startup.
let initializationPromise: Promise<ObservabilityRuntime> | undefined;

/** Initializes configured observability subsystems once for the process. */
export function initializeObservability(
  input: ObservabilityConfigInput,
): Promise<ObservabilityRuntime> {
  initializationPromise ??= performInitialization(input);
  return initializationPromise;
}

async function performInitialization(
  input: ObservabilityConfigInput,
): Promise<ObservabilityRuntime> {
  const config = resolveObservabilityConfig(input);
  // Build common logger metadata once so Node and runtime-neutral logger paths
  // produce the same record shape.
  const loggerOptions = {
    service: config.service,
    level: config.logging.level,
    ...(config.version === undefined ? {} : { version: config.version }),
    ...(config.instanceId === undefined
      ? {}
      : { instanceId: config.instanceId }),
    ...(config.logging.component === undefined
      ? {}
      : { context: { component: config.logging.component } }),
    console: {
      enabled: config.logging.enabled,
      pretty: config.logging.pretty ?? config.environment !== 'production',
    },
  } as const;
  // Node services can add Loki/exporter support; other runtimes receive the
  // portable logger without importing Node-only infrastructure.
  const configuredLogger = config.node.enabled
    ? createNodeLogger({
        ...loggerOptions,
        environment: config.node.environment,
      })
    : createLogger({
        ...loggerOptions,
        environment: config.environment,
      });
  setDefaultLogger(configuredLogger);

  // Metrics are configured before optional exporters so application metrics
  // remain usable even when external telemetry initialization degrades.
  configureMetrics({
    enabled: config.metrics.enabled,
    service: config.service,
    prefix: config.metrics.prefix,
  });
  if (config.metrics.enabled && config.metrics.collectProcessMetrics) {
    registerProcessMetrics(config.metrics.prefix);
  }

  let nodeObservability: NodeObservability | undefined;
  if (config.node.enabled) {
    try {
      nodeObservability = await startNodeObservability({
        service: config.service,
        environment: config.node.environment,
        onError(error) {
          configuredLogger.warn({
            event: 'observability.exporter.failed',
            message: 'An observability exporter failed.',
            error,
          });
        },
      });
    } catch (error) {
      // Exporters are optional infrastructure: preserve local logs and service
      // startup instead of making telemetry availability a hard dependency.
      configuredLogger.warn({
        event: 'observability.initialization.degraded',
        message: 'Optional Node observability failed to initialize.',
        error,
      });
    }
  }

  configureTracing({
    enabled: config.tracing.enabled,
    service: config.service,
    ...(config.version === undefined ? {} : { version: config.version }),
    ...(nodeObservability === undefined
      ? {}
      : { tracer: nodeObservability.tracer }),
  });

  try {
    initializeSentry({
      service: config.service,
      enabled: config.sentry.enabled,
      dsn: config.sentry.dsn,
      environment: config.sentry.environment ?? config.environment,
      release: config.sentry.release ?? config.version,
      tracesSampleRate: config.sentry.tracesSampleRate,
    });
  } catch (error) {
    // Sentry follows the same fail-open policy as the Node exporters.
    configuredLogger.warn({
      event: 'observability.sentry.initialization.failed',
      message: 'Optional Sentry reporting failed to initialize.',
      error,
    });
  }

  // Central shutdown registration gives services one bounded flush path.
  registerObservabilityShutdownHandler('logger', () =>
    configuredLogger.close(),
  );
  registerObservabilityShutdownHandler('sentry', async () => {
    await flushSentry();
  });
  if (nodeObservability) {
    registerObservabilityShutdownHandler('node-telemetry', () =>
      nodeObservability.shutdown(),
    );
  }

  return {
    // Return only credential-free config; secrets remain inside initialized
    // clients and are never exposed through diagnostics.
    config: toSafeObservabilityConfig(config),
    logger: configuredLogger,
    metricsEnabled: isMetricsEnabled(),
    sentryEnabled: isSentryEnabled(),
    ...(nodeObservability === undefined ? {} : { node: nodeObservability }),
  };
}

/** Resets process globals used by deterministic unit tests. */
export function resetObservabilityForTesting(): void {
  initializationPromise = undefined;
  resetDefaultLogger();
  resetSentryForTesting();
  resetMetricsForTesting();
  resetProcessMetricsForTesting();
  resetHealthChecksForTesting();
  resetObservabilityShutdownForTesting();
}
