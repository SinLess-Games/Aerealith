export interface ObservabilityEnvironment {
  readonly [key: string]: string | undefined;
}

export interface OtlpConfiguration {
  readonly endpoint: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly metricExportIntervalMs: number;
}

export interface NodeObservabilityConfiguration {
  readonly service: string;
  readonly environment: string;
  readonly version?: string;
  readonly namespace: string;
  readonly otlp?: OtlpConfiguration;
}

export function resolveNodeObservabilityConfiguration(
  service: string,
  environment: ObservabilityEnvironment,
): NodeObservabilityConfiguration {
  const deploymentEnvironment =
    environment['NODE_ENV']?.trim() || 'development';
  const version = environment['OTEL_SERVICE_VERSION']?.trim();
  const endpoint = environment['OTEL_EXPORTER_OTLP_ENDPOINT']?.trim();

  return {
    service,
    environment: deploymentEnvironment,
    ...(version ? { version } : {}),
    namespace: environment['OTEL_SERVICE_NAMESPACE']?.trim() || 'aerealith',
    ...(endpoint && environment['OTEL_SDK_DISABLED'] !== 'true'
      ? {
          otlp: {
            endpoint: trimTrailingSlashes(endpoint),
            headers: parseOtlpHeaders(
              environment['OTEL_EXPORTER_OTLP_HEADERS'],
            ),
            metricExportIntervalMs: parsePositiveInteger(
              environment['OTEL_METRIC_EXPORT_INTERVAL'],
              60_000,
            ),
          },
        }
      : {}),,
  };
}

export function parseOtlpHeaders(
  value: string | undefined,
): Readonly<Record<string, string>> {
  if (!value?.trim()) return {};
  const headers: Record<string, string> = {};
  for (const entry of value.split(',')) {
    const separator = entry.indexOf('=');
    if (separator <= 0) continue;
    const key = decode(entry.slice(0, separator).trim());
    const headerValue = decode(entry.slice(separator + 1).trim());
    if (key && headerValue) headers[key] = headerValue;
  }
  return headers;
}

export function otlpSignalEndpoint(
  endpoint: string,
  signal: 'metrics' | 'traces',
): string {
  return `${trimTrailingSlashes(endpoint)}/v1/${signal}`;
}

function trimTrailingSlashes(value: string): string {
  let end = value.length;

  while (end > 0 && value.codePointAt(end - 1) === 47) {
    end -= 1;
  }

  return end === value.length ? value : value.slice(0, end);
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
