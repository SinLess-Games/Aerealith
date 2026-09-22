import * as Pyroscope from '@pyroscope/nodejs';
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
  let profilerStarted = false;

  if (configuration.pyroscope) {
    try {
      Pyroscope.init({
        serverAddress: configuration.pyroscope.serverAddress,
        appName: configuration.pyroscope.applicationName,
        basicAuthUser: configuration.pyroscope.basicAuthUser,
        basicAuthPassword: configuration.pyroscope.basicAuthPassword,
        flushIntervalMs: configuration.pyroscope.flushIntervalMs,
        tags: { ...configuration.pyroscope.tags },
        wall: {
          collectCpuTime: configuration.pyroscope.collectCpuTime,
        },
      });
      Pyroscope.start();
      profilerStarted = true;
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
    enabled: sdk !== undefined || profilerStarted,
    profilingMode: profilerStarted ? 'pyroscope-sdk' : 'disabled',
    meter,
    tracer,
    async shutdown(): Promise<void> {
      const results = await Promise.allSettled([
        ...(sdk ? [sdk.shutdown()] : []),
        ...(profilerStarted ? [Pyroscope.stop()] : []),
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
