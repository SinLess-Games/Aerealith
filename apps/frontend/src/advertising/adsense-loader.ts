import { integrationConfig } from '../integrations/integration-config';

let loaded = false;

export function loadAdsense(): boolean {
  const { clientId, testMode } = integrationConfig.adsense;
  if (
    loaded ||
    !clientId ||
    (!testMode && !integrationConfig.environment.productionTelemetryAllowed)
  ) {
    return false;
  }
  loaded = true;
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
  script.dataset['aerealithIntegration'] = 'adsense';
  document.head.appendChild(script);
  return true;
}
