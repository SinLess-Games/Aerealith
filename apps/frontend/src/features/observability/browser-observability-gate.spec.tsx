// @vitest-environment jsdom
import { FeatureFlag } from '@aerealith-ai/core';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConsentProvider } from '../../consent/consent-context';
import { StaticFeatureFlagsProvider } from '../flags/feature-flags';
import { BrowserObservabilityGate } from './browser-observability-gate';

const { initializeBrowserObservability, setBrowserObservabilityPaused } =
  vi.hoisted(() => ({
    initializeBrowserObservability: vi.fn(() => true),
    setBrowserObservabilityPaused: vi.fn(),
  }));

vi.mock('../../lib/browser-observability', () => ({
  initializeBrowserObservability,
  setBrowserObservabilityPaused,
}));

function renderGate(observability: boolean) {
  return render(
    <ConsentProvider>
      <StaticFeatureFlagsProvider
        values={{ [FeatureFlag.Observability]: observability }}
      >
        <BrowserObservabilityGate />
      </StaticFeatureFlagsProvider>
    </ConsentProvider>,
  );
}

describe('BrowserObservabilityGate', () => {
  beforeEach(() => {
    window.localStorage.clear();
    initializeBrowserObservability.mockClear();
    setBrowserObservabilityPaused.mockClear();
  });

  it('stays off until analytics consent is granted', async () => {
    renderGate(true);

    await waitFor(() =>
      expect(initializeBrowserObservability).not.toHaveBeenCalled(),
    );
    expect(setBrowserObservabilityPaused).not.toHaveBeenCalled();
  });

  it('starts and unpauses Faro when rollout and analytics consent allow it', async () => {
    window.localStorage.setItem(
      'aerealith-consent-v1',
      JSON.stringify({
        necessary: true,
        analytics: true,
        advertising: false,
        sessionReplay: false,
      }),
    );

    renderGate(true);

    await waitFor(() =>
      expect(initializeBrowserObservability).toHaveBeenCalledTimes(1),
    );
    expect(setBrowserObservabilityPaused).toHaveBeenCalledWith(false);
  });

  it('does not start when the observability rollout is disabled', async () => {
    window.localStorage.setItem(
      'aerealith-consent-v1',
      JSON.stringify({
        necessary: true,
        analytics: true,
        advertising: false,
        sessionReplay: false,
      }),
    );

    renderGate(false);

    await waitFor(() =>
      expect(initializeBrowserObservability).not.toHaveBeenCalled(),
    );
    expect(setBrowserObservabilityPaused).not.toHaveBeenCalled();
  });
});
