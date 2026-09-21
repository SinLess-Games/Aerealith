import type { OrchestrationRequest, OrchestrationResult } from './domain';

export interface OrchestrationEngine {
  submit(request: OrchestrationRequest): Promise<OrchestrationResult>;
}

export class BasicOrchestrationEngine implements OrchestrationEngine {
  async submit(request: OrchestrationRequest): Promise<OrchestrationResult> {
    return {
      runId: crypto.randomUUID(),
      status: 'accepted',
      capability: request.capability,
      createdAt: new Date().toISOString(),
    };
  }
}
