import {
  faro,
  getWebInstrumentations,
  initializeFaro,
} from '@grafana/faro-web-sdk';

interface BrowserObservabilityEnvironment {
  readonly VITE_GRAFANA_FARO_URL?: string;
  readonly VITE_APP_ENVIRONMENT?: string;
  readonly VITE_APP_VERSION?: string;
}

declare const __AEREALITH_FARO_URL__: string;
declare const __AEREALITH_APP_ENVIRONMENT__: string;
declare const __AEREALITH_APP_VERSION__: string;

const SensitiveTelemetryUrl =
  /[?&](?:token|code|key|password|secret|session|email)=/i;

function resolveEnvironment(
  environment?: BrowserObservabilityEnvironment,
): BrowserObservabilityEnvironment {
  return (
    environment ?? {
      VITE_GRAFANA_FARO_URL: __AEREALITH_FARO_URL__,
      VITE_APP_ENVIRONMENT: __AEREALITH_APP_ENVIRONMENT__,
      VITE_APP_VERSION: __AEREALITH_APP_VERSION__,
    }
  );
}

export function isBrowserObservabilityConfigured(
  environment?: BrowserObservabilityEnvironment,
): boolean {
  return Boolean(resolveEnvironment(environment).VITE_GRAFANA_FARO_URL?.trim());
}

export function isBrowserObservabilityActive(): boolean {
  return Boolean(faro.api);
}

export function setBrowserObservabilityPaused(paused: boolean): void {
  if (!faro.api) return;
  if (paused) {
    faro.pause();
  } else {
    faro.unpause();
  }
}

/** Starts privacy-conscious browser errors, Web Vitals, sessions, and navigation telemetry. */
export function initializeBrowserObservability(
  environment?: BrowserObservabilityEnvironment,
): boolean {
  const resolvedEnvironment = resolveEnvironment(environment);
  const url = resolvedEnvironment.VITE_GRAFANA_FARO_URL?.trim();
  if (!url) return false;

  // Grafana recommends provider-style initialization and explicitly avoiding
  // duplicate initialization in React applications.
  if (faro.api) return true;

  initializeFaro({
    url,
    app: {
      name: 'aerealith-frontend',
      environment:
        resolvedEnvironment.VITE_APP_ENVIRONMENT?.trim() || 'development',
      version: resolvedEnvironment.VITE_APP_VERSION?.trim() || 'development',
    },
    ignoreUrls: [SensitiveTelemetryUrl],
    beforeSend: (item) => {
      const pageUrl = item.meta.page?.url;
      if (pageUrl) item.meta.page.url = sanitizeBrowserTelemetryUrl(pageUrl);
      return item;
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

export function sanitizeBrowserTelemetryUrl(value: string): string {
  try {
    const url = new URL(value, window.location.origin);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return value.split(/[?#]/, 1)[0] ?? value;
  }
}

/**
 * Reports handled React/application errors after Faro has been enabled.
 * Context must stay low-cardinality and must not contain request bodies,
 * prompts, tokens, emails, or other user-controlled sensitive data.
 */
export function recordBrowserError(
  error: unknown,
  context: Readonly<Record<string, string>> = {},
): void {
  if (!faro.api) return;

  const resolved =
    error instanceof Error ? error : new Error('Unknown frontend error');

  faro.api.pushError(resolved, { context });
}

/**
 * Records bounded product events for operational correlation. Keep attributes
 * enumerable and low-cardinality; never include user-authored content.
 */
export function recordBrowserEvent(
  name: string,
  attributes: Readonly<Record<string, string>> = {},
  domain = 'aerealith',
): void {
  if (!faro.api) return;
  faro.api.pushEvent(name, { ...attributes }, domain);
}
