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
- `GET /api/V1/ai/models`
- `GET /api/V1/ai/vector-store`
- `GET /api/V1/ai/usage`
- `GET /api/V1/ai/runs`
- `GET /api/V1/ai/runs/:runId`
- `GET /api/V1/ai/runs/:runId/events`
- `POST /api/V1/ai/runs`
- `DELETE /api/V1/ai/runs/:runId`
- `GET /api/V1/ai/artifacts/:artifactId`
- `DELETE /api/V1/ai/artifacts/:artifactId`

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

The orchestrator currently binds only `QDRANT_API_KEY` from Secrets Store,
because that is the only account secret needed by the Worker runtime.

Grafana credentials remain in the account Secrets Store but are not exposed to
the Worker. Cloudflare Workers Observability destinations own Grafana OTLP
authentication instead. This keeps the runtime least-privileged.

`ADMIN_PASSWORD`, `DATABASE_URL`, `RESEND_API_KEY`, and unrelated
Grafana credentials are not bound to this service.

## Grafana Cloud

Cloudflare Worker invocation logs and traces are enabled. The service emits
structured AI lifecycle logs containing safe operational fields such as
capability, provider, model, duration, usage, estimated cost, artifact count,
and failure code.

For Grafana Cloud, create account-level Cloudflare Workers Observability
destinations for logs and traces and point them at the Grafana OTLP endpoints.
The Grafana authentication header belongs to the destination configuration,
not the Worker environment.

Current AI-specific telemetry includes:

- capability and model selection;
- provider latency;
- run duration;
- token/usage counts;
- estimated inference cost;
- Qdrant latency;
- Workflow failures and retries;
- artifact size and generation time.

## Current production controls

The API now includes:

- per-tenant fixed-window run rate limiting;
- daily run quotas;
- daily estimated-cost budgets;
- authenticated daily usage reporting;
- per-tenant run history;
- SSE run lifecycle events for responsive UIs;
- model/capability discovery;
- authenticated artifact retrieval and deletion;
- Workflow cancellation.

Daily run and cost limits default to unlimited until product-tier limits are
configured, while the per-minute limiter defaults to 60 runs/minute.

## Remaining runtime work

1. Implement the Cloudflare Sandbox-backed coding-agent execution service.
2. Configure Grafana Cloud account-level log/trace destinations.
3. Add organization/workspace ownership above current user-scoped tenancy.
4. Add preview/staging resource isolation and production deployment validation.
5. Add video/music providers only when a suitable runtime provider is selected.

Secrets, Grafana tokens, and Qdrant credentials must remain outside source
control.
