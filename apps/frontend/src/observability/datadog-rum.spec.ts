// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  initializeDatadogRum,
  reportGlobalError,
  resetDatadogForTests,
  sanitizeUrl,
  setDatadogSessionReplayAllowed,
  trackDatadogView,
} from './datadog-rum';

const mocks = vi.hoisted(() => ({
  config: {
    datadog: {
      applicationId: 'application-id',
      clientToken: 'client-token',
      enabled: true,
      environment: 'test',
      service: 'frontend',
      sessionReplaySampleRate: 20,
      sessionSampleRate: 100,
      site: 'datadoghq.com',
      version: '1.2.3',
    },
  },
  rum: {
    addError: vi.fn(),
    init: vi.fn(),
    startSessionReplayRecording: vi.fn(),
    startView: vi.fn(),
    stopSessionReplayRecording: vi.fn(),
  },
}));

vi.mock('../integrations/integration-config', () => ({
  integrationConfig: mocks.config,
}));
vi.mock('@datadog/browser-rum', () => ({ datadogRum: mocks.rum }));

describe('Datadog RUM integration', () => {
  beforeEach(() => {
    resetDatadogForTests();
    mocks.config.datadog.enabled = true;
    for (const method of Object.values(mocks.rum)) method.mockReset();
  });

  it('does not initialize when the integration is disabled', async () => {
    mocks.config.datadog.enabled = false;

    await expect(initializeDatadogRum()).resolves.toBe(false);
    expect(mocks.rum.init).not.toHaveBeenCalled();
  });

  it('deduplicates initialization and configures privacy-safe URL handling', async () => {
    const first = initializeDatadogRum();
    const concurrent = initializeDatadogRum();
    expect(concurrent).toBe(first);

    await expect(first).resolves.toBe(true);
    expect(mocks.rum.init).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId: 'application-id',
        clientToken: 'client-token',
        defaultPrivacyLevel: 'mask-user-input',
        service: 'frontend',
        trackLongTasks: true,
        trackResources: true,
        trackUserInteractions: true,
        trackViewsManually: true,
      }),
    );
    await expect(initializeDatadogRum()).resolves.toBe(false);

    const options = mocks.rum.init.mock.calls[0]![0];
    const event = {
      view: { url: 'https://example.com/account?token=secret#details' },
    };
    expect(options.beforeSend(event)).toBe(true);
    expect(event.view.url).toBe('https://example.com/account');
    expect(options.beforeSend({})).toBe(true);
  });

  it('starts and stops replay only when state changes', async () => {
    setDatadogSessionReplayAllowed(true);
    expect(mocks.rum.startSessionReplayRecording).not.toHaveBeenCalled();

    await initializeDatadogRum();
    setDatadogSessionReplayAllowed(true);
    setDatadogSessionReplayAllowed(true);
    expect(mocks.rum.startSessionReplayRecording).toHaveBeenCalledTimes(1);

    setDatadogSessionReplayAllowed(false);
    setDatadogSessionReplayAllowed(false);
    expect(mocks.rum.stopSessionReplayRecording).toHaveBeenCalledTimes(1);
  });

  it('tracks views and global errors only after initialization', async () => {
    const error = new Error('failure');
    trackDatadogView('/before');
    reportGlobalError(error);
    expect(mocks.rum.startView).not.toHaveBeenCalled();
    expect(mocks.rum.addError).not.toHaveBeenCalled();

    await initializeDatadogRum();
    trackDatadogView('/account');
    reportGlobalError(error);
    expect(mocks.rum.startView).toHaveBeenCalledWith({
      name: '/account',
      service: 'frontend',
    });
    expect(mocks.rum.addError).toHaveBeenCalledWith(error);
  });

  it('removes queries and hashes from absolute and relative URLs', () => {
    expect(sanitizeUrl('https://example.com/path?secret=1#section')).toBe(
      'https://example.com/path',
    );
    expect(sanitizeUrl('/relative?secret=1#section')).toBe(
      `${window.location.origin}/relative`,
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
    expect(sanitizeUrl('not-a-url?secret=1#section')).toBe('not-a-url');
    vi.stubGlobal('URL', OriginalUrl);
  });
});
