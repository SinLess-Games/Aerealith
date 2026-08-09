import { integrationConfig } from '../integrations/integration-config';

export type AnalyticsEvent =
  | { event: 'page_view'; page_path: string; page_title: string }
  | { event: 'waitlist_signup_started'; source: string }
  | { event: 'waitlist_signup_completed'; source: string }
  | { event: 'login_started' }
  | { event: 'login_completed' }
  | { event: 'registration_started' }
  | { event: 'registration_completed' }
  | { event: 'documentation_search'; query_length: number }
  | { event: 'pricing_page_viewed' }
  | { event: 'contact_form_submitted' };

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

let loaded = false;

export function loadGoogleTagManager(): boolean {
  const { containerId } = integrationConfig.gtm;
  if (
    loaded ||
    !containerId ||
    !integrationConfig.environment.productionTelemetryAllowed
  ) {
    return false;
  }
  loaded = true;
  window.dataLayer ??= [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
  script.dataset['aerealithIntegration'] = 'gtm';
  document.head.appendChild(script);
  return true;
}

export function trackEvent(event: AnalyticsEvent): boolean {
  if (!loaded || !window.dataLayer) return false;
  window.dataLayer.push(event);
  return true;
}

export function resetGoogleTagManagerForTests() {
  loaded = false;
}
