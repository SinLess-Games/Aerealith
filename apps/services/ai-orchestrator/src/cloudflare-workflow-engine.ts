import type {
  OrchestrationRequest,
  RunRecord,
  RunStore,
} from '@aerealith-ai/ai-orchestration';

import type { WorkflowBinding, WorkflowRunParams } from './bindings';
import type {
  OrchestrationEngine,
  OrchestrationSubmissionOptions,
} from './orchestrator';

type AtomicRunStore = RunStore & {
  createIfAbsent(
    run: RunRecord,
  ): Promise<{ run: RunRecord; created: boolean }>;
};

export class CloudflareWorkflowOrchestrationEngine
  implements OrchestrationEngine
{
  constructor(
    private readonly workflow: WorkflowBinding<WorkflowRunParams>,
    private readonly runs?: AtomicRunStore,
  ) {}

  async submit(
    request: OrchestrationRequest,
    options: OrchestrationSubmissionOptions = {},
  ): Promise<RunRecord> {
    const runId = options.runId ?? crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const run: RunRecord = {
      id: runId,
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

    const claim = this.runs
      ? await this.runs.createIfAbsent(run)
      : { run, created: true };

    if (!claim.created) {
      return claim.run;
    }

    try {
      await this.workflow.create({
        id: runId,
        params: {
          runId,
          request,
        },
      });
    } catch (error) {
      await this.runs?.updateStatus(runId, 'failed', {
        errorCode: 'WORKFLOW_DISPATCH_FAILED',
        updatedAt: new Date().toISOString(),
      });

      throw error;
    }

    return claim.run;
  }
}
