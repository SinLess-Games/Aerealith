import { useEffect } from 'react';

import { loadCloudflareWebAnalytics } from '../analytics/cloudflare-web-analytics';
import { loadGoogleTagManager } from '../analytics/google-tag-manager';
import { useConsent } from '../consent/consent-context';
import {
  initializeDatadogRum,
  reportGlobalError,
  setDatadogSessionReplayAllowed,
} from '../observability/datadog-rum';
import { integrationConfig } from './integration-config';

export function IntegrationRuntime() {
  const { preferences } = useConsent();

  useEffect(() => {
    if (!preferences.analytics) return;
    loadGoogleTagManager();
    loadCloudflareWebAnalytics();
    void initializeDatadogRum().then(() => {
      setDatadogSessionReplayAllowed(preferences.sessionReplay);
    });
  }, [preferences.analytics, preferences.sessionReplay]);

  useEffect(() => {
    setDatadogSessionReplayAllowed(
      preferences.analytics && preferences.sessionReplay,
    );
  }, [preferences.analytics, preferences.sessionReplay]);

  useEffect(() => {
    if (!integrationConfig.datadog.enabled || !preferences.analytics) return;
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
  }, [preferences.analytics]);

  return null;
}
