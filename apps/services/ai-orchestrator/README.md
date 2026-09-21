# AI Orchestrator Service

Cloudflare-first orchestration entry point for Aerealith AI.

## Responsibilities

- Accept normalized AI run requests.
- Route work by capability rather than provider.
- Start durable Cloudflare Workflow instances for production runs.
- Keep provider/model selection behind orchestration abstractions.
- Provide a stable foundation for text, code, image, audio, video, music,
  analytics, prediction, retrieval, and tool execution.
- Preserve request correlation IDs across the API boundary.
- Keep user, tenant, and actor identity out of request-controlled fields. Those
  values must eventually come from authenticated server context.

## Runtime layout

The HTTP Worker lives in `apps/services/ai-orchestrator`.

Reusable orchestration logic lives in `libs/ai-orchestration`, including:

- capability contracts
- provider registration
- model routing
- provider execution
- tool registration
- vector-store contracts
- run-store contracts

Production submissions are dispatched through the
`AI_ORCHESTRATION_WORKFLOW` Cloudflare Workflow binding. Local and unit-test
execution can use the lightweight in-process engine until runtime bindings are
available.

## Current API

- `GET /health`
- `GET /ready`
- `GET /api/V1/services/ai-orchestrator`
- `GET /api/V1/ai/capabilities`
- `GET /api/V1/ai/vector-store`
- `GET /api/V1/ai/runs/:runId`
- `POST /api/V1/ai/runs`

## Qdrant Cloud

The orchestrator is configured to use the Aerealith Qdrant Cloud endpoint:

`https://6f069294-5f27-4777-9c34-128b132ab175.australia-southeast1-0.gcp.cloud.qdrant.io`

The endpoint and shared collection name are ordinary Wrangler variables. The API key
must remain a Cloudflare secret:

```bash
cd apps/services/ai-orchestrator
pnpm exec wrangler secret put QDRANT_API_KEY
```

Current runtime variables:

- `QDRANT_URL` — Qdrant Cloud cluster URL.
- `QDRANT_API_KEY` — secret used for Qdrant authentication.
- `QDRANT_COLLECTION` — defaults to `aerealith-knowledge-v1`.

The service only reports whether Qdrant is configured; it never returns the
endpoint or API key through its status API.

The Qdrant adapter uses one shared knowledge collection with payload-based multitenancy. Every vector is tagged with its logical namespace, every search injects the namespace filter, and the collection provisions a tenant keyword index for that field. This avoids a collection-per-user design while preserving isolation at the vector-store boundary. The production collection is versioned so embedding-schema migrations can move to a new collection without mutating live data in place.

## Durable run state

Each AI run is keyed by its generated run UUID and persisted in a
SQLite-backed Cloudflare Durable Object through the `AI_RUN_STATE` binding.

The durable state layer:

- writes the `accepted` state before starting the Workflow;
- records Workflow transitions such as `planning` and `queued`;
- validates allowed run-state transitions;
- marks dispatch failures as `failed`;
- makes run status queryable through `GET /api/V1/ai/runs/:runId`;
- keeps each run isolated in its own Durable Object.

Durable Object migration `v1` creates the `AiRunState` SQLite-backed class.

## Grafana Cloud

Cloudflare Workers observability is enabled in Wrangler.

For production, prefer the native Cloudflare Workers observability destination
integration for logs and traces, pointed at the Grafana Cloud OTLP gateway.
Keep Grafana access-policy tokens in the Cloudflare destination configuration
or secret storage; never commit them or place them in ordinary Wrangler vars.

The direct Prometheus, Loki, Tempo, and Pyroscope stack endpoints remain useful
for non-Worker services and collectors. The Worker deployment should use the
Grafana Cloud OTLP endpoint when the Cloudflare observability destinations are
created.

## Next runtime integrations

1. Authenticated tenant and actor context.
2. Production provider/model catalog and provider credentials.
3. Execute selected providers from the durable Workflow lifecycle.
4. Production embedding-provider configuration for Qdrant ingestion/retrieval.
5. Run result persistence and cancellation.
6. Server-enforced quotas, cost budgets, and rate limits.
7. Grafana Cloud OTLP destination wiring and AI-specific telemetry.
8. R2 artifact storage for generated image, audio, video, and other binary output.

Secrets, model API keys, Grafana tokens, and Qdrant credentials must remain
outside source control.
