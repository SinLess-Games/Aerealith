import { metrics, trace, type Meter, type Tracer } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';

import {
  otlpSignalEndpoint,
  resolveNodeObservabilityConfiguration,
  type ObservabilityEnvironment,
} from './node-observability.config';

export interface StartNodeObservabilityOptions {
  readonly service: string;
  readonly environment?: ObservabilityEnvironment;
  readonly onError?: (error: unknown) => void;
}

export interface NodeObservability {
  readonly enabled: boolean;
  readonly profilingEnabled: boolean;
  readonly meter: Meter;
  readonly tracer: Tracer;
  shutdown(): Promise<void>;
}

interface PyroscopeRuntime {
  init(config: {
    appName: string;
    serverAddress: string;
    basicAuthUser: string;
    basicAuthPassword: string;
    flushIntervalMs: number;
    tags: Record<string, string>;
    wall: { collectCpuTime: boolean };
  }): void;
  start(): void;
  stop(): Promise<void>;
}

export async function startNodeObservability(
  options: StartNodeObservabilityOptions,
): Promise<NodeObservability> {
  const environment = options.environment ?? process.env;
  const configuration = resolveNodeObservabilityConfiguration(
    options.service,
    environment,
  );
  const meter = metrics.getMeter(options.service, configuration.version);
  const tracer = trace.getTracer(options.service, configuration.version);
  let sdk: NodeSDK | undefined;
  let pyroscope: PyroscopeRuntime | undefined;

  if (configuration.otlp) {
    const exporterOptions = {
      headers: { ...configuration.otlp.headers },
    };
    sdk = new NodeSDK({
      serviceName: configuration.service,
      traceExporter: new OTLPTraceExporter({
        ...exporterOptions,
        url: otlpSignalEndpoint(configuration.otlp.endpoint, 'traces'),
      }),
      metricReaders: [
        new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({
            ...exporterOptions,
            url: otlpSignalEndpoint(configuration.otlp.endpoint, 'metrics'),
          }),
          exportIntervalMillis: configuration.otlp.metricExportIntervalMs,
        }),
      ],
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
      ],
    });
    sdk.start();
    registerRuntimeMetrics(meter);
  }

  if (configuration.pyroscope) {
    try {
      pyroscope = (await import('@pyroscope/nodejs')) as PyroscopeRuntime;
      pyroscope.init({
        appName: configuration.pyroscope.applicationName,
        serverAddress: configuration.pyroscope.endpoint,
        basicAuthUser: configuration.pyroscope.user,
        basicAuthPassword: configuration.pyroscope.password,
        flushIntervalMs: configuration.pyroscope.flushIntervalMs,
        tags: {
          environment: configuration.environment,
          namespace: configuration.namespace,
          ...(configuration.version ? { version: configuration.version } : {}),
        },
        wall: {
          collectCpuTime: configuration.pyroscope.collectCpuTime,
        },
      });
      pyroscope.start();
    } catch (error) {
      options.onError?.(error);
    }
  }

  return {
    enabled: sdk !== undefined,
    profilingEnabled: pyroscope !== undefined,
    meter,
    tracer,
    async shutdown(): Promise<void> {
      const results = await Promise.allSettled([
        ...(pyroscope ? [pyroscope.stop()] : []),
        ...(sdk ? [sdk.shutdown()] : []),
      ]);
      for (const result of results) {
        if (result.status === 'rejected') options.onError?.(result.reason);
      }
    },
  };
}

function registerRuntimeMetrics(meter: Meter): void {
  meter
    .createObservableGauge('process.runtime.nodejs.uptime', {
      description: 'Node.js process uptime in seconds.',
      unit: 's',
    })
    .addCallback((result) => result.observe(process.uptime()));

  const memoryGauge = meter.createObservableGauge(
    'process.runtime.nodejs.memory.usage',
    {
      description: 'Node.js process memory usage by category.',
      unit: 'By',
    },
  );
  memoryGauge.addCallback((result) => {
    const memory = process.memoryUsage();
    result.observe(memory.rss, { type: 'rss' });
    result.observe(memory.heapTotal, { type: 'heap_total' });
    result.observe(memory.heapUsed, { type: 'heap_used' });
    result.observe(memory.external, { type: 'external' });
  });
}
