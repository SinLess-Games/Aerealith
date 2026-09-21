import type { ModelDescriptor } from '@aerealith-ai/ai-orchestration';

export const CLOUDFLARE_WORKERS_AI_PROVIDER_ID = 'cloudflare-workers-ai';

export const CloudflareWorkersAiModels = {
  general: '@cf/zai-org/glm-4.7-flash',
  code: '@cf/qwen/qwen2.5-coder-32b-instruct',
  embedding: '@cf/qwen/qwen3-embedding-0.6b',
  rerank: '@cf/baai/bge-reranker-base',
  image: '@cf/black-forest-labs/flux-1-schnell',
  audio: '@cf/deepgram/aura-2-en',
} as const;

export const cloudflareWorkersAiModelCatalog: readonly ModelDescriptor[] = [
  {
    id: CloudflareWorkersAiModels.general,
    providerId: CLOUDFLARE_WORKERS_AI_PROVIDER_ID,
    capabilities: ['text', 'code', 'analytics', 'prediction'],
    priority: 100,
    supportsStreaming: true,
    contextWindow: 131_072,
    inputCostPerMillionUnitsUsd: 0.0605,
    outputCostPerMillionUnitsUsd: 0.4,
  },
  {
    id: CloudflareWorkersAiModels.code,
    providerId: CLOUDFLARE_WORKERS_AI_PROVIDER_ID,
    capabilities: ['code'],
    priority: 110,
    supportsStreaming: true,
    contextWindow: 32_768,
    inputCostPerMillionUnitsUsd: 0.66,
    outputCostPerMillionUnitsUsd: 1,
  },
  {
    id: CloudflareWorkersAiModels.embedding,
    providerId: CLOUDFLARE_WORKERS_AI_PROVIDER_ID,
    capabilities: ['embedding'],
    priority: 100,
    contextWindow: 4_096,
    embeddingDimensions: 1_024,
    inputCostPerMillionUnitsUsd: 0.012,
  },
  {
    id: CloudflareWorkersAiModels.rerank,
    providerId: CLOUDFLARE_WORKERS_AI_PROVIDER_ID,
    capabilities: ['rerank'],
    priority: 100,
    inputCostPerMillionUnitsUsd: 0.00311,
  },
  {
    id: CloudflareWorkersAiModels.image,
    providerId: CLOUDFLARE_WORKERS_AI_PROVIDER_ID,
    capabilities: ['image'],
    priority: 100,
  },
  {
    id: CloudflareWorkersAiModels.audio,
    providerId: CLOUDFLARE_WORKERS_AI_PROVIDER_ID,
    capabilities: ['audio'],
    priority: 100,
  },
];
