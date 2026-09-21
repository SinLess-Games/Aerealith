import type {
  OrchestrationRequest,
  RunRecord,
} from '@aerealith-ai/ai-orchestration';

import type { WorkflowBinding, WorkflowRunParams } from './bindings';
import type { OrchestrationEngine } from './orchestrator';

export class CloudflareWorkflowOrchestrationEngine
  implements OrchestrationEngine
{
  constructor(
    private readonly workflow: WorkflowBinding<WorkflowRunParams>,
  ) {}

  async submit(request: OrchestrationRequest): Promise<RunRecord> {
    const runId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    await this.workflow.create({
      id: runId,
      params: {
        runId,
        request,
      },
    });

    return {
      id: runId,
      status: 'accepted',
      capability: request.capability,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }
}
