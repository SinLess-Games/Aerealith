import { FeatureFlag } from '@aerealith-ai/core';
import { useEffect } from 'react';

import { loadCloudflareWebAnalytics } from '../analytics/cloudflare-web-analytics';
import { loadGoogleTagManager } from '../analytics/google-tag-manager';
import { useConsent } from '../consent/consent-context';
import { useFeatureFlag } from '../features/flags/feature-flags';
import {
  initializeBrowserObservability,
  setBrowserObservabilityPaused,
} from '../lib/browser-observability';

export function IntegrationRuntime() {
  const { preferences } = useConsent();
  const observabilityEnabled = useFeatureFlag(FeatureFlag.Observability);
  useEffect(() => {
    if (!preferences.analytics) return;
    loadGoogleTagManager();
    loadCloudflareWebAnalytics();
  }, [preferences.analytics]);

  useEffect(() => {
    const trackingAllowed = observabilityEnabled && preferences.analytics;
    if (trackingAllowed) initializeBrowserObservability();
    setBrowserObservabilityPaused(!trackingAllowed);
  }, [observabilityEnabled, preferences.analytics]);

  return null;
}
