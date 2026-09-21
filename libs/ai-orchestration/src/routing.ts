import type { OrchestrationRequest } from './contracts';
import type { ModelDescriptor } from './providers';

export type RoutingDecision = {
  providerId: string;
  modelId: string;
  reason: string;
};

export class NoRouteError extends Error {
  constructor(message = 'No eligible model route is available.') {
    super(message);
    this.name = 'NoRouteError';
  }
}

export interface RoutingPolicy {
  rank(
    request: OrchestrationRequest,
    candidates: readonly ModelDescriptor[],
  ): readonly RoutingDecision[];

  select(
    request: OrchestrationRequest,
    candidates: readonly ModelDescriptor[],
  ): RoutingDecision;
}

export class CapabilityRoutingPolicy implements RoutingPolicy {
  rank(
    request: OrchestrationRequest,
    candidates: readonly ModelDescriptor[],
  ): readonly RoutingDecision[] {
    const preferences = request.preferences;
    let eligible = candidates.filter((candidate) =>
      candidate.capabilities.includes(request.capability),
    );

    if (preferences?.provider) {
      const providerMatches = eligible.filter(
        (candidate) => candidate.providerId === preferences.provider,
      );

      if (providerMatches.length > 0 || preferences.allowFallback === false) {
        eligible = providerMatches;
      }
    }

    if (preferences?.model) {
      const modelMatches = eligible.filter(
        (candidate) => candidate.id === preferences.model,
      );

      if (modelMatches.length > 0 || preferences.allowFallback === false) {
        eligible = modelMatches;
      }
    }

    if (eligible.length === 0) {
      throw new NoRouteError();
    }

    return [...eligible]
      .sort((left, right) => {
        const priorityDelta = (right.priority ?? 0) - (left.priority ?? 0);
        if (priorityDelta !== 0) return priorityDelta;

        return `${left.providerId}/${left.id}`.localeCompare(
          `${right.providerId}/${right.id}`,
        );
      })
      .map((candidate, index) => ({
        providerId: candidate.providerId,
        modelId: candidate.id,
        reason:
          index === 0
            ? preferences?.provider || preferences?.model
              ? 'matched request preferences'
              : 'highest-priority eligible model'
            : 'fallback eligible model',
      }));
  }

  select(
    request: OrchestrationRequest,
    candidates: readonly ModelDescriptor[],
  ): RoutingDecision {
    const selected = this.rank(request, candidates)[0];
    if (!selected) throw new NoRouteError();
    return selected;
  }
}
