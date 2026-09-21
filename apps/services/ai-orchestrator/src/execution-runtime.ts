import type { GeneratedBinary } from '@aerealith-ai/ai-cloudflare-workers';
import {
  capabilityKinds,
  CapabilityRoutingPolicy,
  FixedWindowTextChunker,
  KnowledgeIngestionService,
  OrchestrationExecutor,
  ProviderEmbeddingGenerator,
  type CapabilityKind,
  type EmbeddingOutput,
  type KnowledgeIngestionInput,
  type KnowledgeIngestionOutput,
  type MediaGenerationOutput,
  type ModelDescriptor,
  type ModelProvider,
  type OrchestrationOutput,
  type OrchestrationRequest,
  type RetrievalInput,
  type RetrievalMatch,
  type RetrievalOutput,
  type RerankOutput,
} from '@aerealith-ai/ai-orchestration';

import { createArtifactStore } from './artifact-runtime';
import type { AiOrchestratorBindings } from './bindings';
import { createProviderRegistry } from './provider-runtime';
import {
  createVectorStore,
  vectorStoreStatus,
} from './vector-store';

export class VectorStoreUnavailableError extends Error {
  constructor() {
    super('The vector store is not configured.');
    this.name = 'VectorStoreUnavailableError';
  }
}

export class ArtifactStoreUnavailableError extends Error {
  constructor() {
    super('The artifact store is not configured.');
    this.name = 'ArtifactStoreUnavailableError';
  }
}

export class TenantContextRequiredError extends Error {
  constructor() {
    super('A trusted tenant context is required for knowledge and media operations.');
    this.name = 'TenantContextRequiredError';
  }
}

export class EmbeddingDimensionsRequiredError extends Error {
  constructor(modelId: string) {
    super(
      `Embedding model "${modelId}" must declare embeddingDimensions before it can ingest knowledge.`,
    );
    this.name = 'EmbeddingDimensionsRequiredError';
  }
}

export function executableCapabilities(
  bindings: AiOrchestratorBindings,
): readonly CapabilityKind[] {
  const providers = createProviderRegistry(bindings);
  const direct = new Set<CapabilityKind>();
  const embeddingModels: ModelDescriptor[] = [];

  for (const provider of providers.list()) {
    const models = provider.listModels();

    if (models instanceof Promise) {
      continue;
    }

    for (const model of models) {
      for (const capability of model.capabilities) {
        direct.add(capability);
      }

      if (model.capabilities.includes('embedding')) {
        embeddingModels.push(model);
      }
    }
  }

  if (!bindings.AI_ARTIFACTS) {
    direct.delete('image');
    direct.delete('audio');
  }

  if (embeddingModels.length > 0 && vectorStoreStatus(bindings).configured) {
    direct.add('retrieval');

    if (
      embeddingModels.some(
        (model) =>
          Number.isInteger(model.embeddingDimensions) &&
          (model.embeddingDimensions ?? 0) > 0,
      )
    ) {
      direct.add('knowledge-ingest');
    }
  }

  return capabilityKinds.filter((capability) => direct.has(capability));
}

export async function executeOrchestrationRequest(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
): Promise<OrchestrationOutput> {
  switch (request.capability) {
    case 'knowledge-ingest':
      return executeKnowledgeIngestion(bindings, request);
    case 'retrieval':
      return executeRetrieval(bindings, request);
    default: {
      const providers = createProviderRegistry(bindings);
      const executor = new OrchestrationExecutor(
        providers,
        new CapabilityRoutingPolicy(),
      );
      const output = await executor.execute(request);

      if (
        request.capability === 'image' ||
        request.capability === 'audio' ||
        request.capability === 'video' ||
        request.capability === 'music'
      ) {
        return materializeGeneratedBinary(bindings, request, output);
      }

      return output;
    }
  }
}

async function materializeGeneratedBinary(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
  output: OrchestrationOutput,
): Promise<OrchestrationOutput> {
  const tenantId = requireTenantId(request);
  const generated = output.content as GeneratedBinary;

  if (
    !generated ||
    !['image', 'audio', 'video', 'music'].includes(generated.kind) ||
    typeof generated.contentType !== 'string' ||
    (!('data' in generated) && !('url' in generated))
  ) {
    throw new Error('The media provider returned an invalid binary result.');
  }

  const artifacts = createArtifactStore(bindings);
  if (!artifacts) {
    throw new ArtifactStoreUnavailableError();
  }

  const body = await resolveGeneratedMediaBody(generated);

  const reference = await artifacts.put(`user:${tenantId}`, {
    kind: generated.kind,
    contentType: generated.contentType,
    body,
    metadata: {
      providerId: output.providerId,
      modelId: output.modelId,
      capability: request.capability,
    },
  });

  const content: MediaGenerationOutput = {
    artifacts: [reference],
  };

  return {
    ...output,
    content,
    artifacts: [reference.id],
  };
}

async function resolveGeneratedMediaBody(
  generated: GeneratedBinary,
): Promise<ArrayBuffer | ReadableStream<Uint8Array>> {
  if ('data' in generated && generated.data) {
    return generated.data;
  }

  if (!('url' in generated) || !generated.url) {
    throw new Error('The media provider returned no artifact body.');
  }

  const source = new URL(generated.url);
  if (source.protocol !== 'https:') {
    throw new Error('Generated media URLs must use HTTPS.');
  }

  const response = await fetch(source, {
    redirect: 'follow',
    cf: {
      cacheTtl: 0,
      cacheEverything: false,
    },
  });

  if (!response.ok || !response.body) {
    throw new Error(
      `Failed to download generated media (HTTP ${response.status}).`,
    );
  }

  const contentLength = response.headers.get('content-length');
  if (
    contentLength &&
    Number.parseInt(contentLength, 10) > 512 * 1024 * 1024
  ) {
    throw new Error('Generated media exceeds the 512 MiB artifact limit.');
  }

  return response.body;
}

async function executeKnowledgeIngestion(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
): Promise<OrchestrationOutput> {
  const tenantId = requireTenantId(request);
  const vectorStore = await createVectorStore(bindings);

  if (!vectorStore) {
    throw new VectorStoreUnavailableError();
  }

  const input = request.input as KnowledgeIngestionInput;
  const namespace = createTenantKnowledgeNamespace(
    tenantId,
    input.namespace,
  );
  const { provider, model } = await selectEmbeddingTarget(
    bindings,
    request,
    true,
  );
  const dimensions = model.embeddingDimensions;

  if (!dimensions) {
    throw new EmbeddingDimensionsRequiredError(model.id);
  }

  const embeddings = new ProviderEmbeddingGenerator(
    provider,
    model,
    dimensions,
  );
  const chunker = new FixedWindowTextChunker({
    ...(input.chunking?.maxCharacters === undefined
      ? {}
      : { maxCharacters: input.chunking.maxCharacters }),
    ...(input.chunking?.overlapCharacters === undefined
      ? {}
      : { overlapCharacters: input.chunking.overlapCharacters }),
  });
  const service = new KnowledgeIngestionService(
    chunker,
    embeddings,
    vectorStore,
    vectorStore,
  );

  const result = await service.ingest({
    namespace,
    documents: input.documents,
  });

  const content: KnowledgeIngestionOutput = {
    namespace: input.namespace,
    documentsProcessed: result.documentsProcessed,
    chunksWritten: result.chunksWritten,
    embeddingModelId: result.embeddingModelId,
  };

  return {
    content,
    providerId: provider.id,
    modelId: model.id,
  };
}

async function executeRetrieval(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
): Promise<OrchestrationOutput> {
  const tenantId = requireTenantId(request);
  const vectorStore = await createVectorStore(bindings);

  if (!vectorStore) {
    throw new VectorStoreUnavailableError();
  }

  const input = request.input as RetrievalInput;
  const namespace = createTenantKnowledgeNamespace(
    tenantId,
    input.namespace,
  );
  const { provider, model } = await selectEmbeddingTarget(
    bindings,
    request,
  );

  const embeddingResult = await provider.execute(
    {
      ...request,
      capability: 'embedding',
      input: {
        texts: [input.query],
      },
      preferences: embeddingPreferences(request),
    },
    model,
  );
  const embeddingOutput = embeddingResult.content as EmbeddingOutput;
  const vector = embeddingOutput.vectors[0];

  if (!vector || vector.length === 0) {
    throw new Error('Embedding provider returned no retrieval query vector.');
  }

  const requestedLimit = input.limit ?? 10;
  const candidateLimit = input.rerank
    ? Math.min(Math.max(requestedLimit * 3, requestedLimit), 100)
    : requestedLimit;

  const vectorMatches = await vectorStore.search({
    namespace,
    vector,
    limit: candidateLimit,
    ...(input.filter === undefined ? {} : { filter: input.filter }),
  });

  const matches = input.rerank
    ? await rerankMatches(bindings, request, input.query, vectorMatches, requestedLimit)
    : vectorMatches.slice(0, requestedLimit);

  const content: RetrievalOutput = {
    matches,
  };

  return {
    content,
    providerId: embeddingResult.providerId,
    modelId: embeddingResult.modelId,
    ...(embeddingResult.usage ? { usage: embeddingResult.usage } : {}),
  };
}

async function rerankMatches(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
  query: string,
  matches: readonly RetrievalMatch[],
  limit: number,
): Promise<readonly RetrievalMatch[]> {
  const documents = matches
    .filter((match): match is RetrievalMatch & { text: string } =>
      typeof match.text === 'string' && match.text.length > 0,
    )
    .map((match) => ({
      id: match.id,
      text: match.text,
    }));

  if (documents.length === 0) {
    return matches.slice(0, limit);
  }

  const providers = createProviderRegistry(bindings);
  const routing = new CapabilityRoutingPolicy();
  const rerankModels = await providers.modelsFor('rerank');
  const rerankRequest: OrchestrationRequest = {
    ...request,
    capability: 'rerank',
    input: {
      query,
      documents,
      limit,
    },
  };
  const route = routing.select(rerankRequest, rerankModels);
  const provider = providers.get(route.providerId);

  if (!provider) {
    return matches.slice(0, limit);
  }

  const models = await provider.listModels();
  const model = models.find((candidate) => candidate.id === route.modelId);

  if (!model) {
    return matches.slice(0, limit);
  }

  const reranked = await provider.execute(rerankRequest, model);
  const output = reranked.content as RerankOutput;
  const byId = new Map(matches.map((match) => [match.id, match]));

  return output.results
    .map((result) => {
      const match = byId.get(result.id);
      return match
        ? {
            ...match,
            score: result.score,
          }
        : undefined;
    })
    .filter((match): match is RetrievalMatch => Boolean(match))
    .slice(0, limit);
}

async function selectEmbeddingTarget(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
  requireDimensions = false,
): Promise<{
  provider: ModelProvider;
  model: ModelDescriptor;
}> {
  const providers = createProviderRegistry(bindings);
  const routing = new CapabilityRoutingPolicy();
  const availableEmbeddingModels = await providers.modelsFor('embedding');
  const embeddingModels = requireDimensions
    ? availableEmbeddingModels.filter(
        (model) =>
          Number.isInteger(model.embeddingDimensions) &&
          (model.embeddingDimensions ?? 0) > 0,
      )
    : availableEmbeddingModels;
  const embeddingRequest: OrchestrationRequest = {
    ...request,
    capability: 'embedding',
    input: { texts: ['routing-probe'] },
    preferences: embeddingPreferences(request),
  };
  const route = routing.select(embeddingRequest, embeddingModels);
  const provider = providers.get(route.providerId);

  if (!provider) {
    throw new Error(
      `Embedding provider "${route.providerId}" is not registered.`,
    );
  }

  const models = await provider.listModels();
  const model = models.find((candidate) => candidate.id === route.modelId);

  if (!model) {
    throw new Error(
      `Embedding model "${route.modelId}" is not available.`,
    );
  }

  return { provider, model };
}

function embeddingPreferences(
  request: OrchestrationRequest,
): OrchestrationRequest['preferences'] {
  const provider = request.preferences?.provider;
  const allowFallback = request.preferences?.allowFallback;

  if (provider === undefined && allowFallback === undefined) {
    return undefined;
  }

  return {
    ...(provider === undefined ? {} : { provider }),
    ...(allowFallback === undefined ? {} : { allowFallback }),
  };
}

function requireTenantId(request: OrchestrationRequest): string {
  if (!request.tenantId) {
    throw new TenantContextRequiredError();
  }

  return request.tenantId;
}

function createTenantKnowledgeNamespace(
  tenantId: string,
  namespace: string,
): string {
  return `user:${tenantId}:knowledge:${namespace.trim()}`;
}
