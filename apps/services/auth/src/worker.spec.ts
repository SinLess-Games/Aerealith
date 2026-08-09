import { FeatureFlagDefaults } from '@aerealith-ai/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import worker, { type AuthWorkerEnvironment } from './worker';

function environment(
  overrides: Partial<Record<keyof typeof FeatureFlagDefaults, boolean>> = {},
): AuthWorkerEnvironment {
  return {
    DATABASE_URL: {
      get: vi.fn(async () => 'postgres://account-secret'),
    },
    FLAGSHIP_FLAGS: {
      getBooleanValue: vi.fn(async (key: string, fallback: boolean) =>
        key in overrides
          ? (overrides as Record<string, boolean>)[key]
          : fallback,
      ),
    },
    RESEND_API_KEY: {
      get: vi.fn(async () => 're_account_secret'),
    },
  };
}

describe('auth Cloudflare Worker', () => {
  afterEach(() => vi.restoreAllMocks());

  it('keeps health checks available regardless of flags', async () => {
    const response = await worker.fetch(
      new Request('https://auth.aerealith.com/health'),
      environment({ authentication: false, 'maintenance-mode': true }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: 'ok' });
  });

  it('returns a sanitized error when account secrets are unavailable', async () => {
    const workerEnvironment = environment();
    workerEnvironment.DATABASE_URL.get = vi.fn(async () => {
      throw new Error('secret value must not leak');
    });

    const response = await worker.fetch(
      new Request('https://auth.aerealith.com/health'),
      workerEnvironment,
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'SERVICE_CONFIGURATION_UNAVAILABLE',
        message: 'The authentication service is temporarily unavailable.',
      },
    });
  });
  it('uses authentication as a service-wide kill switch', async () => {
    const response = await worker.fetch(
      new Request('https://auth.aerealith.com/api/V1/auth/login'),
      environment({ authentication: false }),
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'AUTHENTICATION_DISABLED' },
    });
  });

  it('blocks signup when registration is off', async () => {
    const response = await worker.fetch(
      new Request('https://auth.aerealith.com/api/V1/auth/sign-up', {
        method: 'POST',
      }),
      environment({ authentication: true, registration: false }),
    );
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'REGISTRATION_DISABLED' },
    });
  });

  it('prioritizes maintenance mode', async () => {
    const response = await worker.fetch(
      new Request('https://auth.aerealith.com/graphql'),
      environment({ authentication: true, 'maintenance-mode': true }),
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'MAINTENANCE_MODE' },
    });
  });

  it('emits structured telemetry when observability is on', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    await worker.fetch(
      new Request('https://auth.aerealith.com/api/V1/auth/login'),
      environment({ authentication: false, observability: true }),
    );
    expect(info).toHaveBeenCalledWith(
      expect.stringContaining('"event":"auth.request"'),
    );
  });
});
