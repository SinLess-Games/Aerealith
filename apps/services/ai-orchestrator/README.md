# AI Orchestrator Service

Cloudflare-first orchestration entry point for Aerealith AI.

## Responsibilities

- Accept normalized, capability-specific AI run requests.
- Authenticate callers through the private `aerealith-auth` Worker binding.
- Derive tenant and actor identity from authenticated server context.
- Route work by capability rather than provider.
- Use Cloudflare Workers AI as the built-in inference provider.
- Start durable Cloudflare Workflow instances for production runs.
- Persist per-run state in SQLite-backed Durable Objects.
- Integrate Qdrant through a provider-neutral vector-store boundary.
- Persist generated media and large outputs to R2.
- Support knowledge ingestion and retrieval with tenant-isolated namespaces.
- Preserve request and correlation IDs across the API boundary.

## Runtime layout

The HTTP/Cloudflare runtime lives in:

```text
apps/services/ai-orchestrator
```

Reusable provider-neutral orchestration code lives in:

```text
libs/ai-orchestration
```

Current adapters include:

```text
libs/ai-cloudflare-workers
libs/ai-qdrant
libs/ai-openai-compatible
```

Cloudflare runtime details remain behind service/adaptor boundaries instead of
leaking into the orchestration domain.

## Cloudflare Workers AI

The orchestrator uses a native Workers AI binding:

```toml
[ai]
binding = "AI"
```

Cloudflare-hosted models do not require provider API keys. The current built-in
model catalog is:

| Capability | Model |
| --- | --- |
| General text, analytics, prediction, code fallback | `@cf/zai-org/glm-4.7-flash` |
| Code generation | `@cf/qwen/qwen2.5-coder-32b-instruct` |
| Embeddings | `@cf/qwen/qwen3-embedding-0.6b` |
| Reranking | `@cf/baai/bge-reranker-base` |
| Image generation | `@cf/black-forest-labs/flux-1-schnell` |
| Text-to-speech | `@cf/deepgram/aura-2-en` |

The embedding model is configured as a 1,024-dimension cosine embedding model
for Qdrant knowledge indexes.

Video and music remain declared Aerealith capabilities but are not advertised
as executable until a compatible runtime provider is added.

Optional OpenAI-compatible providers can still be registered through
`AI_PROVIDER_CATALOG`, but they are no longer required for the Cloudflare
deployment.

## Current API

- `GET /health`
- `GET /ready`
- `GET /api/V1/services/ai-orchestrator`
- `GET /api/V1/ai/capabilities`
- `GET /api/V1/ai/providers`
- `GET /api/V1/ai/vector-store`
- `GET /api/V1/ai/runs/:runId`
- `POST /api/V1/ai/runs`
- `DELETE /api/V1/ai/runs/:runId`

Run creation, status, and cancellation are authenticated. A caller cannot read
or cancel another user's run even if the run UUID is known.

## Durable run lifecycle

Production submissions are persisted before Workflow dispatch.

```text
accepted
  ↓
planning
  ↓
queued
  ↓
running
  ├── succeeded
  ├── failed
  └── cancelled
```

Each run is keyed by its run UUID and stored in a SQLite-backed
`AiRunState` Durable Object.

The state layer:

- validates lifecycle transitions;
- automatically records execution/completion timestamps;
- stores provider/model selection and normalized output;
- limits inline durable output to 512 KiB;
- marks Workflow-dispatch failures explicitly;
- supports Workflow termination for cancellation.

## Authentication and tenant isolation

The Worker uses:

```toml
[[services]]
binding = "AUTH_WORKER"
service = "aerealith-auth"
```

Authenticated identity is resolved through `GET /api/V1/auth/me`.

Clients cannot submit `tenantId` or `actorId`. The service derives both from
trusted authentication context before starting a run.

Knowledge namespaces are server-scoped. A client namespace such as:

```text
project-docs
```

is stored internally as:

```text
user:<authenticated-user-id>:knowledge:project-docs
```

This prevents one caller from selecting another caller's Qdrant namespace.

## Knowledge ingestion and retrieval

Knowledge operations use the same durable run API.

The runtime:

1. validates document and chunking limits;
2. derives the authenticated tenant namespace;
3. chunks documents;
4. selects the Workers AI embedding model;
5. creates 1,024-dimension embeddings;
6. verifies/provisions the Qdrant collection schema;
7. upserts deterministic tenant-scoped points.

Retrieval embeds the query first and then searches Qdrant with a mandatory
server-derived tenant filter.

## Qdrant Cloud

The configured Aerealith Qdrant Cloud endpoint is:

```text
https://6f069294-5f27-4777-9c34-128b132ab175.australia-southeast1-0.gcp.cloud.qdrant.io
```

The endpoint and collection name are ordinary Wrangler variables.

`QDRANT_API_KEY` is an account-level Cloudflare Secrets Store binding and is
resolved asynchronously with `env.QDRANT_API_KEY.get()`. No Qdrant
credential is committed or stored as a per-Worker plaintext variable.

The shared collection is currently:

```text
aerealith-knowledge-v1
```

The Qdrant adapter uses payload-based multitenancy, a tenant keyword index,
deterministic UUID point IDs, mandatory namespace filtering, and live
embedding-schema compatibility checks.

## Artifact storage

Generated binary media and oversized outputs are stored in the existing
`aerealith-ai` R2 bucket through the `AI_ARTIFACTS` binding.

Artifacts are scoped to a hashed tenant namespace and are never exposed by raw
R2 key.

Workers AI image and audio results are materialized to R2 before the Workflow
step returns, so Durable Object state stores serializable artifact references
rather than large binary payloads.

## Cloudflare Secrets Store

Production credentials use the account-level Secrets Store.

The orchestrator currently binds:

- `QDRANT_API_KEY`
- `OTEL_EXPORTER_OTLP_HEADERS`
- `PROMETHEUS_TOKEN`
- `LOKI_TOKEN`
- `TEMPO_TOKEN`
- `PYROSCOPE_TOKEN`

The store ID is referenced by Wrangler configuration, while secret values stay
outside the repository.

`ADMIN_PASSWORD`, `DATABASE_URL`, and `RESEND_API_KEY` remain available
in the account store but are not bound to the AI orchestrator because this
service does not need them.

## Grafana Cloud

Cloudflare Worker invocation logs and traces are enabled.

The supplied Grafana Cloud metrics, OTLP, Loki, Tempo, and Pyroscope endpoints
are non-secret Wrangler variables. Their authentication material remains in
Secrets Store.

The next observability pass will add AI-specific telemetry such as:

- capability and model selection;
- provider latency;
- run duration;
- token/usage counts;
- estimated inference cost;
- Qdrant latency;
- Workflow failures and retries;
- artifact size and generation time.

## Next runtime work

1. Add direct Workers AI reranking into the retrieval pipeline.
2. Add AI-specific Grafana metrics, traces, and cost attribution.
3. Add server-enforced quotas, per-tenant rate limits, and cost budgets.
4. Add tool execution workers and the code-sandbox implementation.
5. Add organization/workspace ownership above current user-scoped tenancy.
6. Add preview/staging resource isolation and production deployment validation.
7. Add video/music providers only when a suitable Cloudflare-native or
   explicitly configured provider is available.

Secrets, Grafana tokens, and Qdrant credentials must remain outside source
control.
