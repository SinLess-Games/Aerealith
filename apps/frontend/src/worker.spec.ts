import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeatureFlagDefaults } from '@aerealith-ai/core';

import worker, { type FrontendWorkerEnvironment } from './worker';

function createEnvironment(response: Response) {
  return {
    ASSETS: { fetch: vi.fn().mockResolvedValue(response) },
  } satisfies FrontendWorkerEnvironment;
}

describe('frontend worker', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('serves an uncached health response', async () => {
    const environment = createEnvironment(new Response('asset'));
    const response = await worker.fetch(
      new Request('https://aerealith.com/__aerealith/health'),
      environment,
    );
    expect(await response.json()).toEqual({ status: 'ok' });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(environment.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it('delegates application routes to the asset binding', async () => {
    const assetResponse = new Response('<html></html>');
    const environment = createEnvironment(assetResponse);
    const request = new Request('https://aerealith.com/pricing');
    await expect(worker.fetch(request, environment)).resolves.toBe(
      assetResponse,
    );
    expect(environment.ASSETS.fetch).toHaveBeenCalledWith(request);
  });

  it('returns 503 when an auth route has no configured upstream', async () => {
    const environment = createEnvironment(new Response('asset'));
    const response = await worker.fetch(
      new Request('https://aerealith.com/api/V1/auth/me'),
      environment,
    );

    expect(response.status).toBe(503);
    expect(environment.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it('proxies auth API requests to the configured service', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    const environment = {
      ...createEnvironment(new Response('asset')),
      AUTH_SERVICE_URL: 'https://auth.internal',
    };
    const request = new Request('https://aerealith.com/api/V1/auth/me', {
      headers: { cookie: 'aerealith_session=token' },
    });

    await worker.fetch(request, environment);

    const proxiedRequest = fetchMock.mock.calls[0]?.[0] as Request;
    expect(proxiedRequest.url).toBe('https://auth.internal/api/V1/auth/me');
    expect(proxiedRequest.headers.get('cookie')).toBe(
      'aerealith_session=token',
    );
  });

  it('keeps proxied request paths on the configured service origin', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request(
        'https://aerealith.com/api/V1/auth//attacker.invalid/path?next=%2Fme',
      ),
      {
        ...createEnvironment(new Response('asset')),
        AUTH_SERVICE_URL: 'https://auth.internal/base',
      },
    );

    expect(response.status).toBe(200);

    const proxiedRequest = fetchMock.mock.calls[0]?.[0] as Request;
    expect(proxiedRequest.url).toBe(
      'https://auth.internal/api/V1/auth//attacker.invalid/path?next=%2Fme',
    );
  });

  it('prefers the auth Worker binding when one is configured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const boundResponse = Response.json({ ok: true });
    const authWorker = { fetch: vi.fn().mockResolvedValue(boundResponse) };
    const request = new Request('https://aerealith.com/api/V1/auth/me');

    const response = await worker.fetch(request, {
      ...createEnvironment(new Response('asset')),
      AUTH_WORKER: authWorker,
      AUTH_SERVICE_URL: 'https://fallback.invalid',
    });

    expect(response).toBe(boundResponse);
    expect(authWorker.fetch).toHaveBeenCalledWith(request);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('routes the canonical general API surface to its Worker binding', async () => {
    const boundResponse = Response.json({ service: 'api', status: 'ok' });
    const apiWorker = { fetch: vi.fn().mockResolvedValue(boundResponse) };
    const request = new Request(
      'https://aerealith.com/api/V1/services/api/health',
    );

    const response = await worker.fetch(request, {
      ...createEnvironment(new Response('asset')),
      API_WORKER: apiWorker,
    });

    expect(response).toBe(boundResponse);
    expect(apiWorker.fetch).toHaveBeenCalledWith(request);
  });

  it('does not retain a lowercase API compatibility route', async () => {
    const environment = createEnvironment(new Response('asset'));
    const request = new Request(
      'https://aerealith.com/api/v1/services/api/health',
    );

    const response = await worker.fetch(request, environment);

    expect(response.status).toBe(404);
    expect(environment.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it('returns all evaluated Flagship values from the edge endpoint', async () => {
    const getBooleanValue = vi.fn(async (key: string, fallback: boolean) =>
      key === 'registration' ? true : fallback,
    );
    const response = await worker.fetch(
      new Request('https://aerealith.com/api/V1/flags'),
      {
        ...createEnvironment(new Response('asset')),
        FLAGSHIP_FLAGS: { getBooleanValue },
      },
    );
    await expect(response.json()).resolves.toEqual({
      ...FeatureFlagDefaults,
      registration: true,
    });
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('serves maintenance mode before application assets', async () => {
    const environment = {
      ...createEnvironment(new Response('asset')),
      FLAGSHIP_FLAGS: {
        getBooleanValue: vi.fn(async (key: string, fallback: boolean) =>
          key === 'maintenance-mode' ? true : fallback,
        ),
      },
    };
    const response = await worker.fetch(
      new Request('https://aerealith.com/pricing'),
      environment,
    );
    expect(response.status).toBe(503);
    expect(await response.text()).toContain('brief upgrade');
    expect(environment.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it('blocks registration at the proxy when its flag is off', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await worker.fetch(
      new Request('https://aerealith.com/api/V1/auth/sign-up', {
        method: 'POST',
      }),
      {
        ...createEnvironment(new Response('asset')),
        AUTH_SERVICE_URL: 'https://auth.internal',
        FLAGSHIP_FLAGS: {
          getBooleanValue: vi.fn(async (key: string, fallback: boolean) =>
            key === 'registration' ? false : fallback,
          ),
        },
      },
    );
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('emits structured request telemetry only when observability is on', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    await worker.fetch(new Request('https://aerealith.com/about'), {
      ...createEnvironment(new Response('asset')),
      FLAGSHIP_FLAGS: {
        getBooleanValue: vi.fn(async (key: string, fallback: boolean) =>
          key === 'observability' ? true : fallback,
        ),
      },
    });
    expect(info).toHaveBeenCalledWith(
      expect.stringContaining('"event":"frontend.request"'),
    );
    info.mockRestore();
  });
});
