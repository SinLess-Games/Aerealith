import type {
  OrchestrationOutput,
  OrchestrationRequest,
} from './contracts';
import type { ProviderRegistry } from './providers';
import type { RoutingPolicy } from './routing';

export class ProviderExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderExecutionError';
  }
}

export class OrchestrationExecutor {
  constructor(
    private readonly providers: ProviderRegistry,
    private readonly routing: RoutingPolicy,
  ) {}

  async execute(request: OrchestrationRequest): Promise<OrchestrationOutput> {
    const candidates = await this.providers.modelsFor(request.capability);
    const route = this.routing.select(request, candidates);
    const provider = this.providers.get(route.providerId);

    if (!provider) {
      throw new ProviderExecutionError(
        `Provider "${route.providerId}" is not registered.`,
      );
    }

    const models = await provider.listModels();
    const model = models.find((candidate) => candidate.id === route.modelId);

    if (!model) {
      throw new ProviderExecutionError(
        `Model "${route.modelId}" is not available from provider "${route.providerId}".`,
      );
    }

    return provider.execute(request, model);
  }
}
