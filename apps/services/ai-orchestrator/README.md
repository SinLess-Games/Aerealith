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
- `POST /api/V1/ai/runs`

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
4. Qdrant vector-store adapter.
5. Tool approval and execution policies.
6. Server-enforced quotas, cost budgets, and rate limits.
7. Grafana Cloud OTLP destination wiring and AI-specific telemetry.
8. Artifact storage for generated image, audio, video, and other binary output.

Secrets, model API keys, Grafana tokens, and Qdrant credentials must remain
outside source control.
