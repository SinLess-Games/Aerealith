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
  type ModelDescriptor,
  type ModelProvider,
  type OrchestrationOutput,
  type OrchestrationRequest,
  type RetrievalInput,
  type RetrievalOutput,
} from '@aerealith-ai/ai-orchestration';

import type { AiOrchestratorBindings } from './bindings';
import { createProviderRegistry } from './provider-runtime';
import { createVectorStore } from './vector-store';

export class VectorStoreUnavailableError extends Error {
  constructor() {
    super('The vector store is not configured.');
    this.name = 'VectorStoreUnavailableError';
  }
}

export class TenantContextRequiredError extends Error {
  constructor() {
    super('A trusted tenant context is required for knowledge operations.');
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
      // Runtime catalogs currently use synchronous model lists. Async provider
      // discovery is intentionally excluded from readiness evaluation.
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

  if (embeddingModels.length > 0 && createVectorStore(bindings)) {
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

      return executor.execute(request);
    }
  }
}

async function executeKnowledgeIngestion(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
): Promise<OrchestrationOutput> {
  const tenantId = requireTenantId(request);
  const vectorStore = createVectorStore(bindings);

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
  const vectorStore = createVectorStore(bindings);

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

  const matches = await vectorStore.search({
    namespace,
    vector,
    ...(input.limit === undefined ? {} : { limit: input.limit }),
    ...(input.filter === undefined ? {} : { filter: input.filter }),
  });

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
