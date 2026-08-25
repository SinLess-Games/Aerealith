# Aerealith Observability

`@aerealith-ai/observability` provides structured logging plus Node.js metrics,
distributed tracing, automatic instrumentation, and continuous profiling.

## Grafana Cloud signals

| Signal                        | Transport          | Grafana backend        |
| ----------------------------- | ------------------ | ---------------------- |
| Structured logs               | Loki push API      | Loki                   |
| Metrics                       | OTLP/HTTP protobuf | Prometheus/Mimir       |
| Traces                        | OTLP/HTTP protobuf | Tempo                  |
| CPU and wall profiles         | Pyroscope SDK      | Grafana Cloud Profiles |
| Browser errors and Web Vitals | Faro collector     | Frontend Observability |

Grafana Cloud's unified OTLP gateway is used for metrics and traces. The SDK
automatically uses `/v1/metrics` and `/v1/traces` below the configured
`OTEL_EXPORTER_OTLP_ENDPOINT`.

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
buffered spans, metrics, and profiles are flushed.

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

PYROSCOPE_SERVER_ADDRESS=https://profiles.example.com
PYROSCOPE_BASIC_AUTH_USER=stack_user
PYROSCOPE_BASIC_AUTH_PASSWORD=cloud_access_policy_token
```

Never commit Grafana Cloud tokens or a completed authorization header.
Low-cardinality fields such as service and environment are labels. User IDs,
request IDs, session IDs, and resource IDs remain structured fields rather
than labels.

## Runtime behavior

- Missing credentials disable only the affected exporter.
- Exporter and profiler failures do not prevent the application from starting.
- Filesystem auto-instrumentation is disabled to reduce noise and overhead.
- Process uptime and memory usage are recorded as observable metrics.
- API RED metrics use bounded route, method, status, operation, and outcome
  dimensions.
- Pyroscope CPU-time collection is enabled unless explicitly disabled.
- Shutdown errors are reported through the caller-provided callback.

## Browser observability

The frontend initializes Grafana Faro only when `VITE_GRAFANA_FARO_URL` is
defined. It records browser errors, navigation, Web Vitals, CSP violations,
performance, and non-persistent sessions. Console capture is disabled to reduce
the chance of collecting user-entered data.

## Grafana operations

Import the dashboard and alert definitions under `ops/observability/grafana`.
The associated auth incident procedure is under
`ops/observability/runbooks/auth-service.md`.

## Validation

```bash
pnpm nx test observability
pnpm nx run observability:build
pnpm nx lint observability
pnpm nx run service-auth:typecheck
pnpm nx run service-auth:build
```
