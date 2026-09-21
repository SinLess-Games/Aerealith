import {
  CapabilityRoutingPolicy,
  OrchestrationExecutor,
  type EmbeddingOutput,
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

export async function executeOrchestrationRequest(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
): Promise<OrchestrationOutput> {
  if (request.capability === 'retrieval') {
    return executeRetrieval(bindings, request);
  }

  const providers = createProviderRegistry(bindings);
  const executor = new OrchestrationExecutor(
    providers,
    new CapabilityRoutingPolicy(),
  );

  return executor.execute(request);
}

async function executeRetrieval(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
): Promise<OrchestrationOutput> {
  const vectorStore = createVectorStore(bindings);
  if (!vectorStore) {
    throw new VectorStoreUnavailableError();
  }

  const input = request.input as RetrievalInput;
  const providers = createProviderRegistry(bindings);
  const routing = new CapabilityRoutingPolicy();
  const embeddingModels = await providers.modelsFor('embedding');
  const embeddingRequest: OrchestrationRequest = {
    ...request,
    capability: 'embedding',
    input: {
      texts: [input.query],
    },
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

  const embeddingResult = await provider.execute(
    embeddingRequest,
    model,
  );
  const embeddingOutput = embeddingResult.content as EmbeddingOutput;
  const vector = embeddingOutput.vectors[0];

  if (!vector || vector.length === 0) {
    throw new Error('Embedding provider returned no retrieval query vector.');
  }

  const matches = await vectorStore.search({
    namespace: input.namespace,
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
