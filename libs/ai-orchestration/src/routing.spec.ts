import type { OrchestrationRequest } from './contracts';
import type { ModelDescriptor } from './providers';
import { CapabilityRoutingPolicy, NoRouteError } from './routing';

const candidates: readonly ModelDescriptor[] = [
  {
    id: 'fast',
    providerId: 'provider-b',
    capabilities: ['text', 'code'],
    priority: 10,
  },
  {
    id: 'balanced',
    providerId: 'provider-a',
    capabilities: ['text'],
    priority: 20,
  },
];

describe('CapabilityRoutingPolicy', () => {
  const policy = new CapabilityRoutingPolicy();

  it('selects the highest-priority eligible model', () => {
    const request: OrchestrationRequest = {
      capability: 'text',
      input: 'hello',
    };

    expect(policy.select(request, candidates)).toMatchObject({
      providerId: 'provider-a',
      modelId: 'balanced',
    });
  });

  it('honors a strict provider preference', () => {
    const request: OrchestrationRequest = {
      capability: 'text',
      input: 'hello',
      preferences: {
        provider: 'provider-b',
        allowFallback: false,
      },
    };

    expect(policy.select(request, candidates)).toMatchObject({
      providerId: 'provider-b',
      modelId: 'fast',
    });
  });

  it('throws when a strict preference has no route', () => {
    const request: OrchestrationRequest = {
      capability: 'text',
      input: 'hello',
      preferences: {
        provider: 'missing',
        allowFallback: false,
      },
    };

    expect(() => policy.select(request, candidates)).toThrow(NoRouteError);
  });
});
