import {
  capabilityKinds,
  CapabilityRoutingPolicy,
  OrchestrationExecutor,
  type CapabilityKind,
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

export class TenantContextRequiredError extends Error {
  constructor() {
    super('A trusted tenant context is required for knowledge retrieval.');
    this.name = 'TenantContextRequiredError';
  }
}

export function executableCapabilities(
  bindings: AiOrchestratorBindings,
): readonly CapabilityKind[] {
  const providers = createProviderRegistry(bindings);
  const direct = new Set<CapabilityKind>();

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
    }
  }

  if (direct.has('embedding') && createVectorStore(bindings)) {
    direct.add('retrieval');
  }

  return capabilityKinds.filter((capability) => direct.has(capability));
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

  if (!request.tenantId) {
    throw new TenantContextRequiredError();
  }

  const input = request.input as RetrievalInput;
  const namespace = createTenantKnowledgeNamespace(
    request.tenantId,
    input.namespace,
  );
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

function createTenantKnowledgeNamespace(
  tenantId: string,
  namespace: string,
): string {
  return `user:${tenantId}:knowledge:${namespace.trim()}`;
}
