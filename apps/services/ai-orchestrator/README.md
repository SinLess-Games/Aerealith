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
- `POST /api/V1/ai/runs`

## Qdrant Cloud

The orchestrator is configured to use the Aerealith Qdrant Cloud endpoint:

`https://6f069294-5f27-4777-9c34-128b132ab175.australia-southeast1-0.gcp.cloud.qdrant.io`

The endpoint and collection prefix are ordinary Wrangler variables. The API key
must remain a Cloudflare secret:

```bash
cd apps/services/ai-orchestrator
pnpm exec wrangler secret put QDRANT_API_KEY
```

Current runtime variables:

- `QDRANT_URL` — Qdrant Cloud cluster URL.
- `QDRANT_API_KEY` — secret used for Qdrant authentication.
- `QDRANT_COLLECTION_PREFIX` — defaults to `aerealith-`.

The service only reports whether Qdrant is configured; it never returns the
endpoint or API key through its status API.

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
2. Provider/model catalog and provider adapters.
3. Durable run persistence.
4. Embedding provider integration for Qdrant knowledge ingestion/retrieval.
5. Durable run persistence.
6. Server-enforced quotas, cost budgets, and rate limits.
7. Grafana Cloud OTLP destination wiring and AI-specific telemetry.
8. Artifact storage for generated image, audio, video, and other binary output.

Secrets, model API keys, Grafana tokens, and Qdrant credentials must remain
outside source control.
