export interface ObservabilityEnvironment {
  readonly [key: string]: string | undefined;
}

export interface OtlpConfiguration {
  readonly endpoint: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly metricExportIntervalMs: number;
}

export interface PyroscopeConfiguration {
  readonly applicationName: string;
  readonly endpoint: string;
  readonly user: string;
  readonly password: string;
  readonly flushIntervalMs: number;
  readonly collectCpuTime: boolean;
}

export interface NodeObservabilityConfiguration {
  readonly service: string;
  readonly environment: string;
  readonly version?: string;
  readonly namespace: string;
  readonly otlp?: OtlpConfiguration;
  readonly pyroscope?: PyroscopeConfiguration;
}

export function resolveNodeObservabilityConfiguration(
  service: string,
  environment: ObservabilityEnvironment,
): NodeObservabilityConfiguration {
  const deploymentEnvironment =
    environment['NODE_ENV']?.trim() || 'development';
  const version = environment['OTEL_SERVICE_VERSION']?.trim();
  const endpoint = environment['OTEL_EXPORTER_OTLP_ENDPOINT']?.trim();
  const pyroscopeEndpoint =
    environment['PYROSCOPE_SERVER_ADDRESS']?.trim() ||
    environment['PYROSCOPE_URL']?.trim();
  const pyroscopeUser =
    environment['PYROSCOPE_BASIC_AUTH_USER']?.trim() ||
    environment['PYROSCOPE_USER_ID']?.trim();
  const pyroscopePassword =
    environment['PYROSCOPE_BASIC_AUTH_PASSWORD']?.trim() ||
    environment['PYROSCOPE_TOKEN']?.trim();

  return {
    service,
    environment: deploymentEnvironment,
    ...(version ? { version } : {}),
    namespace: environment['OTEL_SERVICE_NAMESPACE']?.trim() || 'aerealith',
    ...(endpoint && environment['OTEL_SDK_DISABLED'] !== 'true'
      ? {
          otlp: {
            endpoint: endpoint.replace(/\/+$/u, ''),
            headers: parseOtlpHeaders(
              environment['OTEL_EXPORTER_OTLP_HEADERS'],
            ),
            metricExportIntervalMs: parsePositiveInteger(
              environment['OTEL_METRIC_EXPORT_INTERVAL'],
              60_000,
            ),
          },
        }
      : {}),
    ...(pyroscopeEndpoint &&
    pyroscopeUser &&
    pyroscopePassword &&
    environment['PYROSCOPE_ENABLED'] !== 'false'
      ? {
          pyroscope: {
            applicationName:
              environment['PYROSCOPE_APPLICATION_NAME']?.trim() || service,
            endpoint: pyroscopeEndpoint.replace(/\/+$/u, ''),
            user: pyroscopeUser,
            password: pyroscopePassword,
            flushIntervalMs: parsePositiveInteger(
              environment['PYROSCOPE_FLUSH_INTERVAL_MS'],
              60_000,
            ),
            collectCpuTime:
              environment['PYROSCOPE_WALL_COLLECT_CPU_TIME'] !== 'false',
          },
        }
      : {}),
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
  return `${endpoint.replace(/\/+$/u, '')}/v1/${signal}`;
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
