/** Verifies the process-wide functional health-check facade. */
import { afterEach, describe, expect, it } from 'vitest';

import {
  registerHealthCheck,
  resetHealthChecksForTesting,
  runHealthChecks,
  unregisterHealthCheck,
} from './health';
import { HealthStatus } from './health.types';

describe('health facade', () => {
  afterEach(() => resetHealthChecksForTesting());

  it('registers, executes, unregisters, and disposes shared checks', async () => {
    const dispose = registerHealthCheck({
      name: 'database',
      check: () => ({ status: HealthStatus.Healthy }),
    });

    expect(await runHealthChecks()).toMatchObject({
      status: HealthStatus.Healthy,
      checks: { database: { status: HealthStatus.Healthy } },
    });

    dispose();
    expect((await runHealthChecks()).checks).toEqual({});

    registerHealthCheck({ name: 'cache', check: () => undefined });
    unregisterHealthCheck('cache');
    expect((await runHealthChecks()).checks).toEqual({});
  });
});
