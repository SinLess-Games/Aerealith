import type {
  OrchestrationRequest,
  RunRecord,
} from '@aerealith-ai/ai-orchestration';

export type OrchestrationSubmissionOptions = {
  runId?: string;
  requestFingerprint?: string;
};

export interface OrchestrationEngine {
  submit(
    request: OrchestrationRequest,
    options?: OrchestrationSubmissionOptions,
  ): Promise<RunRecord>;
}

export class BasicOrchestrationEngine implements OrchestrationEngine {
  async submit(
    request: OrchestrationRequest,
    options: OrchestrationSubmissionOptions = {},
  ): Promise<RunRecord> {
    const timestamp = new Date().toISOString();

    return {
      id: options.runId ?? crypto.randomUUID(),
      ...(request.tenantId ? { tenantId: request.tenantId } : {}),
      ...(request.actorId ? { actorId: request.actorId } : {}),
      ...(options.requestFingerprint
        ? { requestFingerprint: options.requestFingerprint }
        : {}),
      status: 'accepted',
      capability: request.capability,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }
}
