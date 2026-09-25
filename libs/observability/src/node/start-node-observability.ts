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
  readonly profilingMode: 'pyroscope-sdk' | 'disabled';
  readonly meter: Meter;
  readonly tracer: Tracer;
  shutdown(): Promise<void>;
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
  let profiler: typeof import('@pyroscope/nodejs') | undefined;

  if (configuration.pyroscope) {
    try {
      const Pyroscope = await import('@pyroscope/nodejs');
      Pyroscope.init({
        serverAddress: configuration.pyroscope.serverAddress,
        appName: configuration.pyroscope.applicationName,
        ...(configuration.pyroscope.basicAuthUser
          ? { basicAuthUser: configuration.pyroscope.basicAuthUser }
          : {}),
        ...(configuration.pyroscope.basicAuthPassword
          ? { basicAuthPassword: configuration.pyroscope.basicAuthPassword }
          : {}),
        flushIntervalMs: configuration.pyroscope.flushIntervalMs,
        tags: { ...configuration.pyroscope.tags },
        wall: {
          collectCpuTime: configuration.pyroscope.collectCpuTime,
        },
      });
      Pyroscope.start();
      profiler = Pyroscope;
    } catch (error) {
      options.onError?.(error);
    }
  }

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

  return {
    enabled: sdk !== undefined || profiler !== undefined,
    profilingMode: profiler ? 'pyroscope-sdk' : 'disabled',
    meter,
    tracer,
    async shutdown(): Promise<void> {
      const results = await Promise.allSettled([
        ...(sdk ? [sdk.shutdown()] : []),
        ...(profiler ? [profiler.stop()] : []),
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
