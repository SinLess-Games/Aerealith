# OpenAI-Compatible AI Provider

Provider adapter for OpenAI-compatible HTTP APIs.

It currently supports:

- chat/text generation
- code generation via chat completions
- embeddings

The adapter is endpoint-agnostic and can be pointed at any service that
implements the compatible `/chat/completions` and/or `/embeddings` routes.
API keys and endpoints are runtime configuration and must not be committed.
