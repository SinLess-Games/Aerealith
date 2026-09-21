import type {
  ArtifactStore,
  OrchestrationOutput,
} from '@aerealith-ai/ai-orchestration';

import type { AiOrchestratorBindings } from './bindings';
import { R2ArtifactStore } from './r2-artifact-store';

const INLINE_OUTPUT_LIMIT_BYTES = 512 * 1024;

export function createArtifactStore(
  bindings: AiOrchestratorBindings,
): ArtifactStore | undefined {
  return bindings.AI_ARTIFACTS
    ? new R2ArtifactStore(bindings.AI_ARTIFACTS)
    : undefined;
}

export function artifactStoreStatus(bindings: AiOrchestratorBindings) {
  return {
    provider: 'r2' as const,
    configured: Boolean(bindings.AI_ARTIFACTS),
  };
}

export async function externalizeLargeOutput(
  bindings: AiOrchestratorBindings,
  tenantId: string | undefined,
  output: OrchestrationOutput,
): Promise<OrchestrationOutput> {
  const serialized = JSON.stringify(output);
  const bytes = new TextEncoder().encode(serialized);

  if (bytes.byteLength <= INLINE_OUTPUT_LIMIT_BYTES) {
    return output;
  }

  if (!tenantId) {
    throw new Error(
      'Trusted tenant context is required to externalize AI output.',
    );
  }

  const artifacts = createArtifactStore(bindings);
  if (!artifacts) {
    return output;
  }

  const reference = await artifacts.put(
    `user:${tenantId}`,
    {
      kind: 'file',
      contentType: 'application/json',
      body: bytes.buffer,
      metadata: {
        purpose: 'run-output',
        providerId: output.providerId,
        modelId: output.modelId,
      },
    },
  );

  return {
    providerId: output.providerId,
    modelId: output.modelId,
    ...(output.usage ? { usage: output.usage } : {}),
    content: {
      externalized: true,
      artifactId: reference.id,
      contentType: reference.contentType,
      sizeBytes: reference.sizeBytes,
    },
    artifacts: [
      ...(output.artifacts ?? []),
      reference.id,
    ],
  };
}
