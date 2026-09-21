import { FeatureFlag } from '@aerealith-ai/core';
import { useEffect } from 'react';

import { loadCloudflareWebAnalytics } from '../analytics/cloudflare-web-analytics';
import { loadGoogleTagManager } from '../analytics/google-tag-manager';
import { useConsent } from '../consent/consent-context';
import { useFeatureFlag } from '../features/flags/feature-flags';
import {
  initializeDatadogRum,
  reportGlobalError,
  setDatadogSessionReplayAllowed,
  setDatadogTrackingAllowed,
} from '../observability/datadog-rum';
import { integrationConfig } from './integration-config';

export function IntegrationRuntime() {
  const { preferences } = useConsent();
  const observabilityEnabled = useFeatureFlag(FeatureFlag.Observability);

  useEffect(() => {
    if (!preferences.analytics) return;
    loadGoogleTagManager();
    loadCloudflareWebAnalytics();

    if (!observabilityEnabled) return;

    void initializeDatadogRum().then(() => {
      setDatadogTrackingAllowed(true);
      setDatadogSessionReplayAllowed(preferences.sessionReplay);
    });
  }, [
    observabilityEnabled,
    preferences.analytics,
    preferences.sessionReplay,
  ]);

  useEffect(() => {
    const trackingAllowed = observabilityEnabled && preferences.analytics;
    setDatadogTrackingAllowed(trackingAllowed);
    setDatadogSessionReplayAllowed(
      trackingAllowed && preferences.sessionReplay,
    );
  }, [
    observabilityEnabled,
    preferences.analytics,
    preferences.sessionReplay,
  ]);

  useEffect(() => {
    if (
      !observabilityEnabled ||
      !integrationConfig.datadog.enabled ||
      !preferences.analytics
    ) {
      return;
    }
    const onError = (event: ErrorEvent) => {
      reportGlobalError(
        event.error instanceof Error
          ? event.error
          : new Error('Unhandled browser error'),
      );
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      reportGlobalError(
        event.reason instanceof Error
          ? event.reason
          : new Error('Unhandled promise rejection'),
      );
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [observabilityEnabled, preferences.analytics]);

  return null;
}
