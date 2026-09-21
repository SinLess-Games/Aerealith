import type {
  OrchestrationRequest,
  RunRecord,
} from '@aerealith-ai/ai-orchestration';

export interface OrchestrationEngine {
  submit(request: OrchestrationRequest): Promise<RunRecord>;
}

export class BasicOrchestrationEngine implements OrchestrationEngine {
  async submit(request: OrchestrationRequest): Promise<RunRecord> {
    const timestamp = new Date().toISOString();

    return {
      id: crypto.randomUUID(),
      status: 'accepted',
      capability: request.capability,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }
}
