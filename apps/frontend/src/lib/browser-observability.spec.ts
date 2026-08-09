import { beforeEach, describe, expect, it, vi } from 'vitest';

const { initializeFaro } = vi.hoisted(() => ({
  initializeFaro: vi.fn(),
}));
vi.mock('@grafana/faro-web-sdk', () => ({
  getWebInstrumentations: vi.fn(() => []),
  initializeFaro,
}));

import { initializeBrowserObservability } from './browser-observability';

describe('initializeBrowserObservability', () => {
  beforeEach(() => initializeFaro.mockClear());

  it('remains disabled without a collector URL', () => {
    expect(initializeBrowserObservability({})).toBe(false);
    expect(initializeFaro).not.toHaveBeenCalled();
  });

  it('configures a non-persistent browser session', () => {
    expect(
      initializeBrowserObservability({
        VITE_GRAFANA_FARO_URL: 'https://faro.example/collect',
        VITE_APP_ENVIRONMENT: 'production',
        VITE_APP_VERSION: '1.2.3',
      }),
    ).toBe(true);
    expect(initializeFaro).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://faro.example/collect',
        app: expect.objectContaining({
          environment: 'production',
          version: '1.2.3',
        }),
        sessionTracking: { enabled: true, persistent: false },
      }),
    );
  });
});
