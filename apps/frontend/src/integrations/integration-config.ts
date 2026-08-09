type BrowserEnvironment = Record<string, string | boolean | undefined>;

declare const __AEREALITH_ENV__: BrowserEnvironment;

function readString(environment: BrowserEnvironment, key: string): string {
  const value = environment[key];
  return typeof value === 'string' ? value.trim() : '';
}

function readBoolean(
  environment: BrowserEnvironment,
  key: string,
  fallback = false,
): boolean {
  const value = readString(environment, key).toLowerCase();
  if (!value) return fallback;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  warnInvalid(environment, key, 'boolean');
  return fallback;
}

function readRate(
  environment: BrowserEnvironment,
  key: string,
  fallback = 0,
): number {
  const value = readString(environment, key);
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 100) return parsed;
  warnInvalid(environment, key, 'number between 0 and 100');
  return fallback;
}

function warnInvalid(
  environment: BrowserEnvironment,
  key: string,
  expected: string,
) {
  if (environment['DEV'] === true) {
    console.warn(`[integrations] ${key} must be a valid ${expected}.`);
  }
}

function warnMissing(
  environment: BrowserEnvironment,
  enabled: boolean,
  integration: string,
  missing: string[],
) {
  if (environment['DEV'] === true && enabled && missing.length > 0) {
    console.warn(
      `[integrations] ${integration} is enabled but missing: ${missing.join(', ')}.`,
    );
  }
}
export function createIntegrationConfig(
  environment: BrowserEnvironment = __AEREALITH_ENV__,
) {
  const isTest = environment['MODE'] === 'test';
  const isDevelopment = environment['DEV'] === true;
  const gtmContainerId = readString(environment, 'VITE_GTM_CONTAINER_ID');
  const adsenseClientId = readString(environment, 'VITE_ADSENSE_CLIENT_ID');
  const datadogEnabled =
    readBoolean(environment, 'VITE_DATADOG_ENABLED') &&
    !isTest &&
    !isDevelopment;
  const datadogApplicationId = readString(
    environment,
    'VITE_DATADOG_APPLICATION_ID',
  );
  const datadogClientToken = readString(
    environment,
    'VITE_DATADOG_CLIENT_TOKEN',
  );
  const cloudflareEnabled =
    readBoolean(environment, 'VITE_CLOUDFLARE_WEB_ANALYTICS_ENABLED') &&
    !isTest &&
    !isDevelopment;
  const cloudflareToken = readString(
    environment,
    'VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN',
  );

  warnMissing(environment, datadogEnabled, 'Datadog RUM', [
    ...(!datadogApplicationId ? ['VITE_DATADOG_APPLICATION_ID'] : []),
    ...(!datadogClientToken ? ['VITE_DATADOG_CLIENT_TOKEN'] : []),
  ]);
  warnMissing(environment, cloudflareEnabled, 'Cloudflare Web Analytics', [
    ...(!cloudflareToken ? ['VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN'] : []),
  ]);

  return {
    environment: {
      isDevelopment,
      isTest,
      productionTelemetryAllowed: !isTest && !isDevelopment,
    },
    gtm: {
      containerId: /^GTM-[A-Z0-9]+$/.test(gtmContainerId) ? gtmContainerId : '',
    },
    adsense: {
      clientId: /^ca-pub-\d+$/.test(adsenseClientId) ? adsenseClientId : '',
      testMode: readBoolean(environment, 'VITE_ADSENSE_TEST_MODE', true),
    },
    datadog: {
      enabled:
        datadogEnabled &&
        Boolean(datadogApplicationId) &&
        Boolean(datadogClientToken),
      applicationId: datadogApplicationId,
      clientToken: datadogClientToken,
      site: readString(environment, 'VITE_DATADOG_SITE') || 'datadoghq.com',
      service:
        readString(environment, 'VITE_DATADOG_SERVICE') || 'aerealith-frontend',
      environment: readString(environment, 'VITE_DATADOG_ENV') || 'development',
      version: readString(environment, 'VITE_DATADOG_VERSION') || undefined,
      sessionSampleRate: readRate(
        environment,
        'VITE_DATADOG_SESSION_SAMPLE_RATE',
      ),
      sessionReplaySampleRate: readRate(
        environment,
        'VITE_DATADOG_SESSION_REPLAY_SAMPLE_RATE',
      ),
    },
    turnstile: {
      siteKey: readString(environment, 'VITE_TURNSTILE_SITE_KEY'),
    },
    googleSiteVerification: readString(
      environment,
      'VITE_GOOGLE_SITE_VERIFICATION',
    ),
    cloudflareWebAnalytics: {
      enabled: cloudflareEnabled && Boolean(cloudflareToken),
      token: cloudflareToken,
    },
  } as const;
}

export const integrationConfig = createIntegrationConfig();
