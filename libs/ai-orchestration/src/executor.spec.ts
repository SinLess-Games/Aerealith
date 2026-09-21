import type {
  OrchestrationOutput,
  OrchestrationRequest,
} from './contracts';
import { OrchestrationExecutor } from './executor';
import { InMemoryProviderRegistry } from './provider-registry';
import type { ModelDescriptor, ModelProvider } from './providers';
import { CapabilityRoutingPolicy } from './routing';

class TestProvider implements ModelProvider {
  readonly id = 'test';

  listModels(): readonly ModelDescriptor[] {
    return [
      {
        id: 'reasoning',
        providerId: this.id,
        capabilities: ['text', 'code'],
        priority: 100,
      },
    ];
  }

  async execute(
    request: OrchestrationRequest,
    model: ModelDescriptor,
  ): Promise<OrchestrationOutput> {
    return {
      content: request.input,
      providerId: this.id,
      modelId: model.id,
      usage: {
        inputUnits: 10,
        outputUnits: 5,
        totalUnits: 15,
        estimatedCostUsd: 0.001,
      },
    };
  }
}

describe('OrchestrationExecutor', () => {
  it('routes and executes through the selected provider', async () => {
    const providers = new InMemoryProviderRegistry();
    providers.register(new TestProvider());

    const executor = new OrchestrationExecutor(
      providers,
      new CapabilityRoutingPolicy(),
    );

    const result = await executor.execute({
      capability: 'code',
      input: 'return 42',
    });

    expect(result.providerId).toBe('test');
    expect(result.modelId).toBe('reasoning');
    expect(result.content).toBe('return 42');
    expect(result.usage?.totalUnits).toBe(15);
  });
});
