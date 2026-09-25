import type { OrchestrationRequest } from './contracts';
import type { ProviderRegistry } from './providers';
import type { RoutingDecision, RoutingPolicy } from './routing';

export type OrchestrationPlan = {
  runId: string;
  capability: OrchestrationRequest['capability'];
  route: RoutingDecision;
  createdAt: string;
};

export class OrchestrationPlanner {
  constructor(
    private readonly providers: ProviderRegistry,
    private readonly routing: RoutingPolicy,
  ) {}

  async plan(request: OrchestrationRequest): Promise<OrchestrationPlan> {
    const candidates = await this.providers.modelsFor(request.capability);
    const route = this.routing.select(request, candidates);

    return {
      runId: crypto.randomUUID(),
      capability: request.capability,
      route,
      createdAt: new Date().toISOString(),
    };
  }
}
