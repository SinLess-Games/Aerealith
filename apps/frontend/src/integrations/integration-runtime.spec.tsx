// @vitest-environment jsdom
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IntegrationRuntime } from './integration-runtime';

const mocks = vi.hoisted(() => ({
  config: { datadog: { enabled: true } },
  initializeDatadogRum: vi.fn<() => Promise<boolean>>(),
  loadCloudflareWebAnalytics: vi.fn(),
  loadGoogleTagManager: vi.fn(),
  preferences: { analytics: false, sessionReplay: false },
  reportGlobalError: vi.fn(),
  setDatadogSessionReplayAllowed: vi.fn(),
}));

vi.mock('../analytics/cloudflare-web-analytics', () => ({
  loadCloudflareWebAnalytics: mocks.loadCloudflareWebAnalytics,
}));
vi.mock('../analytics/google-tag-manager', () => ({
  loadGoogleTagManager: mocks.loadGoogleTagManager,
}));
vi.mock('../consent/consent-context', () => ({
  useConsent: () => ({ preferences: mocks.preferences }),
}));
vi.mock('../observability/datadog-rum', () => ({
  initializeDatadogRum: mocks.initializeDatadogRum,
  reportGlobalError: mocks.reportGlobalError,
  setDatadogSessionReplayAllowed: mocks.setDatadogSessionReplayAllowed,
}));
vi.mock('./integration-config', () => ({ integrationConfig: mocks.config }));

describe('IntegrationRuntime', () => {
  beforeEach(() => {
    mocks.preferences.analytics = false;
    mocks.preferences.sessionReplay = false;
    mocks.config.datadog.enabled = true;
    mocks.initializeDatadogRum.mockReset().mockResolvedValue(true);
    mocks.loadCloudflareWebAnalytics.mockReset();
    mocks.loadGoogleTagManager.mockReset();
    mocks.reportGlobalError.mockReset();
    mocks.setDatadogSessionReplayAllowed.mockReset();
  });

  it('keeps optional integrations disabled without analytics consent', () => {
    const { container } = render(<IntegrationRuntime />);

    expect(container.innerHTML).toBe('');
    expect(mocks.loadGoogleTagManager).not.toHaveBeenCalled();
    expect(mocks.loadCloudflareWebAnalytics).not.toHaveBeenCalled();
    expect(mocks.initializeDatadogRum).not.toHaveBeenCalled();
    expect(mocks.setDatadogSessionReplayAllowed).toHaveBeenCalledWith(false);
  });

  it('loads consented integrations and applies replay preference after initialization', async () => {
    mocks.preferences.analytics = true;
    mocks.preferences.sessionReplay = true;
    render(<IntegrationRuntime />);

    expect(mocks.loadGoogleTagManager).toHaveBeenCalled();
    expect(mocks.loadCloudflareWebAnalytics).toHaveBeenCalled();
    expect(mocks.initializeDatadogRum).toHaveBeenCalled();
    await waitFor(() =>
      expect(mocks.setDatadogSessionReplayAllowed).toHaveBeenCalledWith(true),
    );
  });

  it('reports browser errors and rejected promises, including non-Error payloads', () => {
    mocks.preferences.analytics = true;
    const removeEventListener = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<IntegrationRuntime />);

    const browserError = new Error('browser failure');
    act(() =>
      window.dispatchEvent(new ErrorEvent('error', { error: browserError })),
    );

    const rejection = new Event('unhandledrejection') as Event & {
      reason: unknown;
    };
    rejection.reason = new Error('promise failure');
    act(() => window.dispatchEvent(rejection));

    act(() =>
      window.dispatchEvent(new ErrorEvent('error', { error: 'failure' })),
    );
    const nonErrorRejection = new Event('unhandledrejection') as Event & {
      reason: unknown;
    };
    nonErrorRejection.reason = 'failure';
    act(() => window.dispatchEvent(nonErrorRejection));

    expect(
      mocks.reportGlobalError.mock.calls.map(([error]) => error.message),
    ).toEqual([
      'browser failure',
      'promise failure',
      'Unhandled browser error',
      'Unhandled promise rejection',
    ]);

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith(
      'error',
      expect.any(Function),
    );
    expect(removeEventListener).toHaveBeenCalledWith(
      'unhandledrejection',
      expect.any(Function),
    );
  });

  it('does not register global handlers when Datadog is disabled', () => {
    mocks.preferences.analytics = true;
    mocks.config.datadog.enabled = false;
    const addEventListener = vi.spyOn(window, 'addEventListener');
    render(<IntegrationRuntime />);

    expect(mocks.reportGlobalError).not.toHaveBeenCalled();
    expect(
      addEventListener.mock.calls.some(([event]) => event === 'error'),
    ).toBe(false);
    expect(
      addEventListener.mock.calls.some(
        ([event]) => event === 'unhandledrejection',
      ),
    ).toBe(false);
  });
});
