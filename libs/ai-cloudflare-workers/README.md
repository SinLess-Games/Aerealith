# Cloudflare Workers AI Provider

Aerealith provider adapter for Cloudflare Workers AI.

The adapter uses the Worker `AI` binding directly, so Cloudflare-hosted
models do not require provider API keys in Aerealith. The default catalog uses
Cloudflare-hosted models for text, code, embeddings, reranking, image
generation, audio generation, analytics, and prediction.

Video and music generation remain unavailable until Cloudflare exposes a
suitable Workers AI model or Aerealith adds another provider adapter.
