export interface ObservabilityEnvironment {
  readonly [key: string]: string | undefined;
}

export interface OtlpConfiguration {
  readonly endpoint: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly metricExportIntervalMs: number;
}

export interface PyroscopeConfiguration {
  readonly serverAddress: string;
  readonly applicationName: string;
  readonly basicAuthUser?: string;
  readonly basicAuthPassword?: string;
  readonly flushIntervalMs: number;
  readonly collectCpuTime: boolean;
  readonly tags: Readonly<Record<string, string>>;
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
  const namespace =
    environment['OTEL_SERVICE_NAMESPACE']?.trim() || 'aerealith';
  const pyroscopeServerAddress =
    environment['PYROSCOPE_SERVER_ADDRESS']?.trim();
  const pyroscopeBasicAuthUser =
    environment['PYROSCOPE_BASIC_AUTH_USER']?.trim();
  const pyroscopeBasicAuthPassword =
    environment['PYROSCOPE_BASIC_AUTH_PASSWORD']?.trim();
  const pyroscopeEnabled =
    pyroscopeServerAddress !== undefined &&
    parseBoolean(environment['PYROSCOPE_ENABLED'], true);

  return {
    service,
    environment: deploymentEnvironment,
    ...(version ? { version } : {}),
    namespace,
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
      : {}),
    ...(pyroscopeEnabled && pyroscopeServerAddress
      ? {
          pyroscope: {
            serverAddress: trimTrailingSlashes(pyroscopeServerAddress),
            applicationName:
              environment['PYROSCOPE_APPLICATION_NAME']?.trim() ||
              `${namespace}.${service}`,
            ...(pyroscopeBasicAuthUser
              ? { basicAuthUser: pyroscopeBasicAuthUser }
              : {}),
            ...(pyroscopeBasicAuthPassword
              ? { basicAuthPassword: pyroscopeBasicAuthPassword }
              : {}),
            flushIntervalMs: parsePositiveInteger(
              environment['PYROSCOPE_FLUSH_INTERVAL_MS'],
              60_000,
            ),
            collectCpuTime: parseBoolean(
              environment['PYROSCOPE_WALL_COLLECT_CPU_TIME'],
              true,
            ),
            tags: {
              service,
              environment: deploymentEnvironment,
              namespace,
              ...(version ? { version } : {}),
            },
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

function parseBoolean(
  value: string | undefined,
  fallback: boolean,
): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (
    normalized === 'false' ||
    normalized === '0' ||
    normalized === 'no'
  ) {
    return false;
  }
  return fallback;
}
