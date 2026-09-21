import type {
  OrchestrationRequest,
  RunRecord,
  RunStatus,
} from '@aerealith-ai/ai-orchestration';

export type WorkflowRunParams = {
  runId: string;
  request: OrchestrationRequest;
};

export interface WorkerFetcher {
  fetch(request: Request): Promise<Response>;
}

export interface WorkflowInstance {
  status(): Promise<unknown>;
  terminate(): Promise<void>;
}

export interface WorkflowBinding<TParams> {
  create(options: { id?: string; params: TParams }): Promise<unknown>;
  get?(id: string): Promise<WorkflowInstance>;
}

export interface RunStateStub {
  createRun(run: RunRecord): Promise<RunRecord>;
  getRun(): Promise<RunRecord | undefined>;
  updateStatus(
    status: RunStatus,
    patch?: Partial<Omit<RunRecord, 'id' | 'status' | 'createdAt'>>,
  ): Promise<RunRecord>;
  cancelRun(): Promise<RunRecord>;
}

export interface RunStateNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): RunStateStub;
}

export type AiOrchestratorBindings = {
  [binding: string]: unknown;
  ENVIRONMENT?: string;
  AUTH_WORKER?: WorkerFetcher;
  AI_ORCHESTRATION_WORKFLOW?: WorkflowBinding<WorkflowRunParams>;
  AI_RUN_STATE?: RunStateNamespace;
  AI_ARTIFACTS?: R2Bucket;

  /**
   * Public JSON catalog describing provider endpoints and model capabilities.
   * Provider API keys are referenced by binding name and remain secrets.
   */
  AI_PROVIDER_CATALOG?: string;

  /**
   * Qdrant Cloud cluster endpoint. The URL itself is not a secret.
   */
  QDRANT_URL?: string;

  /**
   * Qdrant API key. Configure this as a Cloudflare secret.
   */
  QDRANT_API_KEY?: string;

  /**
   * Shared Qdrant collection used for Aerealith knowledge vectors.
   */
  QDRANT_COLLECTION?: string;
};
