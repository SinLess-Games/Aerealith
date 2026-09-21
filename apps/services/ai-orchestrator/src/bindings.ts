import type { OrchestrationRequest } from '@aerealith-ai/ai-orchestration';

export type WorkflowRunParams = {
  runId: string;
  request: OrchestrationRequest;
};

export interface WorkflowBinding<TParams> {
  create(options: { id?: string; params: TParams }): Promise<unknown>;
}

export type AiOrchestratorBindings = {
  ENVIRONMENT?: string;
  AI_ORCHESTRATION_WORKFLOW?: WorkflowBinding<WorkflowRunParams>;
};
