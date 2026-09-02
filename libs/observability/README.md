# Aerealith Observability

`@aerealith-ai/observability` is the canonical observability layer for Node.js
services, API processes, Discord workers, background jobs, queues, scheduled
tasks, and integration services.

It provides one public boundary for structured logs, asynchronous operation
context, error reporting, Prometheus metrics, OpenTelemetry tracing, health
checks, performance measurements, and graceful shutdown. The core APIs do not
depend on an HTTP framework, Discord.js, BullMQ, Redis, or a database client.

## Architecture

| Capability            | Implementation                            | Behavior when disabled              |
| --------------------- | ----------------------------------------- | ----------------------------------- |
| Production logs       | Pino JSON, with optional Loki sink        | No-op logger                        |
| Local logs            | Existing human-readable console formatter | No output                           |
| Context               | Node.js `AsyncLocalStorage`               | Not applicable                      |
| Error reporting       | `@sentry/node`                            | Safe no-op without a DSN            |
| Scrape metrics        | `@prometheus-io/client`                   | Helpers become no-ops               |
| Tracing               | Existing OpenTelemetry SDK                | Span helpers run callbacks directly |
| Metrics/traces export | Existing OTLP protobuf exporters          | Disabled without an endpoint        |
| Profiling             | Existing Pyroscope integration            | Disabled without credentials        |
| Health                | Registered application callbacks          | Empty healthy result                |

Sentry is initialized with `skipOpenTelemetrySetup: true`. Aerealith already
owns an OpenTelemetry SDK and exporter pipeline, so Sentry must not install a
second tracer provider or duplicate automatic instrumentation.

## Initialization

Initialize observability before importing most application code when Node
automatic instrumentation is enabled:

```ts
import { initializeObservability, resolveObservabilityConfigFromEnv } from '@aerealith-ai/observability';

const observability = await initializeObservability(
  resolveObservabilityConfigFromEnv(process.env, {
    service: 'discord-bot',
    version: process.env['APP_VERSION'],
    node: { enabled: true, environment: process.env },
  }),
);

const { startBot } = await import('./bot');
await startBot(observability.logger);
```

Initialization is idempotent. Repeated calls return the first initialization
promise. Optional integrations fail closed and do not require every
application to configure every subsystem.

Supported configuration variables include:

```dotenv
OBSERVABILITY_SERVICE_NAME=discord-bot
OBSERVABILITY_ENVIRONMENT=production
OBSERVABILITY_LOG_LEVEL=info
OBSERVABILITY_PRETTY_LOGS=false

SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
SENTRY_TRACES_SAMPLE_RATE=0

METRICS_ENABLED=true
TRACING_ENABLED=true
```

The existing Node adapter also understands the Grafana/Loki, OTLP, and
Pyroscope settings documented below. Use `toSafeObservabilityConfig()` for
diagnostics; it reports whether Sentry is configured without returning the
DSN.

## Structured logging

The logger supports both the repository's canonical `LogInput` shape and
Pino-style bindings:

```ts
import { createLogger } from '@aerealith-ai/observability';

const logger = createLogger({
  service: 'discord-bot',
  environment: 'production',
});

logger.info({ shardId: 3 }, 'Shard ready');

const commandLogger = logger.child({
  guildId,
  userId,
  command: commandName,
});

commandLogger.error({ err }, 'Command failed');

logger.info({
  event: 'discord.shard.ready',
  message: 'Shard ready.',
  component: 'gateway',
  context: { shardId: 3 },
});
```

Production output is structured Pino JSON. Local output can use the existing
readable formatter. Child loggers inherit context, and every call reads the
current asynchronous observability context automatically.

Standard fields include service, component, environment, version, hostname,
PID, instance ID, correlation/request IDs, trace/span IDs, job IDs, guild IDs,
shard IDs, and user IDs when the caller supplies them. Application-specific
fields are not forced onto unrelated processes.

## Correlation and operation context

```ts
import { getCorrelationId, getObservabilityContext, runWithObservabilityContext } from '@aerealith-ai/observability';

await runWithObservabilityContext({ requestId, correlationId, guildId, userId }, async () => {
  await executeCommand();
  logger.info('Command completed');
});
```

Nested operations inherit parent values and may override individual fields.
Concurrent asynchronous operations remain isolated. When a context starts
without a correlation ID, the library creates one with the repository's ID
utility.

## Error normalization and Sentry

JavaScript may throw any value. `normalizeError()` produces a stable name,
message, code, stack, cause chain, and sanitized context for `Error` instances,
strings, objects, and unknown promise rejections.

```ts
import { captureException, captureMessage, initializeSentry } from '@aerealith-ai/observability';

initializeSentry({
  service: 'worker',
  dsn: process.env['SENTRY_DSN'],
  environment: 'production',
  release: '1.0.0',
});

captureException(error, { operation: 'queue.consume' });
captureMessage('Queue processing is degraded', 'warning');
```

Sentry calls are no-ops when the DSN is absent. Real `Error` objects are
preserved for SDK stack handling. Event metadata passes through the same
central redaction logic as logs, and `sendDefaultPii` is disabled. Advanced
consumers can use `getSentrySdk()` when the narrow wrapper does not expose a
required SDK feature.

## Prometheus metrics

The library owns a dedicated registry and protects repeated initialization,
tests, and hot reload from duplicate metric registration errors.

```ts
import { createCounter, getMetrics, getMetricsContentType, incrementCounter } from '@aerealith-ai/observability';

const jobs = createCounter({
  name: 'aerealith_jobs_total',
  help: 'Completed jobs by stable queue and outcome.',
  labelNames: ['queue', 'outcome'],
});

incrementCounter(jobs, { queue: 'emails', outcome: 'success' });

const body = await getMetrics();
const contentType = getMetricsContentType();
```

`configureMetrics()` installs common service metrics:

- `aerealith_errors_total`
- `aerealith_operations_total`
- `aerealith_operation_duration_seconds`
- `aerealith_active_operations`
- `aerealith_process_up`

### Metric cardinality rules

Metric labels must be bounded, stable categories such as operation, outcome,
component, queue, method, or normalized route. Never use user IDs, guild IDs,
request/correlation IDs, trace/span IDs, arbitrary URLs, exception messages,
or user-provided text. The registry rejects the most common unsafe label names.
Application-specific metrics belong in the application or a dedicated adapter,
not in this shared core.

## Performance measurements

`startTimer()` uses the high-resolution performance clock and returns an
idempotent `end()` function. `measureOperation()` records duration, active
operations, outcome counters, structured logs, and an OpenTelemetry span:

```ts
const user = await measureOperation('database.user.lookup', () => repository.findUser(id), { component: 'user-repository' });
```

The original result or error is preserved. Correlation context remains active
through the measured callback.

## Tracing

Tracing uses the repository's existing OpenTelemetry API and Node SDK:

```ts
const result = await withSpan('discord.command.execute', async () => {
  return executeCommand();
});

const span = startSpan('queue.publish');
try {
  await span.run(() => publish());
} catch (error) {
  span.recordException(error);
  throw error;
} finally {
  span.end();
}
```

`getTraceContext()` exposes active trace and span IDs without coupling callers
to an exporter vendor. Disabled tracing executes callbacks normally.

## Health and readiness

The library never opens dependency connections. Applications register checks:

```ts
const unregister = registerHealthCheck({
  name: 'database',
  required: true,
  timeoutMs: 2_000,
  check: async () => {
    await database.ping();
  },
});

const health = await runHealthChecks();
unregister();
```

Results include `healthy`, `degraded`, or `unhealthy`, timestamp, process
uptime, per-check duration, and required/optional state. A required failure is
unhealthy. An optional failure or explicitly degraded check makes the aggregate
degraded. Failure details use generic messages and safe error classifications;
connection strings and raw credentials are not returned.

## Shutdown

Applications own process signal handlers. The library does not install them:

```ts
process.once('SIGTERM', () => {
  void shutdownObservability(5_000).finally(() => process.exit(0));
});
```

Shutdown is idempotent, deadline-bounded, and handles partial initialization.
It closes logs, flushes Sentry, and stops the existing OTLP/Pyroscope runtime.
Additional exporters may register a named shutdown handler.

## Grafana Cloud exporters

The existing Node adapter remains supported:

```dotenv
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway.example.com/otlp
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

Never commit exporter credentials or a completed authorization header.

## Security and redaction

Observability is a data-exfiltration boundary. Central sanitization protects
case- and separator-insensitive secret keys, including authorization, cookies,
password/passwd, tokens, API keys, client secrets, Discord tokens, Sentry DSNs,
and database/Redis URLs. Credentials embedded in URL strings are removed from
logs, errors, health metadata, and Sentry events.

Do not log complete request bodies, response bodies, cookies, OAuth material,
private keys, or arbitrary user content. PII is opt-in. Redaction is a final
safety net, not permission to pass sensitive payloads to the logger.

## Testing and validation

Tests must not send real Sentry events or telemetry. Use disabled integrations,
mock SDK boundaries, and reset the dedicated metrics/health registries:

```bash
pnpm nx show project observability
pnpm nx run observability:typecheck
pnpm nx test observability
pnpm nx lint observability
pnpm nx build observability
```

The observability test suite covers logger creation, Pino JSON, child and async
context, redaction, arbitrary thrown values, metrics, cardinality protection,
health aggregation and timeout, performance outcomes, Sentry no-op behavior,
and idempotent bounded shutdown.
