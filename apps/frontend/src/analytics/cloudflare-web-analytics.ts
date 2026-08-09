import { integrationConfig } from '../integrations/integration-config';

let loaded = false;

export function loadCloudflareWebAnalytics(): boolean {
  const config = integrationConfig.cloudflareWebAnalytics;
  if (loaded || !config.enabled) return false;
  loaded = true;
  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.dataset['cfBeacon'] = JSON.stringify({
    token: config.token,
    spa: true,
  });
  script.dataset['aerealithIntegration'] = 'cloudflare-web-analytics';
  document.head.appendChild(script);
  return true;
}
