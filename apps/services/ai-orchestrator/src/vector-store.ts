import { QdrantVectorStore } from '@aerealith-ai/ai-qdrant';

import type { AiOrchestratorBindings } from './bindings';

const DEFAULT_COLLECTION = 'aerealith-knowledge';

export type VectorStoreRuntimeStatus = {
  provider: 'qdrant';
  configured: boolean;
  endpointConfigured: boolean;
  credentialsConfigured: boolean;
  collection: string;
};

export function createVectorStore(bindings: AiOrchestratorBindings) {
  const baseUrl = bindings.QDRANT_URL?.trim();
  const apiKey = bindings.QDRANT_API_KEY?.trim();

  if (!baseUrl || !apiKey) {
    return undefined;
  }

  return new QdrantVectorStore({
    baseUrl,
    apiKey,
    collectionName: resolveCollection(bindings),
  });
}

export function vectorStoreStatus(
  bindings: AiOrchestratorBindings,
): VectorStoreRuntimeStatus {
  const endpointConfigured = Boolean(bindings.QDRANT_URL?.trim());
  const credentialsConfigured = Boolean(bindings.QDRANT_API_KEY?.trim());

  return {
    provider: 'qdrant',
    configured: endpointConfigured && credentialsConfigured,
    endpointConfigured,
    credentialsConfigured,
    collection: resolveCollection(bindings),
  };
}

function resolveCollection(bindings: AiOrchestratorBindings): string {
  return bindings.QDRANT_COLLECTION?.trim() || DEFAULT_COLLECTION;
}
