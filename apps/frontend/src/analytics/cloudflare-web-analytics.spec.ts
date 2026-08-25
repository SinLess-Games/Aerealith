// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadModule(enabled: boolean) {
  vi.resetModules();
  vi.doMock('../integrations/integration-config', () => ({
    integrationConfig: {
      cloudflareWebAnalytics: { enabled, token: 'beacon-token' },
    },
  }));
  return import('./cloudflare-web-analytics');
}

describe('loadCloudflareWebAnalytics', () => {
  afterEach(() => {
    document.head
      .querySelectorAll(
        '[data-aerealith-integration="cloudflare-web-analytics"]',
      )
      .forEach((element) => element.remove());
    vi.resetModules();
  });

  it('does not load when the integration is disabled', async () => {
    expect((await loadModule(false)).loadCloudflareWebAnalytics()).toBe(false);
  });

  it('loads one configured beacon script', async () => {
    const { loadCloudflareWebAnalytics } = await loadModule(true);

    expect(loadCloudflareWebAnalytics()).toBe(true);
    expect(loadCloudflareWebAnalytics()).toBe(false);

    const script = document.head.querySelector<HTMLScriptElement>(
      '[data-aerealith-integration="cloudflare-web-analytics"]',
    );
    expect(script?.defer).toBe(true);
    expect(script?.src).toBe(
      'https://static.cloudflareinsights.com/beacon.min.js',
    );
    expect(JSON.parse(script?.dataset['cfBeacon'] ?? '{}')).toEqual({
      token: 'beacon-token',
      spa: true,
    });
  });
});
