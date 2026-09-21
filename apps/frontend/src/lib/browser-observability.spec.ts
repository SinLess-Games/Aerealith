// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { faro, initializeFaro, pause, pushError, pushEvent, unpause } = vi.hoisted(
  () => ({
    faro: {
      api: undefined as
        | undefined
        | {
            pushError: (...args: unknown[]) => unknown;
            pushEvent: (...args: unknown[]) => unknown;
          },
    },
    initializeFaro: vi.fn(),
    pause: vi.fn(),
    pushError: vi.fn(),
    pushEvent: vi.fn(),
    unpause: vi.fn(),
  }),
);

vi.mock('@grafana/faro-web-sdk', () => ({
  faro: {
    get api() {
      return faro.api;
    },
    pause,
    unpause,
  },
  getWebInstrumentations: vi.fn(() => []),
  initializeFaro,
}));

import {
  initializeBrowserObservability,
  recordBrowserError,
  recordBrowserEvent,
  sanitizeBrowserTelemetryUrl,
  setBrowserObservabilityPaused,
} from './browser-observability';

describe('browser observability', () => {
  beforeEach(() => {
    faro.api = undefined;
    initializeFaro.mockClear();
    pause.mockClear();
    unpause.mockClear();
    pushError.mockClear();
    pushEvent.mockClear();
  });

  it('remains disabled without a collector URL', () => {
    expect(initializeBrowserObservability({})).toBe(false);
    expect(initializeFaro).not.toHaveBeenCalled();
  });

  it('reads the compiled environment when no override is supplied', () => {
    expect(initializeBrowserObservability()).toBe(false);
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

  it('sanitizes page URLs and ignores sensitive resource URLs', () => {
    initializeBrowserObservability({
      VITE_GRAFANA_FARO_URL: 'https://faro.example/collect',
    });

    const options = initializeFaro.mock.calls[0]![0];
    const item = {
      meta: {
        page: {
          url: 'https://aerealith.com/reset-password?token=secret#form',
        },
      },
    };

    expect(options.beforeSend(item)).toBe(item);
    expect(item.meta.page.url).toBe('https://aerealith.com/reset-password');
    expect(options.ignoreUrls[0].test('/api/data?token=secret')).toBe(true);
    expect(options.ignoreUrls[0].test('/api/data?view=summary')).toBe(false);
  });

  it('sanitizes relative and malformed telemetry URLs', () => {
    expect(sanitizeBrowserTelemetryUrl('/account?token=secret#details')).toBe(
      `${window.location.origin}/account`,
    );

    const OriginalUrl = URL;
    vi.stubGlobal(
      'URL',
      class ThrowingUrl {
        constructor() {
          throw new Error('invalid');
        }
      },
    );
    expect(sanitizeBrowserTelemetryUrl('bad?token=secret#details')).toBe('bad');
    vi.stubGlobal('URL', OriginalUrl);
  });

  it('normalizes the collector URL and defaults blank application labels', () => {
    expect(
      initializeBrowserObservability({
        VITE_GRAFANA_FARO_URL: '  https://faro.example/collect  ',
        VITE_APP_ENVIRONMENT: ' ',
        VITE_APP_VERSION: ' ',
      }),
    ).toBe(true);
    expect(initializeFaro).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://faro.example/collect',
        app: expect.objectContaining({
          environment: 'development',
          version: 'development',
        }),
      }),
    );
  });

  it('does not initialize Faro twice', () => {
    faro.api = { pushError, pushEvent };

    expect(
      initializeBrowserObservability({
        VITE_GRAFANA_FARO_URL: 'https://faro.example/collect',
      }),
    ).toBe(true);
    expect(initializeFaro).not.toHaveBeenCalled();
  });

  it('pauses and resumes an initialized Faro client', () => {
    faro.api = { pushError, pushEvent };

    setBrowserObservabilityPaused(true);
    setBrowserObservabilityPaused(false);

    expect(pause).toHaveBeenCalledTimes(1);
    expect(unpause).toHaveBeenCalledTimes(1);
  });

  it('records bounded product events only after Faro is active', () => {
    recordBrowserEvent('ignored', { surface: 'chat' }, 'ai');
    expect(pushEvent).not.toHaveBeenCalled();

    faro.api = { pushError, pushEvent };
    recordBrowserEvent('ai_chat_completed', { responseMode: 'streaming' }, 'ai');

    expect(pushEvent).toHaveBeenCalledWith(
      'ai_chat_completed',
      { responseMode: 'streaming' },
      'ai',
    );
  });

  it('records handled errors only after Faro is active', () => {
    faro.api = { pushError, pushEvent };
    const error = new Error('render failed');

    recordBrowserError(error, { surface: 'global-route-boundary' });

    expect(pushError).toHaveBeenCalledWith(error, {
      context: { surface: 'global-route-boundary' },
    });
  });
});
