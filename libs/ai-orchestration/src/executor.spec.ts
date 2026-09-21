import type {
  OrchestrationOutput,
  OrchestrationRequest,
} from './contracts';
import {
  OrchestrationExecutor,
  ProviderExecutionError,
} from './executor';
import { InMemoryProviderRegistry } from './provider-registry';
import type { ModelDescriptor, ModelProvider } from './providers';
import { CapabilityRoutingPolicy } from './routing';

class TestProvider implements ModelProvider {
  constructor(
    readonly id: string,
    private readonly model: ModelDescriptor,
    private readonly fail = false,
  ) {}

  listModels(): readonly ModelDescriptor[] {
    return [this.model];
  }

  async execute(
    request: OrchestrationRequest,
    model: ModelDescriptor,
  ): Promise<OrchestrationOutput> {
    if (this.fail) {
      throw new Error(`${this.id} failed`);
    }

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

function createProvider(
  id: string,
  modelId: string,
  priority: number,
  fail = false,
) {
  return new TestProvider(
    id,
    {
      id: modelId,
      providerId: id,
      capabilities: ['text', 'code'],
      priority,
    },
    fail,
  );
}

describe('OrchestrationExecutor', () => {
  it('routes and executes through the selected provider', async () => {
    const providers = new InMemoryProviderRegistry();
    providers.register(createProvider('test', 'reasoning', 100));

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

  it('falls back to the next eligible route after a provider failure', async () => {
    const providers = new InMemoryProviderRegistry();
    providers.register(createProvider('primary', 'primary-model', 100, true));
    providers.register(createProvider('fallback', 'fallback-model', 50));

    const executor = new OrchestrationExecutor(
      providers,
      new CapabilityRoutingPolicy(),
    );

    const result = await executor.execute({
      capability: 'text',
      input: 'hello',
      preferences: { allowFallback: true },
    });

    expect(result.providerId).toBe('fallback');
    expect(result.modelId).toBe('fallback-model');
  });

  it('does not fall back when fallback is disabled', async () => {
    const providers = new InMemoryProviderRegistry();
    providers.register(createProvider('primary', 'primary-model', 100, true));
    providers.register(createProvider('fallback', 'fallback-model', 50));

    const executor = new OrchestrationExecutor(
      providers,
      new CapabilityRoutingPolicy(),
    );

    const execution = executor.execute({
      capability: 'text',
      input: 'hello',
      preferences: { allowFallback: false },
    });

    await expect(execution).rejects.toBeInstanceOf(ProviderExecutionError);
    await expect(execution).rejects.toMatchObject({
      attempts: [
        expect.objectContaining({
          providerId: 'primary',
          modelId: 'primary-model',
        }),
      ],
    });
  });
});
