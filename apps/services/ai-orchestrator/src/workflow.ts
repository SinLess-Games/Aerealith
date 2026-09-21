import type {
  OrchestrationRequest,
  RunRecord,
} from '@aerealith-ai/ai-orchestration';
import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from 'cloudflare:workers';

import {
  recordAiRunFailed,
  recordAiRunStarted,
  recordAiRunSucceeded,
} from './ai-telemetry';
import { externalizeLargeOutput } from './artifact-runtime';
import { ConversationStore } from './conversation-runtime';
import type {
  AiOrchestratorBindings,
  WorkflowRunParams,
} from './bindings';
import { executeOrchestrationRequest } from './execution-runtime';
import { createRunStore } from './run-store';
import { AiUsageStore } from './usage-ledger';

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
    const startedAtMs = Date.now();
    await runs?.updateStatus(event.payload.runId, 'running', {
      startedAt,
    });
    recordAiRunStarted({
      runId: event.payload.runId,
      capability: event.payload.request.capability,
    });

    try {
      const output = await step.do('execute request', async () => {
        const result = await executeOrchestrationRequest(
          this.env,
          event.payload.request,
          { runId: event.payload.runId },
        );

        return externalizeLargeOutput(
          this.env,
          event.payload.request.tenantId,
          result,
        );
      });

      const completedAt = new Date().toISOString();

      await runs?.updateStatus(event.payload.runId, 'succeeded', {
        providerId: output.providerId,
        modelId: output.modelId,
        output,
        completedAt,
      });

      if (this.env.AI_USAGE && event.payload.request.tenantId) {
        await new AiUsageStore(this.env.AI_USAGE).recordUsage(
          event.payload.request.tenantId,
          output.usage,
        );
      }

      await persistConversationAssistantMessage(
        this.env,
        event.payload.request,
        event.payload.runId,
        output,
      );

      recordAiRunSucceeded({
        runId: event.payload.runId,
        capability: event.payload.request.capability,
        durationMs: Date.now() - startedAtMs,
        output,
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

      const errorCode = classifyExecutionError(error);
      await runs?.updateStatus(event.payload.runId, 'failed', {
        errorCode,
        completedAt,
      });

      recordAiRunFailed({
        runId: event.payload.runId,
        capability: event.payload.request.capability,
        durationMs: Date.now() - startedAtMs,
        errorCode,
      });

      throw error;
    }
  }
}

async function persistConversationAssistantMessage(
  bindings: AiOrchestratorBindings,
  request: OrchestrationRequest,
  runId: string,
  output: import('@aerealith-ai/ai-orchestration').OrchestrationOutput,
): Promise<void> {
  if (
    request.capability !== 'text' ||
    !request.tenantId ||
    !request.metadata?.conversationId ||
    !bindings.AI_CONVERSATION_STATE ||
    !bindings.AI_CONVERSATION_INDEX
  ) {
    return;
  }

  const content = output.content as { text?: unknown };
  if (typeof content.text !== 'string' || !content.text) return;

  await new ConversationStore(
    bindings.AI_CONVERSATION_STATE,
    bindings.AI_CONVERSATION_INDEX,
  ).append(
    request.tenantId,
    request.metadata.conversationId,
    {
      role: 'assistant',
      content: content.text,
      runId,
      id: `assistant:${runId}`,
    },
  );
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
