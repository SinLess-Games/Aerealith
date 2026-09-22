# Observability Runtime Matrix

Status: Active
Owner: Platform Engineering
Last Updated: 2026-09-21
Document Type: Engineering Reference

## Purpose

Aerealith requires every deployable runtime to expose operational logs, traces,
metrics, and the strongest profiling signal supported by that runtime.

The implementation stays vendor-neutral at application boundaries. Grafana
Cloud is the managed backend, OpenTelemetry is the primary telemetry transport,
and Cloudflare-native observability is used where Worker isolates cannot run the
Node OpenTelemetry SDK or native profilers.

## Runtime coverage

| Runtime | Logs | Traces | Metrics | Profiling |
| --- | --- | --- | --- | --- |
| Browser | Grafana Faro errors/events | Faro navigation/performance correlation | Web Vitals and browser performance | Browser performance timings; no continuous CPU profiler |
| Frontend Worker | Structured Workers logs | Cloudflare Workers traces | Cloudflare invocation metrics + Analytics Engine request RED signals | Cloudflare CPU-time/runtime metrics; no native continuous profiler |
| API Worker | Structured Workers logs | Cloudflare Workers traces | Cloudflare invocation metrics + Analytics Engine request RED signals | Cloudflare CPU-time/runtime metrics; no native continuous profiler |
| Auth Worker | Structured Workers logs | Cloudflare Workers traces | Cloudflare invocation metrics + Analytics Engine request RED signals | Cloudflare CPU-time/runtime metrics; no native continuous profiler |
| AI orchestrator Worker | Structured Workers logs | Cloudflare Workers traces | Cloudflare invocation metrics + Analytics Engine request RED signals | Cloudflare CPU-time/runtime metrics; no native continuous profiler |
| API Node/container | Console + Loki | OpenTelemetry OTLP -> Tempo | OpenTelemetry OTLP -> Prometheus/Mimir | Pyroscope continuous CPU/wall profiles |
| Auth Node/container | Console + Loki | OpenTelemetry OTLP -> Tempo | OpenTelemetry OTLP -> Prometheus/Mimir | Pyroscope continuous CPU/wall profiles |
| Generated Node service | Console + Loki | OpenTelemetry OTLP -> Tempo | OpenTelemetry OTLP -> Prometheus/Mimir | Pyroscope continuous CPU/wall profiles |

## Worker standard

Cloudflare Worker deployments must:

1. enable Workers Observability logs and traces in Wrangler;
2. enable source-map upload for useful stack traces;
3. use `recordWorkerRequest()` from
   `@aerealith-ai/observability/worker`;
4. write low-cardinality request metrics to the shared
   `AerealithServiceMetrics` Analytics Engine dataset;
5. never put tokens, prompts, request bodies, email addresses, session IDs, or
   user-controlled error messages into telemetry dimensions;
6. use normalized routes rather than resource identifiers.

Worker profiling has a hard runtime boundary: native Pyroscope agents cannot run
inside Cloudflare Worker isolates. CPU time, invocation duration, platform
metrics, traces, and Analytics Engine latency signals are therefore the
profiling substitute for Worker-only deployments. A service that requires
continuous flame graphs must also support a Node/container deployment.

## Node service standard

Node/container services must initialize observability before importing the HTTP
runtime:

- `createNodeLogger()` for structured console + Loki logs;
- `startNodeObservability()` for OpenTelemetry auto-instrumentation, traces,
  runtime metrics, and Pyroscope;
- `createApiRequestObserver()` for RED request metrics and active-span
  enrichment;
- `createOperationObserver()` for important transport-independent operations;
- graceful shutdown that flushes the logger, OTel SDK, and Pyroscope profiler.

The service generator must preserve this standard so new services are
observable by default.

## Signal destinations

| Signal | Primary destination |
| --- | --- |
| Browser telemetry | Grafana Faro / Frontend Observability |
| Application logs | Grafana Loki |
| Distributed traces | Grafana Tempo |
| Application and infrastructure metrics | Prometheus / Grafana Mimir |
| Continuous Node profiles | Grafana Pyroscope |
| Worker request metrics | Cloudflare Analytics Engine |
| Worker platform traces/logs | Cloudflare Workers Observability |

## Correlation

Request and trace correlation should use:

- service name;
- environment;
- request ID;
- trace ID and span ID where supported;
- normalized route;
- HTTP method and response status.

User IDs, conversation IDs, run IDs, document IDs, and arbitrary resource IDs
must not become metric labels or Analytics Engine indexes.

## Failure behavior

Observability exporters are operational dependencies, not request-path
availability dependencies. Exporter failures must be reported safely and must
not make an otherwise healthy service unavailable.

The exception is observability infrastructure itself: its own health and
readiness should fail when its required storage or transport dependencies are
unavailable.
