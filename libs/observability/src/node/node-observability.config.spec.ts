import { describe, expect, it } from 'vitest';

import {
  otlpSignalEndpoint,
  parseOtlpHeaders,
  resolveNodeObservabilityConfiguration,
} from './node-observability.config';

describe('node observability configuration', () => {
  it('enables Grafana OTLP with complete exporter configuration', () => {
    const configuration = resolveNodeObservabilityConfiguration('auth', {
      NODE_ENV: 'production',
      OTEL_EXPORTER_OTLP_ENDPOINT: 'https://otlp-gateway.example.com/otlp/',
      OTEL_EXPORTER_OTLP_HEADERS:
        'Authorization=Basic%20encoded,X-Custom=value',
    });

    expect(configuration).toMatchObject({
      service: 'auth',
      environment: 'production',
      otlp: {
        endpoint: 'https://otlp-gateway.example.com/otlp',
        headers: {
          Authorization: 'Basic encoded',
          'X-Custom': 'value',
        },
      },
    });
  });

  it('leaves exporters disabled when secrets are absent', () => {
    expect(
      resolveNodeObservabilityConfiguration('auth', {
        OTEL_SDK_DISABLED: 'true',
        OTEL_EXPORTER_OTLP_ENDPOINT: 'https://otlp.example.com',
      }),
    ).toEqual({
      service: 'auth',
      environment: 'development',
      namespace: 'aerealith',
    });
  });

  it('parses standard OTLP headers without exposing malformed entries', () => {
    expect(
      parseOtlpHeaders(
        'Authorization=Basic%20abc,malformed,X-Scope-OrgID=tenant',
      ),
    ).toEqual({
      Authorization: 'Basic abc',
      'X-Scope-OrgID': 'tenant',
    });
  });

  it('builds signal-specific Grafana OTLP paths', () => {
    expect(
      otlpSignalEndpoint('https://gateway.example.com/otlp/', 'metrics'),
    ).toBe('https://gateway.example.com/otlp/v1/metrics');
    expect(
      otlpSignalEndpoint('https://gateway.example.com/otlp', 'traces'),
    ).toBe('https://gateway.example.com/otlp/v1/traces');
  });
});
