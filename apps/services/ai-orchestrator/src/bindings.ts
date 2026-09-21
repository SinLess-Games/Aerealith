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

  /**
   * Qdrant Cloud cluster endpoint. The URL itself is not a secret.
   */
  QDRANT_URL?: string;

  /**
   * Qdrant API key. Configure this as a Cloudflare secret.
   */
  QDRANT_API_KEY?: string;

  /**
   * Prefix applied to Qdrant collections created/used by Aerealith.
   */
  QDRANT_COLLECTION_PREFIX?: string;
};
