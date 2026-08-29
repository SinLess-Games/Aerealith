import { describe, expect, it } from 'vitest';

import { HealthRegistry } from './health-check';
import { HealthStatus } from './health.types';

describe('HealthRegistry', () => {
  it('aggregates healthy and degraded checks with structured durations', async () => {
    const registry = new HealthRegistry({
      now: () => new Date('2026-08-27T12:00:00.000Z'),
      uptime: () => 42,
    });
    registry.register({ name: 'database', check: () => undefined });
    registry.register({
      name: 'cache',
      required: false,
      check: () => ({ status: HealthStatus.Degraded, message: 'warming' }),
    });

    const result = await registry.run();
    expect(result).toMatchObject({
      status: HealthStatus.Degraded,
      timestamp: '2026-08-27T12:00:00.000Z',
      uptime: 42,
      checks: {
        database: { status: HealthStatus.Healthy, required: true },
        cache: {
          status: HealthStatus.Degraded,
          required: false,
          message: 'warming',
        },
      },
    });
  });

  it('marks required failures unhealthy and optional failures degraded', async () => {
    const required = new HealthRegistry();
    required.register({
      name: 'database',
      check: () => {
        throw new Error('postgresql://admin:secret@db/test');
      },
    });
    expect((await required.run()).status).toBe(HealthStatus.Unhealthy);
    expect((await required.run()).checks['database']).toMatchObject({
      message: 'Health check failed.',
      error: { name: 'Error' },
    });

    const optional = new HealthRegistry();
    optional.register({
      name: 'cache',
      required: false,
      check: () => Promise.reject(new Error('offline')),
    });
    expect((await optional.run()).status).toBe(HealthStatus.Degraded);
  });

  it('times out checks and protects duplicate registrations', async () => {
    const registry = new HealthRegistry({ defaultTimeoutMs: 5 });
    registry.register({
      name: 'external-api',
      check: () => new Promise(() => undefined),
    });
    expect(() =>
      registry.register({ name: 'external-api', check: () => undefined }),
    ).toThrow('already registered');

    const result = await registry.run();
    expect(result.checks['external-api']).toMatchObject({
      status: HealthStatus.Unhealthy,
      message: 'Health check timed out.',
      error: { name: 'HealthCheckTimeoutError' },
    });
  });
});
