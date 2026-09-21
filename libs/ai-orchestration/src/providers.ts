import type { CapabilityKind } from './capability';
import type { OrchestrationOutput, OrchestrationRequest } from './contracts';

export type ModelDescriptor = {
  id: string;
  providerId: string;
  capabilities: readonly CapabilityKind[];
  priority?: number;
  supportsStreaming?: boolean;
  contextWindow?: number;
  embeddingDimensions?: number;
  inputCostPerMillionUnitsUsd?: number;
  outputCostPerMillionUnitsUsd?: number;
};

export interface ModelProvider {
  readonly id: string;
  listModels(): readonly ModelDescriptor[] | Promise<readonly ModelDescriptor[]>;
  execute(
    request: OrchestrationRequest,
    model: ModelDescriptor,
  ): Promise<OrchestrationOutput>;
}

export interface ProviderRegistry {
  register(provider: ModelProvider): void;
  get(providerId: string): ModelProvider | undefined;
  list(): readonly ModelProvider[];
  modelsFor(capability: CapabilityKind): Promise<readonly ModelDescriptor[]>;
}
