/** Verifies configured OpenTelemetry and Pyroscope runtime lifecycle behavior. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const runtimeMocks = vi.hoisted(() => ({
  getMeter: vi.fn(),
  getTracer: vi.fn(),
  createObservableGauge: vi.fn(),
  observe: vi.fn(),
  sdkConstructor: vi.fn(),
  sdkStart: vi.fn(),
  sdkShutdown: vi.fn(() => Promise.resolve()),
  traceExporter: vi.fn(),
  metricExporter: vi.fn(),
  metricReader: vi.fn(),
  autoInstrumentations: vi.fn(() => ({ automatic: true })),
  pyroscopeInit: vi.fn(),
  pyroscopeStart: vi.fn(),
  pyroscopeStop: vi.fn(() => Promise.resolve()),
}));

vi.mock('@opentelemetry/api', () => ({
  metrics: { getMeter: runtimeMocks.getMeter },
  trace: { getTracer: runtimeMocks.getTracer },
}));

vi.mock('@opentelemetry/auto-instrumentations-node', () => ({
  getNodeAutoInstrumentations: runtimeMocks.autoInstrumentations,
}));

vi.mock('@opentelemetry/exporter-metrics-otlp-proto', () => ({
  OTLPMetricExporter: class {
    public constructor(options: unknown) {
      runtimeMocks.metricExporter(options);
    }
  },
}));

vi.mock('@opentelemetry/exporter-trace-otlp-proto', () => ({
  OTLPTraceExporter: class {
    public constructor(options: unknown) {
      runtimeMocks.traceExporter(options);
    }
  },
}));

vi.mock('@opentelemetry/sdk-metrics', () => ({
  PeriodicExportingMetricReader: class {
    public constructor(options: unknown) {
      runtimeMocks.metricReader(options);
    }
  },
}));

vi.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: class {
    public constructor(options: unknown) {
      runtimeMocks.sdkConstructor(options);
    }

    public start(): void {
      runtimeMocks.sdkStart();
    }

    public shutdown(): Promise<void> {
      return runtimeMocks.sdkShutdown();
    }
  },
}));

vi.mock('@pyroscope/nodejs', () => ({
  init: runtimeMocks.pyroscopeInit,
  start: runtimeMocks.pyroscopeStart,
  stop: runtimeMocks.pyroscopeStop,
}));

import { startNodeObservability } from './start-node-observability';

const configuredEnvironment = {
  NODE_ENV: 'production',
  OTEL_SERVICE_VERSION: '1.2.3',
  OTEL_SERVICE_NAMESPACE: 'aerealith',
  OTEL_EXPORTER_OTLP_ENDPOINT: 'https://otlp.example.com/',
  OTEL_EXPORTER_OTLP_HEADERS: 'Authorization=Bearer%20token',
  OTEL_METRIC_EXPORT_INTERVAL: '5000',
  PYROSCOPE_SERVER_ADDRESS: 'https://profiles.example.com/',
  PYROSCOPE_BASIC_AUTH_USER: 'user',
  PYROSCOPE_BASIC_AUTH_PASSWORD: 'password',
  PYROSCOPE_FLUSH_INTERVAL_MS: '4000',
} as const;

describe('configured Node observability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runtimeMocks.sdkShutdown.mockResolvedValue(undefined);
    runtimeMocks.pyroscopeStop.mockResolvedValue(undefined);
    runtimeMocks.createObservableGauge.mockImplementation(() => ({
      addCallback: (
        callback: (result: { observe: typeof runtimeMocks.observe }) => void,
      ) => callback({ observe: runtimeMocks.observe }),
    }));
    runtimeMocks.getMeter.mockReturnValue({
      createObservableGauge: runtimeMocks.createObservableGauge,
    });
    runtimeMocks.getTracer.mockReturnValue({ tracer: true });
  });

  it('starts exporters, runtime metrics, profiling, and shuts them down', async () => {
    const observability = await startNodeObservability({
      service: 'discord-bot',
      environment: configuredEnvironment,
    });

    expect(observability).toMatchObject({
      enabled: true,
      profilingEnabled: true,
    });
    expect(runtimeMocks.traceExporter).toHaveBeenCalledWith({
      headers: { Authorization: 'Bearer token' },
      url: 'https://otlp.example.com/v1/traces',
    });
    expect(runtimeMocks.metricExporter).toHaveBeenCalledWith({
      headers: { Authorization: 'Bearer token' },
      url: 'https://otlp.example.com/v1/metrics',
    });
    expect(runtimeMocks.sdkStart).toHaveBeenCalledOnce();
    expect(runtimeMocks.createObservableGauge).toHaveBeenCalledTimes(2);
    expect(runtimeMocks.observe).toHaveBeenCalledTimes(5);
    expect(runtimeMocks.pyroscopeInit).toHaveBeenCalledWith(
      expect.objectContaining({
        appName: 'discord-bot',
        tags: {
          environment: 'production',
          namespace: 'aerealith',
          version: '1.2.3',
        },
      }),
    );

    await observability.shutdown();
    expect(runtimeMocks.pyroscopeStop).toHaveBeenCalledOnce();
    expect(runtimeMocks.sdkShutdown).toHaveBeenCalledOnce();
  });

  it('reports every rejected shutdown without rejecting the caller', async () => {
    const onError = vi.fn();
    runtimeMocks.pyroscopeStop.mockRejectedValueOnce(
      new Error('profile shutdown failed'),
    );
    runtimeMocks.sdkShutdown.mockRejectedValueOnce(
      new Error('sdk shutdown failed'),
    );
    const observability = await startNodeObservability({
      service: 'discord-bot',
      environment: configuredEnvironment,
      onError,
    });

    await expect(observability.shutdown()).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it('reports profiling initialization failures as optional', async () => {
    const onError = vi.fn();
    const failure = new Error('profiling unavailable');
    runtimeMocks.pyroscopeInit.mockImplementationOnce(() => {
      throw failure;
    });

    const observability = await startNodeObservability({
      service: 'discord-bot',
      environment: {
        PYROSCOPE_SERVER_ADDRESS: 'https://profiles.example.com',
        PYROSCOPE_BASIC_AUTH_USER: 'user',
        PYROSCOPE_BASIC_AUTH_PASSWORD: 'password',
      },
      onError,
    });

    expect(observability.enabled).toBe(false);
    expect(onError).toHaveBeenCalledWith(failure);
    await observability.shutdown();
  });
});
