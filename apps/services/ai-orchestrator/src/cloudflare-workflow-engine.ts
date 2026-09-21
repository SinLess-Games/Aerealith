import type {
  OrchestrationRequest,
  RunRecord,
  RunStore,
} from '@aerealith-ai/ai-orchestration';

import type { WorkflowBinding, WorkflowRunParams } from './bindings';
import type { OrchestrationEngine } from './orchestrator';

export class CloudflareWorkflowOrchestrationEngine
  implements OrchestrationEngine
{
  constructor(
    private readonly workflow: WorkflowBinding<WorkflowRunParams>,
    private readonly runs?: RunStore,
  ) {}

  async submit(request: OrchestrationRequest): Promise<RunRecord> {
    const runId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const run: RunRecord = {
      id: runId,
      ...(request.tenantId ? { tenantId: request.tenantId } : {}),
      ...(request.actorId ? { actorId: request.actorId } : {}),
      status: 'accepted',
      capability: request.capability,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.runs?.create(run);

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

    return run;
  }
}
