import type { OrchestrationOutput, OrchestrationRequest } from './contracts';
import { InMemoryProviderRegistry } from './provider-registry';
import type { ModelDescriptor, ModelProvider } from './providers';

class TestProvider implements ModelProvider {
  readonly id = 'test-provider';

  listModels(): readonly ModelDescriptor[] {
    return [
      {
        id: 'text-model',
        providerId: this.id,
        capabilities: ['text'],
      },
      {
        id: 'image-model',
        providerId: this.id,
        capabilities: ['image'],
      },
    ];
  }

  async execute(
    _request: OrchestrationRequest,
    model: ModelDescriptor,
  ): Promise<OrchestrationOutput> {
    return {
      content: 'ok',
      providerId: this.id,
      modelId: model.id,
    };
  }
}

describe('InMemoryProviderRegistry', () => {
  it('returns only models that support the requested capability', async () => {
    const registry = new InMemoryProviderRegistry();
    registry.register(new TestProvider());

    const models = await registry.modelsFor('text');

    expect(models).toHaveLength(1);
    expect(models[0]?.id).toBe('text-model');
  });

  it('rejects duplicate provider ids', () => {
    const registry = new InMemoryProviderRegistry();
    registry.register(new TestProvider());

    expect(() => registry.register(new TestProvider())).toThrow(
      'already registered',
    );
  });
});
