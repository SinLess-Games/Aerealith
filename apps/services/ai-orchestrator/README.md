# AI Orchestrator Service

Cloudflare-first orchestration entry point for Aerealith AI.

## Responsibilities

- Accept normalized, capability-specific AI run requests.
- Authenticate callers through the private `aerealith-auth` Worker binding.
- Derive tenant and actor identity from authenticated server context.
- Route work by capability rather than provider.
- Start durable Cloudflare Workflow instances for production runs.
- Persist per-run state in SQLite-backed Durable Objects.
- Route across configured providers and models with fallback support.
- Integrate Qdrant through a provider-neutral vector-store boundary.
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

Current infrastructure/provider adapters include:

```text
libs/ai-qdrant
libs/ai-openai-compatible
```

Cloudflare types remain in the service boundary rather than leaking into the
orchestration library.

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

Large generated outputs should be written to artifact storage rather than
embedded in run state.

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

Knowledge namespaces are also server-scoped. A client namespace such as:

```text
project-docs
```

is stored internally as:

```text
user:<authenticated-user-id>:knowledge:project-docs
```

This prevents one caller from selecting another caller's Qdrant namespace.

## Model provider catalog

Providers are configured through `AI_PROVIDER_CATALOG`. Provider endpoints and
model metadata are ordinary configuration; credentials remain secret bindings.

The current adapter supports OpenAI-compatible HTTP APIs for:

- text generation;
- code-generation tasks;
- embeddings.

Example catalog:

```json
[
  {
    "id": "primary",
    "kind": "openai-compatible",
    "baseUrl": "https://models.example.invalid/v1",
    "apiKeyBinding": "PRIMARY_MODEL_API_KEY",
    "models": [
      {
        "id": "chat-model",
        "capabilities": ["text", "code"],
        "priority": 100,
        "contextWindow": 128000
      },
      {
        "id": "embedding-model",
        "capabilities": ["embedding"],
        "priority": 100,
        "embeddingDimensions": 1536
      }
    ]
  }
]
```

The referenced credential is created separately:

```bash
cd apps/services/ai-orchestrator
pnpm exec wrangler secret put PRIMARY_MODEL_API_KEY
```

The provider status endpoint reports only safe metadata such as provider ID,
capabilities, model count, and configured state. It does not expose base URLs
or credentials.

Production run submission fails closed when no configured runtime path can
execute the requested capability.

## Knowledge ingestion and retrieval

Knowledge operations use the same durable run API.

Example ingestion body:

```json
{
  "capability": "knowledge-ingest",
  "input": {
    "namespace": "project-docs",
    "documents": [
      {
        "id": "document-1",
        "text": "Document contents",
        "metadata": {
          "source": "documentation"
        }
      }
    ]
  }
}
```

The runtime:

1. validates document and chunking limits;
2. derives the authenticated tenant namespace;
3. chunks documents;
4. selects a configured embedding model;
5. creates embeddings;
6. verifies/provisions the Qdrant collection schema;
7. upserts deterministic tenant-scoped points.

Retrieval similarly embeds the query first and then searches Qdrant with a
mandatory server-derived tenant filter.

## Qdrant Cloud

The configured Aerealith Qdrant Cloud endpoint is:

```text
https://6f069294-5f27-4777-9c34-128b132ab175.australia-southeast1-0.gcp.cloud.qdrant.io
```

The endpoint and shared collection name are ordinary Wrangler variables. The
API key remains a Cloudflare secret:

```bash
cd apps/services/ai-orchestrator
pnpm exec wrangler secret put QDRANT_API_KEY
```

Current runtime configuration:

- `QDRANT_URL` — Qdrant Cloud cluster URL.
- `QDRANT_API_KEY` — secret used for Qdrant authentication.
- `QDRANT_COLLECTION` — currently `aerealith-knowledge-v1`.

The Qdrant adapter uses one shared, versioned collection with payload-based
multitenancy instead of creating a collection for every user.

Every point stores its logical namespace. Every query injects the namespace
constraint. The collection provisions the namespace field as a keyword tenant
index. Application record IDs are mapped to deterministic UUID point IDs while
the original IDs remain in payload.

The adapter also validates the live collection's vector dimensions and distance
metric before ingestion. An incompatible embedding schema fails before vectors
are written, making migration to `aerealith-knowledge-v2` or later explicit.

## Grafana Cloud

Cloudflare Workers observability is enabled for invocation logs and traces.

Grafana credentials are not committed. Grafana Cloud tokens should remain in
Cloudflare Secrets Store or Cloudflare observability-destination configuration.

The project already has the supplied Grafana Cloud metrics, Loki, Tempo, and
Pyroscope endpoint information available for the observability integration.
The Worker-specific export path should use OTLP/Cloudflare observability
destinations where possible, while containerized/self-hosted execution can use
the direct stack endpoints.

## Next runtime work

1. Add R2-backed artifact storage for generated media and large run results.
2. Add media-provider adapters for image, audio, video, and music.
3. Add tool execution workers and the code-sandbox implementation.
4. Add server-enforced quotas, per-tenant rate limits, and cost budgets.
5. Add AI-specific Grafana metrics/traces and cost attribution.
6. Add reranking and richer retrieval policies.
7. Add organization/workspace ownership above the current user-scoped tenancy
   model.
8. Add preview/staging resource isolation and production deployment validation.

Secrets, model API keys, Grafana tokens, and Qdrant credentials must remain
outside source control.
