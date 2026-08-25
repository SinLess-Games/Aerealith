// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

const baseConfig = {
  adsense: { clientId: '', testMode: false },
  environment: { productionTelemetryAllowed: false },
};

async function loadModule(config = baseConfig) {
  vi.resetModules();
  vi.doMock('../integrations/integration-config', () => ({
    integrationConfig: config,
  }));
  return import('./adsense-loader');
}

describe('loadAdsense', () => {
  afterEach(() => {
    document.head
      .querySelectorAll('[data-aerealith-integration="adsense"]')
      .forEach((element) => element.remove());
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('does not load without a client id or telemetry permission', async () => {
    expect((await loadModule()).loadAdsense()).toBe(false);
    expect(
      (
        await loadModule({
          adsense: { clientId: 'ca-pub-123', testMode: false },
          environment: { productionTelemetryAllowed: false },
        })
      ).loadAdsense(),
    ).toBe(false);
  });

  it('loads once in test mode and encodes the client id', async () => {
    const { loadAdsense } = await loadModule({
      adsense: { clientId: 'ca-pub/a b', testMode: true },
      environment: { productionTelemetryAllowed: false },
    });

    expect(loadAdsense()).toBe(true);
    expect(loadAdsense()).toBe(false);

    const script = document.head.querySelector<HTMLScriptElement>(
      '[data-aerealith-integration="adsense"]',
    );
    expect(script?.async).toBe(true);
    expect(script?.crossOrigin).toBe('anonymous');
    expect(script?.src).toContain('client=ca-pub%2Fa%20b');
  });
});
