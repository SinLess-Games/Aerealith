import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';

interface BrowserObservabilityEnvironment {
  readonly VITE_GRAFANA_FARO_URL?: string;
  readonly VITE_APP_ENVIRONMENT?: string;
  readonly VITE_APP_VERSION?: string;
}

declare const __AEREALITH_FARO_URL__: string;
declare const __AEREALITH_APP_ENVIRONMENT__: string;
declare const __AEREALITH_APP_VERSION__: string;

/** Starts privacy-conscious browser errors, Web Vitals, sessions, and navigation telemetry. */
export function initializeBrowserObservability(
  environment: BrowserObservabilityEnvironment = {
    VITE_GRAFANA_FARO_URL: __AEREALITH_FARO_URL__,
    VITE_APP_ENVIRONMENT: __AEREALITH_APP_ENVIRONMENT__,
    VITE_APP_VERSION: __AEREALITH_APP_VERSION__,
  },
): boolean {
  const url = environment.VITE_GRAFANA_FARO_URL?.trim();
  if (!url) return false;

  initializeFaro({
    url,
    app: {
      name: 'aerealith-frontend',
      environment: environment.VITE_APP_ENVIRONMENT?.trim() || 'development',
      version: environment.VITE_APP_VERSION?.trim() || 'development',
    },
    instrumentations: [
      ...getWebInstrumentations({
        captureConsole: false,
        enableContentSecurityPolicyInstrumentation: true,
        enablePerformanceInstrumentation: true,
      }),
    ],
    sessionTracking: {
      enabled: true,
      persistent: false,
    },
  });
  return true;
}
