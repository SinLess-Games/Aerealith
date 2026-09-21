import type {
  OrchestrationRequest,
  RunRecord,
} from '@aerealith-ai/ai-orchestration';

export type OrchestrationSubmissionOptions = {
  runId?: string;
  requestFingerprint?: string;
};

export type OrchestrationSubmissionResult = {
  run: RunRecord;
  created: boolean;
};

export interface OrchestrationEngine {
  submit(
    request: OrchestrationRequest,
    options?: OrchestrationSubmissionOptions,
  ): Promise<OrchestrationSubmissionResult>;
}

export class BasicOrchestrationEngine implements OrchestrationEngine {
  async submit(
    request: OrchestrationRequest,
    options: OrchestrationSubmissionOptions = {},
  ): Promise<OrchestrationSubmissionResult> {
    const timestamp = new Date().toISOString();

    const run: RunRecord = {
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

    return { run, created: true };
  }
}
