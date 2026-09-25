# Aerealith Service Observability Runbook

## Scope

Use this runbook for API, auth, AI orchestrator, frontend Worker, and generated
service incidents involving elevated errors, latency, request saturation,
missing telemetry, or abnormal CPU/memory/profile behavior.

## First response

1. Identify the affected service and environment.
2. Confirm whether the failure is Worker-only, Node/container-only, or shared.
3. Check deployment/change markers before assuming an infrastructure outage.
4. Check request rate, error rate, p95 latency, and active requests.
5. Correlate request IDs with logs and trace IDs where available.
6. Check dependency health before restarting or rolling back anything.

## Grafana paths

For Node/container services:

- Metrics: Prometheus / Grafana Mimir.
- Logs: Grafana Loki.
- Traces: Grafana Tempo.
- Profiles: Grafana Pyroscope, collected by the `alloy-profiling` DaemonSet.
- Browser failures: Grafana Faro.

Use `ops/observability/grafana/service-overview.dashboard.json` as the default
service dashboard.

## Cloudflare Worker paths

For Worker deployments:

- Workers Observability: invocation logs and traces.
- Analytics Engine dataset: `AerealithServiceMetrics`.
- Inspect request count, duration, status, outcome, and normalized route.
- Inspect Cloudflare CPU time and invocation duration for runtime hot paths.

Native continuous Pyroscope profiling is not available inside Worker isolates.

## High error rate

Check:

- latest deployment;
- dependency availability;
- database/auth/provider failures;
- rate limits;
- recent feature-flag changes;
- 5xx routes in logs and traces.

Do not log or copy request bodies, prompts, tokens, cookies, or credentials into
incident notes.

## High latency

Check:

- p95/p99 request duration;
- active-request growth;
- database/query traces;
- outbound provider spans;
- Node/container CPU flame graphs in Pyroscope from Alloy eBPF;
- Worker CPU time and invocation duration.

Prefer rollback when latency started directly after a deployment and the cause
is not immediately understood.

## Missing telemetry

Telemetry failure must not make healthy product traffic unavailable.

Check:

- OTLP endpoint and authorization for Node services;
- Loki credentials;
- `pyroscope` HelmRelease, PVC, readiness, and service;
- `alloy-profiling` DaemonSet status on every Kubernetes node;
- Cloudflare Workers Observability status;
- `AEREALITH_ANALYTICS` binding presence;
- named Wrangler environment bindings;
- exporter/network errors in structured logs.

## Resolution

Before closing an incident:

- verify request success/error rates returned to baseline;
- verify latency returned to baseline;
- verify logs, traces, metrics, and profiles are flowing where supported;
- record the triggering deployment/configuration change;
- add or adjust an alert only when the new signal is actionable.
