import { integrationConfig } from '../integrations/integration-config';

type DatadogRum = typeof import('@datadog/browser-rum').datadogRum;

let rum: DatadogRum | null = null;
let initializing: Promise<boolean> | null = null;
let initialized = false;
let replayRunning = false;

export function initializeDatadogRum(): Promise<boolean> {
  const config = integrationConfig.datadog;
  if (initialized) return Promise.resolve(false);
  if (!config.enabled) return Promise.resolve(false);
  if (initializing) return initializing;

  initializing = import('@datadog/browser-rum')
    .then(({ datadogRum }) => {
      if (initialized) return false;
      datadogRum.init({
        applicationId: config.applicationId,
        clientToken: config.clientToken,
        site: config.site,
        service: config.service,
        env: config.environment,
        version: config.version,
        sessionSampleRate: config.sessionSampleRate,
        sessionReplaySampleRate: config.sessionReplaySampleRate,
        trackResources: true,
        trackLongTasks: true,
        trackUserInteractions: true,
        trackViewsManually: true,
        defaultPrivacyLevel: 'mask-user-input',
        beforeSend: (event) => {
          const viewUrl = event.view?.url;
          if (viewUrl) event.view.url = sanitizeUrl(viewUrl);
          return true;
        },
      });
      rum = datadogRum;
      initialized = true;
      return true;
    })
    .catch((error: unknown) => {
      console.error(
        '[observability] Datadog RUM initialization failed.',
        error,
      );
      return false;
    })
    .finally(() => {
      initializing = null;
    });

  return initializing;
}

export function setDatadogSessionReplayAllowed(allowed: boolean) {
  if (!rum || !initialized) return;
  if (allowed && !replayRunning) {
    rum.startSessionReplayRecording();
    replayRunning = true;
  } else if (!allowed && replayRunning) {
    rum.stopSessionReplayRecording();
    replayRunning = false;
  }
}

export function trackDatadogView(path: string) {
  if (!rum || !initialized) return;
  rum.startView({ name: path, service: integrationConfig.datadog.service });
}

export function reportGlobalError(error: Error) {
  if (!rum || !initialized) return;
  rum.addError(error);
}

export function sanitizeUrl(value: string): string {
  try {
    const url = new URL(value, window.location.origin);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return value.split(/[?#]/, 1)[0] ?? value;
  }
}

export function resetDatadogForTests() {
  rum = null;
  initializing = null;
  initialized = false;
  replayRunning = false;
}
