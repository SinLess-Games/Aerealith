// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IntegrationRuntime } from './integration-runtime';

const mocks = vi.hoisted(() => ({
  initializeBrowserObservability: vi.fn(),
  loadCloudflareWebAnalytics: vi.fn(),
  loadGoogleTagManager: vi.fn(),
  observabilityEnabled: true,
  preferences: { analytics: false, sessionReplay: false },
  setBrowserObservabilityPaused: vi.fn(),
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
vi.mock('../features/flags/feature-flags', () => ({
  useFeatureFlag: () => mocks.observabilityEnabled,
}));
vi.mock('../lib/browser-observability', () => ({
  initializeBrowserObservability: mocks.initializeBrowserObservability,
  setBrowserObservabilityPaused: mocks.setBrowserObservabilityPaused,
}));

describe('IntegrationRuntime', () => {
  beforeEach(() => {
    mocks.preferences.analytics = false;
    mocks.observabilityEnabled = true;
    mocks.initializeBrowserObservability.mockReset().mockReturnValue(true);
    mocks.loadCloudflareWebAnalytics.mockReset();
    mocks.loadGoogleTagManager.mockReset();
    mocks.setBrowserObservabilityPaused.mockReset();
  });

  it('keeps optional integrations disabled without analytics consent', () => {
    render(<IntegrationRuntime />);

    expect(mocks.loadGoogleTagManager).not.toHaveBeenCalled();
    expect(mocks.loadCloudflareWebAnalytics).not.toHaveBeenCalled();
    expect(mocks.initializeBrowserObservability).not.toHaveBeenCalled();
    expect(mocks.setBrowserObservabilityPaused).toHaveBeenCalledWith(true);
  });

  it('loads consented analytics and starts Faro observability', () => {
    mocks.preferences.analytics = true;
    render(<IntegrationRuntime />);

    expect(mocks.loadGoogleTagManager).toHaveBeenCalled();
    expect(mocks.loadCloudflareWebAnalytics).toHaveBeenCalled();
    expect(mocks.initializeBrowserObservability).toHaveBeenCalled();
    expect(mocks.setBrowserObservabilityPaused).toHaveBeenCalledWith(false);
  });

  it('keeps Faro paused when the observability rollout is off', () => {
    mocks.preferences.analytics = true;
    mocks.observabilityEnabled = false;
    render(<IntegrationRuntime />);

    expect(mocks.loadGoogleTagManager).toHaveBeenCalled();
    expect(mocks.loadCloudflareWebAnalytics).toHaveBeenCalled();
    expect(mocks.initializeBrowserObservability).not.toHaveBeenCalled();
    expect(mocks.setBrowserObservabilityPaused).toHaveBeenCalledWith(true);
  });
});
