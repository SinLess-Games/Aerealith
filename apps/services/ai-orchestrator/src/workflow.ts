import type {
  OrchestrationRequest,
  RunRecord,
} from '@aerealith-ai/ai-orchestration';
import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from 'cloudflare:workers';

import type {
  AiOrchestratorBindings,
  WorkflowRunParams,
} from './bindings';

export class AiOrchestrationWorkflow extends WorkflowEntrypoint<
  AiOrchestratorBindings,
  WorkflowRunParams
> {
  async run(
    event: WorkflowEvent<WorkflowRunParams>,
    step: WorkflowStep,
  ): Promise<RunRecord> {
    const initialized = await step.do('initialize run', async () => {
      const timestamp = new Date().toISOString();

      return {
        id: event.payload.runId,
        status: 'planning' as const,
        capability: event.payload.request.capability,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    });

    return step.do('prepare execution', async () =>
      this.prepareExecution(initialized, event.payload.request),
    );
  }

  private prepareExecution(
    run: RunRecord,
    request: OrchestrationRequest,
  ): RunRecord {
    return {
      ...run,
      capability: request.capability,
      status: 'queued',
      updatedAt: new Date().toISOString(),
    };
  }
}
