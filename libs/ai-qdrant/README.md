# AI Qdrant Adapter

Qdrant implementation of the Aerealith `VectorStore` contract.

Embedding generation is deliberately outside this adapter. Text must be embedded
before vector search so model selection and embedding cost remain part of the
orchestration layer.

Qdrant URLs and API keys are runtime configuration and must not be committed.
