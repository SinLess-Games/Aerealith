import type {
  OrchestrationOutput,
  OrchestrationRequest,
} from './contracts';
import type {
  ModelDescriptor,
  ModelProvider,
  ProviderRegistry,
} from './providers';
import type { RoutingDecision, RoutingPolicy } from './routing';

export type ProviderAttemptFailure = {
  providerId: string;
  modelId: string;
  error: unknown;
};

export class ProviderExecutionError extends Error {
  readonly attempts: readonly ProviderAttemptFailure[];

  constructor(
    message: string,
    attempts: readonly ProviderAttemptFailure[] = [],
  ) {
    super(message);
    this.name = 'ProviderExecutionError';
    this.attempts = attempts;
  }
}

export class OrchestrationExecutor {
  constructor(
    private readonly providers: ProviderRegistry,
    private readonly routing: RoutingPolicy,
  ) {}

  async execute(request: OrchestrationRequest): Promise<OrchestrationOutput> {
    const candidates = await this.providers.modelsFor(request.capability);
    const rankedRoutes = this.routing.rank(request, candidates);
    const routes =
      request.preferences?.allowFallback === false
        ? rankedRoutes.slice(0, 1)
        : rankedRoutes;
    const failures: ProviderAttemptFailure[] = [];

    for (const route of routes) {
      const target = await this.resolveTarget(route);

      try {
        return await target.provider.execute(request, target.model);
      } catch (error) {
        failures.push({
          providerId: route.providerId,
          modelId: route.modelId,
          error,
        });
      }
    }

    throw new ProviderExecutionError(
      `All ${routes.length} eligible model route(s) failed.`,
      failures,
    );
  }

  private async resolveTarget(route: RoutingDecision): Promise<{
    provider: ModelProvider;
    model: ModelDescriptor;
  }> {
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

    return { provider, model };
  }
}
