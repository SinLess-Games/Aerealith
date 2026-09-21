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
  select(
    request: OrchestrationRequest,
    candidates: readonly ModelDescriptor[],
  ): RoutingDecision;
}

export class CapabilityRoutingPolicy implements RoutingPolicy {
  select(
    request: OrchestrationRequest,
    candidates: readonly ModelDescriptor[],
  ): RoutingDecision {
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

    const selected = [...eligible].sort((left, right) => {
      const priorityDelta = (right.priority ?? 0) - (left.priority ?? 0);
      if (priorityDelta !== 0) return priorityDelta;

      return `${left.providerId}/${left.id}`.localeCompare(
        `${right.providerId}/${right.id}`,
      );
    })[0];

    if (!selected) throw new NoRouteError();

    return {
      providerId: selected.providerId,
      modelId: selected.id,
      reason:
        preferences?.provider || preferences?.model
          ? 'matched request preferences'
          : 'highest-priority eligible model',
    };
  }
}
