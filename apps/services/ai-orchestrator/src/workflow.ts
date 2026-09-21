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
import { executeOrchestrationRequest } from './execution-runtime';
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
      const existing = await runs?.get(event.payload.runId);

      if (existing) {
        await runs?.updateStatus(event.payload.runId, 'planning');
        return {
          ...existing,
          status: 'planning' as const,
          updatedAt: new Date().toISOString(),
        };
      }

      const timestamp = new Date().toISOString();
      const run: RunRecord = {
        id: event.payload.runId,
        ...(event.payload.request.tenantId
          ? { tenantId: event.payload.request.tenantId }
          : {}),
        ...(event.payload.request.actorId
          ? { actorId: event.payload.request.actorId }
          : {}),
        status: 'planning',
        capability: event.payload.request.capability,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await runs?.create(run);
      return run;
    });

    const queued = await step.do('queue execution', async () => {
      const next: RunRecord = {
        ...initialized,
        status: 'queued',
        updatedAt: new Date().toISOString(),
      };

      await runs?.updateStatus(event.payload.runId, 'queued');
      return next;
    });

    const startedAt = new Date().toISOString();
    await runs?.updateStatus(event.payload.runId, 'running', {
      startedAt,
    });

    try {
      const output = await step.do('execute request', async () =>
        executeOrchestrationRequest(this.env, event.payload.request),
      );

      const completedAt = new Date().toISOString();

      await runs?.updateStatus(event.payload.runId, 'succeeded', {
        providerId: output.providerId,
        modelId: output.modelId,
        output,
        completedAt,
      });

      return {
        ...queued,
        status: 'succeeded',
        startedAt,
        completedAt,
        providerId: output.providerId,
        modelId: output.modelId,
        output,
        updatedAt: completedAt,
      };
    } catch (error) {
      const completedAt = new Date().toISOString();

      await runs?.updateStatus(event.payload.runId, 'failed', {
        errorCode: classifyExecutionError(error),
        completedAt,
      });

      throw error;
    }
  }
}

function classifyExecutionError(error: unknown): string {
  if (error instanceof Error && error.name === 'NoRouteError') {
    return 'NO_MODEL_ROUTE';
  }

  if (error instanceof Error && error.name === 'ProviderExecutionError') {
    return 'PROVIDER_EXECUTION_FAILED';
  }

  if (error instanceof Error && error.name === 'VectorStoreUnavailableError') {
    return 'VECTOR_STORE_UNAVAILABLE';
  }

  if (error instanceof Error && error.name === 'RunOutputTooLargeError') {
    return 'RUN_OUTPUT_TOO_LARGE';
  }

  return 'ORCHESTRATION_EXECUTION_FAILED';
}
