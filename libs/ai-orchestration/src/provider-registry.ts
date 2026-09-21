import type { CapabilityKind } from './capability';
import type {
  ModelDescriptor,
  ModelProvider,
  ProviderRegistry,
} from './providers';

export class InMemoryProviderRegistry implements ProviderRegistry {
  private readonly providers = new Map<string, ModelProvider>();

  register(provider: ModelProvider): void {
    if (this.providers.has(provider.id)) {
      throw new Error(`Provider "${provider.id}" is already registered.`);
    }

    this.providers.set(provider.id, provider);
  }

  get(providerId: string): ModelProvider | undefined {
    return this.providers.get(providerId);
  }

  list(): readonly ModelProvider[] {
    return [...this.providers.values()];
  }

  async modelsFor(
    capability: CapabilityKind,
  ): Promise<readonly ModelDescriptor[]> {
    const models = await Promise.all(
      this.list().map(async (provider) => provider.listModels()),
    );

    return models
      .flat()
      .filter((model) => model.capabilities.includes(capability));
  }
}
