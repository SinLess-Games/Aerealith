# Auth service observability runbook

## Triage order

1. Check `/health` for process liveness and `/ready` for PostgreSQL readiness.
2. Open the auth overview dashboard and identify the affected route and status.
3. Pivot from an error log's `traceId` into Tempo.
4. Inspect the trace for PostgreSQL, HTTP, DNS, or email delivery latency.
5. Use the same time range and service/version tags in Pyroscope when CPU or
   wall time rises without a corresponding downstream span.

## High error ratio

- Separate 4xx client/auth failures from 5xx service failures.
- Group Loki records by `event`, `component`, and normalized error type.
- Confirm PostgreSQL readiness and pool connectivity.
- Check Resend only when signup or resend-verification operations are affected.
- Roll back the service version when failures begin at a deployment boundary.

## High latency

- Compare route p95 with auth operation duration.
- Inspect Tempo spans to distinguish database, password hashing, Resend, and
  application time.
- Compare heap/RSS and active requests for saturation.
- Inspect wall profiles for synchronous CPU work or event-loop blocking.

## Missing telemetry

- Confirm the service is running before treating missing signals as an exporter
  incident.
- Check OTLP and Loki exporter warnings in console output.
- Verify deployment secrets without printing them.
- Confirm the access-policy token has metrics, logs, traces, and profiles write
  scopes and that the configured stack user IDs match each endpoint.

Never attach passwords, tokens, request bodies, session cookies, verification
links, email addresses, or raw authorization headers to an incident.
