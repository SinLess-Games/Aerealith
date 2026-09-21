import type { WorkersAiBinding } from '@aerealith-ai/ai-cloudflare-workers';
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

export interface SecretStoreBinding {
  get(): Promise<string>;
}

export interface AiCodeSandboxStub {
  initialize(options?: {
    repositoryUrl?: string;
    ref?: string;
    networkAccess?: boolean;
  }): Promise<{ root: string }>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  listFiles(path?: string): Promise<readonly string[]>;
  search(pattern: string, path?: string): Promise<readonly string[]>;
  execute(request: {
    command: string;
    args?: readonly string[];
    cwd?: string;
    env?: Readonly<Record<string, string>>;
    timeoutMs?: number;
    networkAccess?: boolean;
  }): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
    durationMs: number;
  }>;
  close(): Promise<void>;
}

export interface AiCodeSandboxNamespace {
  getByName(name: string): AiCodeSandboxStub;
}

export interface ConversationStateStub {
  createConversation(
    conversation: import('./conversation-state').ConversationRecord,
  ): Promise<import('./conversation-state').ConversationRecord>;
  getConversation(): Promise<
    import('./conversation-state').ConversationRecord | undefined
  >;
  appendMessage(
    message: import('./conversation-state').ConversationMessage,
  ): Promise<import('./conversation-state').ConversationRecord>;
  deleteConversation(): Promise<void>;
}

export interface ConversationStateNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): ConversationStateStub;
}

export interface ConversationIndexStub {
  upsertConversation(
    conversation: import('./conversation-state').ConversationSummary,
  ): Promise<void>;
  deleteConversation(conversationId: string): Promise<void>;
  listConversations(
    limit?: number,
    before?: string,
  ): Promise<{
    items: readonly import('./conversation-state').ConversationSummary[];
    nextBefore?: string;
  }>;
}

export interface ConversationIndexNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): ConversationIndexStub;
}

export interface KnowledgeCatalogStub {
  createKnowledgeBase(input: {
    tenantId: string;
    name: string;
    description?: string;
  }): Promise<import('./knowledge-catalog').KnowledgeBaseRecord>;
  getKnowledgeBase(
    id: string,
  ): Promise<import('./knowledge-catalog').KnowledgeBaseRecord | undefined>;
  listKnowledgeBases(): Promise<
    readonly import('./knowledge-catalog').KnowledgeBaseSummary[]
  >;
  assertCanRecordDocuments(
    knowledgeBaseId: string,
    documentIds: readonly string[],
  ): Promise<void>;
  recordDocuments(
    knowledgeBaseId: string,
    documentIds: readonly string[],
  ): Promise<import('./knowledge-catalog').KnowledgeBaseRecord | undefined>;
  deleteDocument(knowledgeBaseId: string, documentId: string): Promise<boolean>;
  deleteKnowledgeBase(id: string): Promise<boolean>;
}

export interface KnowledgeCatalogNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): KnowledgeCatalogStub;
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
  createRunIfAbsent?(
    run: RunRecord,
  ): Promise<{ run: RunRecord; created: boolean }>;
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

export interface RunIndexStub {
  upsertRun(run: RunRecord): Promise<void>;
  listRuns(
    limit?: number,
    before?: string,
  ): Promise<{
    items: readonly Omit<RunRecord, 'output'>[];
    nextBefore?: string;
  }>;
}

export interface RunIndexNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): RunIndexStub;
}

export interface RateLimitNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): {
    consume(
      limit: number,
      windowMs: number,
    ): Promise<{
      allowed: boolean;
      limit: number;
      remaining: number;
      retryAfterSeconds: number;
    }>;
  };
}

export interface UsageLedgerNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): {
    consumeRun(
      dailyRunLimit: number,
      dailyCostBudgetUsd: number,
    ): Promise<{
      allowed: boolean;
      reason?: 'DAILY_RUN_LIMIT' | 'DAILY_COST_BUDGET';
      usage: {
        day: string;
        runs: number;
        inputUnits: number;
        outputUnits: number;
        totalUnits: number;
        estimatedCostUsd: number;
      };
    }>;
    releaseRun(): Promise<{
      day: string;
      runs: number;
      inputUnits: number;
      outputUnits: number;
      totalUnits: number;
      estimatedCostUsd: number;
    }>;
    recordUsage(
      usage?: import('@aerealith-ai/ai-orchestration').Usage,
    ): Promise<{
      day: string;
      runs: number;
      inputUnits: number;
      outputUnits: number;
      totalUnits: number;
      estimatedCostUsd: number;
    }>;
    getUsage(): Promise<{
      day: string;
      runs: number;
      inputUnits: number;
      outputUnits: number;
      totalUnits: number;
      estimatedCostUsd: number;
    }>;
  };
}

export type AiOrchestratorBindings = {
  [binding: string]: unknown;

  ENVIRONMENT?: string;

  AI?: WorkersAiBinding;
  AUTH_WORKER?: WorkerFetcher;
  AI_ORCHESTRATION_WORKFLOW?: WorkflowBinding<WorkflowRunParams>;
  AI_RUN_STATE?: RunStateNamespace;
  AI_RUN_INDEX?: RunIndexNamespace;
  AI_RATE_LIMIT?: RateLimitNamespace;
  AI_USAGE?: UsageLedgerNamespace;
  AI_ARTIFACTS?: R2Bucket;
  AI_CODE_SANDBOX?: AiCodeSandboxNamespace;
  AI_CONVERSATION_STATE?: ConversationStateNamespace;
  AI_CONVERSATION_INDEX?: ConversationIndexNamespace;
  AI_KNOWLEDGE_CATALOG?: KnowledgeCatalogNamespace;

  /**
   * Optional JSON catalog for non-Cloudflare OpenAI-compatible providers.
   * Cloudflare Workers AI is registered directly through the AI binding.
   */
  AI_PROVIDER_CATALOG?: string;
  AI_RUNS_PER_MINUTE?: string;
  AI_RATE_LIMIT_WINDOW_MS?: string;
  AI_DAILY_RUN_LIMIT?: string;
  AI_DAILY_COST_BUDGET_USD?: string;

  /**
   * Qdrant Cloud cluster endpoint. The URL itself is not a secret.
   */
  QDRANT_URL?: string;

  /**
   * Qdrant API key from Cloudflare Secrets Store.
   */
  QDRANT_API_KEY?: SecretStoreBinding | string;

  /**
   * Shared Qdrant collection used for Aerealith knowledge vectors.
   */
  QDRANT_COLLECTION?: string;
};
