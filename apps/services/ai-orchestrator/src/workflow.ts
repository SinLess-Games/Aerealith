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
import { createRunStore } from './run-store';

export class AiOrchestrationWorkflow extends WorkflowEntrypoint<
  AiOrchestratorBindings,
  WorkflowRunParams
> {
  async run(
    event: WorkflowEvent<WorkflowRunParams>,
    step: WorkflowStep,
  ): Promise<RunRecord> {
    const runs = createRunStore(this.env);

    const initialized = await step.do('initialize run', async () => {
      const timestamp = new Date().toISOString();
      const run: RunRecord = {
        id: event.payload.runId,
        status: 'planning',
        capability: event.payload.request.capability,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const existing = await runs?.get(event.payload.runId);
      if (!existing) {
        await runs?.create(run);
        return run;
      }

      await runs?.updateStatus(event.payload.runId, 'planning');
      return {
        ...existing,
        status: 'planning',
        updatedAt: new Date().toISOString(),
      };
    });

    return step.do('prepare execution', async () => {
      const prepared = this.prepareExecution(
        initialized,
        event.payload.request,
      );

      await runs?.updateStatus(event.payload.runId, 'queued');
      return prepared;
    });
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
