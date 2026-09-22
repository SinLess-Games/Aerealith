# Aerealith Observability

Aerealith uses a vendor-neutral OpenTelemetry/Grafana stack.

`@aerealith-ai/observability` provides structured logging plus Node.js metrics,
distributed tracing, and automatic instrumentation. Continuous profiling is
owned by Grafana Alloy eBPF at the Kubernetes infrastructure layer.

## Grafana Cloud signals

| Signal                        | Transport          | Grafana backend        |
| ----------------------------- | ------------------ | ---------------------- |
| Structured logs               | Loki push API      | Loki                   |
| Metrics                       | OTLP/HTTP protobuf | Prometheus/Mimir       |
| Traces                        | OTLP/HTTP protobuf | Tempo                  |
| Continuous CPU profiles       | Alloy eBPF         | Grafana Pyroscope      |
| Browser errors and Web Vitals | Faro collector     | Frontend Observability |

Grafana Cloud's unified OTLP gateway is used for metrics and traces. The SDK
automatically uses `/v1/metrics` and `/v1/traces` below the configured
`OTEL_EXPORTER_OTLP_ENDPOINT`.

## Service coverage

Every Node service must initialize this package before loading its HTTP runtime. The API and auth services are instrumented today, and the service generator emits the same logs, metrics, traces, request RED metrics, and graceful exporter shutdown for every new Node service. Kubernetes profiling is collected externally by a node-level Alloy eBPF DaemonSet. Cloudflare Worker services use structured logging and platform-native telemetry where native eBPF profiling cannot run.

## Cloudflare Worker bootstrap

Workers use Cloudflare Workers Observability for platform logs/traces and the
shared Worker request observer for application request metrics:

```ts
const response = await app.fetch(request, environment, executionContext);

recordWorkerRequest({
  service: 'api',
  request,
  status: response.status,
  durationMs: performance.now() - startedAt,
  analytics: environment.AEREALITH_ANALYTICS,
});
```

All Worker deployments write request metrics to the shared
`AerealithServiceMetrics` Analytics Engine dataset. The service name is the
indexed dimension; HTTP method, normalized route, status, and outcome are
bounded blob dimensions.

Native continuous profilers cannot execute in Worker isolates. Use Workers
CPU-time/invocation metrics and traces there. Kubernetes Node/container
workloads are profiled externally by Grafana Alloy eBPF and stored in
Pyroscope.

## Node service bootstrap

Observability must start before importing an HTTP framework so automatic
instrumentation can register first:

```ts
const observability = await startNodeObservability({
  service: 'auth',
  environment: process.env,
});

const { createServer } = await import('./server-implementation');
```

Call `observability.shutdown()` during `SIGINT` and `SIGTERM` handling so
buffered OpenTelemetry spans and metrics are flushed. Profiling is independent
of application shutdown because Alloy observes the process externally.

Use `createNodeLogger()` to enable the existing console logger and
automatically add the Loki sink when all Loki credentials are configured.

`createApiRequestObserver()` records request rate, errors, duration, and active
requests while adding request IDs to the active server span. Its returned trace
and span IDs are included in structured request logs. Use
`createOperationObserver()` around transport-independent use cases to get
business metrics and child spans without duplicating instrumentation across
HTTP, GraphQL, and tRPC.

## Required environment

```dotenv
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway.example.com/otlp
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic base64_user_colon_token
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.25

LOKI_LOGGING_URL=https://logs.example.com
LOKI_USER_ID=stack_user
LOKI_TOKEN=cloud_access_policy_token

```

Never commit Grafana Cloud tokens or a completed authorization header.
Low-cardinality fields such as service and environment are labels. User IDs,
request IDs, session IDs, and resource IDs remain structured fields rather
than labels.

## Runtime behavior

- Missing credentials disable only the affected exporter.
- Exporter failures do not prevent the application from starting.
- Filesystem auto-instrumentation is disabled to reduce noise and overhead.
- Process uptime and memory usage are recorded as observable metrics.
- API RED metrics use bounded route, method, status, operation, and outcome
  dimensions.
- Kubernetes CPU profiling is performed by the Alloy eBPF DaemonSet.
- Shutdown errors are reported through the caller-provided callback.

## Browser observability

The frontend initializes Grafana Faro only when `VITE_GRAFANA_FARO_URL` is
defined. It records browser errors, navigation, Web Vitals, CSP violations,
performance, and non-persistent sessions. Console capture is disabled to reduce
the chance of collecting user-entered data.

## Grafana operations

Import `ops/observability/grafana/service-overview.dashboard.json` and
`ops/observability/grafana/service-alerts.yaml`. The shared incident procedure
is `ops/observability/runbooks/service-observability.md`.

## Validation

```bash
pnpm nx test observability
pnpm nx run observability:build
pnpm nx lint observability
pnpm nx run service-auth:typecheck
pnpm nx run service-auth:build
```
