import { QdrantVectorStore } from '@aerealith-ai/ai-qdrant';

import type {
  AiOrchestratorBindings,
  SecretStoreBinding,
} from './bindings';

const DEFAULT_COLLECTION = 'aerealith-knowledge-v1';

export type VectorStoreRuntimeStatus = {
  provider: 'qdrant';
  configured: boolean;
  endpointConfigured: boolean;
  credentialsConfigured: boolean;
  collection: string;
};

export async function createVectorStore(
  bindings: AiOrchestratorBindings,
): Promise<QdrantVectorStore | undefined> {
  const baseUrl = bindings.QDRANT_URL?.trim();
  const apiKey = await resolveSecret(bindings.QDRANT_API_KEY);

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
  const credentialsConfigured = Boolean(bindings.QDRANT_API_KEY);

  return {
    provider: 'qdrant',
    configured: endpointConfigured && credentialsConfigured,
    endpointConfigured,
    credentialsConfigured,
    collection: resolveCollection(bindings),
  };
}

async function resolveSecret(
  binding: SecretStoreBinding | string | undefined,
): Promise<string | undefined> {
  if (typeof binding === 'string') {
    return binding.trim() || undefined;
  }

  if (!binding) return undefined;

  const value = await binding.get();
  return value.trim() || undefined;
}

function resolveCollection(bindings: AiOrchestratorBindings): string {
  return bindings.QDRANT_COLLECTION?.trim() || DEFAULT_COLLECTION;
}
