import { beforeEach, describe, expect, it, vi } from 'vitest';

const pyroscope = vi.hoisted(() => ({
  init: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(async () => undefined),
}));

vi.mock('@pyroscope/nodejs', () => ({
  init: pyroscope.init,
  start: pyroscope.start,
  stop: pyroscope.stop,
}));

import { startNodeObservability } from './start-node-observability';

describe('startNodeObservability', () => {
  beforeEach(() => {
    pyroscope.init.mockReset();
    pyroscope.start.mockReset();
    pyroscope.stop.mockReset().mockResolvedValue(undefined);
  });

  it('remains a safe no-op when exporters are not configured', async () => {
    const observability = await startNodeObservability({
      service: 'test',
      environment: {},
    });

    expect(observability.enabled).toBe(false);
    expect(observability.profilingMode).toBe('disabled');
    expect(pyroscope.start).not.toHaveBeenCalled();
    await expect(observability.shutdown()).resolves.toBeUndefined();
  });

  it('starts and flushes Pyroscope when profiling is configured', async () => {
    const observability = await startNodeObservability({
      service: 'api',
      environment: {
        NODE_ENV: 'production',
        OTEL_SERVICE_VERSION: '1.2.3',
        PYROSCOPE_SERVER_ADDRESS: 'https://profiles.example.com',
        PYROSCOPE_BASIC_AUTH_USER: 'stack-user',
        PYROSCOPE_BASIC_AUTH_PASSWORD: 'profile-token',
        PYROSCOPE_WALL_COLLECT_CPU_TIME: 'true',
      },
    });

    expect(observability.enabled).toBe(true);
    expect(observability.profilingMode).toBe('pyroscope-sdk');
    expect(pyroscope.init).toHaveBeenCalledWith(
      expect.objectContaining({
        serverAddress: 'https://profiles.example.com',
        appName: 'aerealith.api',
        basicAuthUser: 'stack-user',
        basicAuthPassword: 'profile-token',
        wall: { collectCpuTime: true },
        tags: expect.objectContaining({
          service: 'api',
          environment: 'production',
          version: '1.2.3',
        }),
      }),
    );
    expect(pyroscope.start).toHaveBeenCalledTimes(1);

    await observability.shutdown();
    expect(pyroscope.stop).toHaveBeenCalledTimes(1);
  });

  it('reports profiler startup failures without crashing the service', async () => {
    const onError = vi.fn();
    pyroscope.start.mockImplementationOnce(() => {
      throw new Error('profiler unavailable');
    });

    const observability = await startNodeObservability({
      service: 'auth',
      environment: {
        PYROSCOPE_SERVER_ADDRESS: 'https://profiles.example.com',
      },
      onError,
    });

    expect(observability.enabled).toBe(false);
    expect(observability.profilingMode).toBe('disabled');
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    await expect(observability.shutdown()).resolves.toBeUndefined();
    expect(pyroscope.stop).not.toHaveBeenCalled();
  });
});
