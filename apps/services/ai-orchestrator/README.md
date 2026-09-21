# AI Orchestrator Service

Cloudflare-first orchestration entry point for Aerealith AI.

## Responsibilities

- Accept normalized AI run requests.
- Route by capability rather than by provider.
- Keep provider/model selection behind orchestration abstractions.
- Provide the foundation for text, code, image, audio, video, music, analytics, prediction, retrieval, and tool execution.
- Integrate with Aerealith observability without storing Grafana credentials in source control.

This first scaffold intentionally does not bind to a model vendor, Qdrant, Cloudflare Workflow, Queue, or Durable Object. Those integrations should implement stable interfaces so the orchestration domain remains portable.
