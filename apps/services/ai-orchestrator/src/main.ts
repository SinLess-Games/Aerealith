import {
  capabilityKinds,
  type CodeGenerationInput,
  type OrchestrationRequest,
  type RunRecord,
} from '@aerealith-ai/ai-orchestration';
import {
  ApiError,
  ApiErrorCode,
  createApiApp,
  type ApiEnv,
  type ApiRequestContext,
} from '@aerealith-ai/api-platform';
import { HttpStatus } from '@aerealith-ai/core';
import { createLogger } from '@aerealith-ai/observability/logger';
import { secureHeaders } from 'hono/secure-headers';
import { z } from 'zod';

import { artifactStoreStatus, createArtifactStore } from './artifact-runtime';
import {
  authenticateRequest,
  AuthenticationRequiredError,
  AuthServiceUnavailableError,
  type AiPrincipal,
} from './auth-runtime';
import type { AiOrchestratorBindings } from './bindings';
import { CloudflareWorkflowOrchestrationEngine } from './cloudflare-workflow-engine';
import { codeRequestNeedsSandbox } from './code-agent-runtime';
import { ConversationStore } from './conversation-runtime';
import { executableCapabilities } from './execution-runtime';
import { createIdempotentRunIdentity } from './idempotency';
import {
  BasicOrchestrationEngine,
  type OrchestrationEngine,
} from './orchestrator';
import { modelRuntimeCatalog, providerRuntimeStatus } from './provider-runtime';
import { AiRateLimiter } from './rate-limit';
import { orchestrationRequestSchema } from './request-schema';
import { AiRunController } from './run-controller';
import { createRunEventStream } from './run-events';
import { createRunIndexStore, createRunStore } from './run-store';
import { startStreamingTextRun } from './streaming-runtime';
import { sandboxToolDefinitions } from './tool-runtime';
import { AiUsageStore } from './usage-ledger';
import { createVectorStore, vectorStoreStatus } from './vector-store';

type AiOrchestratorEnv = ApiEnv<ApiRequestContext, AiOrchestratorBindings>;

const logger = createLogger({
  service: 'ai-orchestrator',
  environment: 'cloudflare-worker',
  console: {
    pretty: false,
    color: false,
  },
});

const app = createApiApp<AiOrchestratorEnv>({
  serviceName: 'ai-orchestrator',
  logger,
  middleware: [{ handler: secureHeaders() }],
});

const runIdSchema = z.uuid();

const knowledgeBaseCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2_000).optional(),
});

const knowledgeDocumentsSchema = z.object({
  documents: z
    .array(
      z.object({
        id: z.string().min(1).max(512),
        text: z.string().min(1).max(1_000_000),
        metadata: z.record(z.string().max(128), z.unknown()).optional(),
      }),
    )
    .min(1)
    .max(256),
});

const conversationCreateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

const conversationMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string().min(1).max(250_000),
  name: z.string().min(1).max(128).optional(),
});

const runListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z
    .string()
    .max(64)
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: 'before must be an ISO date-time.',
    })
    .optional(),
});

app.get('/health', (c) =>
  c.json({
    service: 'ai-orchestrator',
    status: 'ok',
    environment: c.env.ENVIRONMENT ?? 'development',
    meta: responseMeta(c.get('apiContext')),
  }),
);

app.get('/ready', (c) => {
  const environment = c.env.ENVIRONMENT ?? 'development';
  const workflowConfigured = Boolean(c.env.AI_ORCHESTRATION_WORKFLOW);
  const authConfigured = Boolean(c.env.AUTH_WORKER);
  const runStateConfigured = Boolean(c.env.AI_RUN_STATE);
  const runIndexConfigured = Boolean(c.env.AI_RUN_INDEX);
  const rateLimitConfigured = Boolean(c.env.AI_RATE_LIMIT);
  const usageConfigured = Boolean(c.env.AI_USAGE);
  const codeSandboxConfigured = Boolean(c.env.AI_CODE_SANDBOX);
  const conversationStateConfigured = Boolean(c.env.AI_CONVERSATION_STATE);
  const conversationIndexConfigured = Boolean(c.env.AI_CONVERSATION_INDEX);
  const knowledgeCatalogConfigured = Boolean(c.env.AI_KNOWLEDGE_CATALOG);
  const artifactStore = artifactStoreStatus(c.env);
  const vectorStore = vectorStoreStatus(c.env);
  const providers = providerRuntimeStatus(c.env);
  const executable = executableCapabilities(c.env);

  const missingProductionDependencies = [
    ...(authConfigured ? [] : ['AUTH_WORKER']),
    ...(workflowConfigured ? [] : ['AI_ORCHESTRATION_WORKFLOW']),
    ...(runStateConfigured ? [] : ['AI_RUN_STATE']),
    ...(runIndexConfigured ? [] : ['AI_RUN_INDEX']),
    ...(rateLimitConfigured ? [] : ['AI_RATE_LIMIT']),
    ...(usageConfigured ? [] : ['AI_USAGE']),
    ...(codeSandboxConfigured ? [] : ['AI_CODE_SANDBOX']),
    ...(conversationStateConfigured ? [] : ['AI_CONVERSATION_STATE']),
    ...(conversationIndexConfigured ? [] : ['AI_CONVERSATION_INDEX']),
    ...(knowledgeCatalogConfigured ? [] : ['AI_KNOWLEDGE_CATALOG']),
    ...(artifactStore.configured ? [] : ['AI_ARTIFACTS']),
    ...(vectorStore.configured ? [] : ['QDRANT']),
    ...(providers.configuredProviders > 0 ? [] : ['AI']),
  ];

  if (
    environment === 'production' &&
    missingProductionDependencies.length > 0
  ) {
    return c.json(
      {
        service: 'ai-orchestrator',
        status: 'not_ready',
        reason: 'Required production bindings are missing.',
        missing: missingProductionDependencies,
        dependencies: {
          authConfigured,
          workflowConfigured,
          runStateConfigured,
          runIndexConfigured,
          rateLimitConfigured,
          usageConfigured,
          codeSandboxConfigured,
          conversationStateConfigured,
          conversationIndexConfigured,
          knowledgeCatalogConfigured,
          artifactStore,
          vectorStore: {
            provider: vectorStore.provider,
            configured: vectorStore.configured,
          },
          providers: {
            configured: providers.configuredProviders,
            total: providers.totalProviders,
          },
          executableCapabilities: executable,
        },
        meta: responseMeta(c.get('apiContext')),
      },
      HttpStatus.ServiceUnavailable,
    );
  }

  return c.json({
    service: 'ai-orchestrator',
    status: 'ready',
    dependencies: {
      authConfigured,
      workflowConfigured,
      runStateConfigured,
      runIndexConfigured,
      rateLimitConfigured,
      usageConfigured,
      codeSandboxConfigured,
      conversationStateConfigured,
      conversationIndexConfigured,
      knowledgeCatalogConfigured,
      artifactStore,
      vectorStore: {
        provider: vectorStore.provider,
        configured: vectorStore.configured,
      },
      providers: {
        configured: providers.configuredProviders,
        total: providers.totalProviders,
      },
      executableCapabilities: executable,
    },
    meta: responseMeta(c.get('apiContext')),
  });
});

app.get('/api/V1/services/ai-orchestrator', (c) =>
  c.json({
    service: 'ai-orchestrator',
    status: 'ok',
    capabilities: capabilityKinds,
    meta: responseMeta(c.get('apiContext')),
  }),
);

app.get('/api/V1/ai/providers', (c) => {
  const status = providerRuntimeStatus(c.env);

  return c.json({
    ok: true,
    data: status,
    meta: responseMeta(c.get('apiContext')),
  });
});

app.get('/api/V1/ai/tools', (c) => {
  return c.json({
    ok: true,
    data: c.env.AI_CODE_SANDBOX ? sandboxToolDefinitions : [],
    meta: responseMeta(c.get('apiContext')),
  });
});

app.get('/api/V1/ai/models', async (c) => {
  return c.json({
    ok: true,
    data: await modelRuntimeCatalog(c.env),
    meta: responseMeta(c.get('apiContext')),
  });
});

app.get('/api/V1/ai/vector-store', (c) => {
  const status = vectorStoreStatus(c.env);

  return c.json({
    ok: true,
    data: {
      provider: status.provider,
      configured: status.configured,
      collection: status.collection,
    },
    meta: responseMeta(c.get('apiContext')),
  });
});

app.get('/api/V1/ai/capabilities', (c) =>
  c.json({
    ok: true,
    data: {
      declared: capabilityKinds,
      executable: executableCapabilities(c.env),
    },
    meta: responseMeta(c.get('apiContext')),
  }),
);

app.get('/api/V1/ai/knowledge-bases', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const catalog = requireKnowledgeCatalog(c.env, principal.id);

  return c.json({
    ok: true,
    data: await catalog.listKnowledgeBases(),
    meta: responseMeta(c.get('apiContext')),
  });
});

app.post('/api/V1/ai/knowledge-bases', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch (error) {
    throw new ApiError('A valid JSON body is required.', {
      code: ApiErrorCode.BadRequest,
      status: HttpStatus.BadRequest,
      cause: error,
    });
  }

  const parsed = knowledgeBaseCreateSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError('The knowledge-base request is invalid.', {
      code: ApiErrorCode.ValidationFailed,
      status: HttpStatus.UnprocessableEntity,
    });
  }

  const knowledgeBase = await requireKnowledgeCatalog(
    c.env,
    principal.id,
  ).createKnowledgeBase({
    tenantId: principal.id,
    name: parsed.data.name,
    ...(parsed.data.description
      ? { description: parsed.data.description }
      : {}),
  });

  return c.json(
    {
      ok: true,
      data: knowledgeBase,
      meta: responseMeta(c.get('apiContext')),
    },
    HttpStatus.Created,
  );
});

app.get('/api/V1/ai/knowledge-bases/:knowledgeBaseId', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const knowledgeBaseId = parseUuid(
    c.req.param('knowledgeBaseId'),
    'knowledge-base',
  );
  const knowledgeBase = await requireKnowledgeCatalog(
    c.env,
    principal.id,
  ).getKnowledgeBase(knowledgeBaseId);

  if (!knowledgeBase || knowledgeBase.tenantId !== principal.id) {
    throw new ApiError('The AI knowledge base was not found.', {
      code: ApiErrorCode.NotFound,
      status: HttpStatus.NotFound,
    });
  }

  return c.json({
    ok: true,
    data: knowledgeBase,
    meta: responseMeta(c.get('apiContext')),
  });
});

app.get('/api/V1/ai/knowledge-bases/:knowledgeBaseId/documents', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const knowledgeBaseId = parseUuid(
    c.req.param('knowledgeBaseId'),
    'knowledge-base',
  );
  const knowledgeBase = await requireKnowledgeCatalog(
    c.env,
    principal.id,
  ).getKnowledgeBase(knowledgeBaseId);

  if (!knowledgeBase || knowledgeBase.tenantId !== principal.id) {
    throw new ApiError('The AI knowledge base was not found.', {
      code: ApiErrorCode.NotFound,
      status: HttpStatus.NotFound,
    });
  }

  return c.json({
    ok: true,
    data: knowledgeBase.documents,
    meta: responseMeta(c.get('apiContext')),
  });
});

app.post('/api/V1/ai/knowledge-bases/:knowledgeBaseId/documents', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const knowledgeBaseId = parseUuid(
    c.req.param('knowledgeBaseId'),
    'knowledge-base',
  );
  const catalog = requireKnowledgeCatalog(c.env, principal.id);
  const knowledgeBase = await catalog.getKnowledgeBase(knowledgeBaseId);

  if (!knowledgeBase || knowledgeBase.tenantId !== principal.id) {
    throw new ApiError('The AI knowledge base was not found.', {
      code: ApiErrorCode.NotFound,
      status: HttpStatus.NotFound,
    });
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch (error) {
    throw new ApiError('A valid JSON body is required.', {
      code: ApiErrorCode.BadRequest,
      status: HttpStatus.BadRequest,
      cause: error,
    });
  }

  const parsed = knowledgeDocumentsSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError('The knowledge documents are invalid.', {
      code: ApiErrorCode.ValidationFailed,
      status: HttpStatus.UnprocessableEntity,
    });
  }

  const run = await submitDurableRun(
    c.env,
    principal,
    {
      capability: 'knowledge-ingest',
      tenantId: principal.id,
      actorId: principal.id,
      input: {
        namespace: knowledgeBaseId,
        documents: parsed.data.documents,
      },
      metadata: {
        knowledgeBaseId,
      },
    },
    c.req.header('idempotency-key'),
  );

  return c.json(
    {
      ok: true,
      data: run,
      meta: responseMeta(c.get('apiContext')),
    },
    HttpStatus.Accepted,
  );
});

app.delete(
  '/api/V1/ai/knowledge-bases/:knowledgeBaseId/documents/:documentId',
  async (c) => {
    const principal = await requirePrincipal(c.req.raw, c.env);
    const knowledgeBaseId = parseUuid(
      c.req.param('knowledgeBaseId'),
      'knowledge-base',
    );
    const documentId = c.req.param('documentId');
    if (!documentId || documentId.length > 512) {
      throw new ApiError('The AI knowledge document id is invalid.', {
        code: ApiErrorCode.ValidationFailed,
        status: HttpStatus.UnprocessableEntity,
      });
    }

    const catalog = requireKnowledgeCatalog(c.env, principal.id);
    const knowledgeBase = await catalog.getKnowledgeBase(knowledgeBaseId);

    if (!knowledgeBase || knowledgeBase.tenantId !== principal.id) {
      throw new ApiError('The AI knowledge base was not found.', {
        code: ApiErrorCode.NotFound,
        status: HttpStatus.NotFound,
      });
    }

    if (
      !knowledgeBase.documents.some((document) => document.id === documentId)
    ) {
      throw new ApiError('The AI knowledge document was not found.', {
        code: ApiErrorCode.NotFound,
        status: HttpStatus.NotFound,
      });
    }

    const vectorStore = await createVectorStore(c.env);
    if (!vectorStore) {
      throw new ApiError('AI vector storage is not configured.', {
        code: ApiErrorCode.InternalError,
        status: HttpStatus.ServiceUnavailable,
      });
    }

    await vectorStore.deleteByFilter(
      `user:${principal.id}:knowledge:${knowledgeBaseId}`,
      {
        must: [
          {
            key: 'metadata.documentId',
            match: { value: documentId },
          },
        ],
      },
    );
    await catalog.deleteDocument(knowledgeBaseId, documentId);

    return new Response(null, { status: HttpStatus.NoContent });
  },
);

app.delete('/api/V1/ai/knowledge-bases/:knowledgeBaseId', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const knowledgeBaseId = parseUuid(
    c.req.param('knowledgeBaseId'),
    'knowledge-base',
  );
  const catalog = requireKnowledgeCatalog(c.env, principal.id);
  const knowledgeBase = await catalog.getKnowledgeBase(knowledgeBaseId);

  if (!knowledgeBase || knowledgeBase.tenantId !== principal.id) {
    throw new ApiError('The AI knowledge base was not found.', {
      code: ApiErrorCode.NotFound,
      status: HttpStatus.NotFound,
    });
  }

  const vectorStore = await createVectorStore(c.env);
  if (!vectorStore) {
    throw new ApiError('AI vector storage is not configured.', {
      code: ApiErrorCode.InternalError,
      status: HttpStatus.ServiceUnavailable,
    });
  }

  await vectorStore.deleteIndex(
    `user:${principal.id}:knowledge:${knowledgeBaseId}`,
  );
  await catalog.deleteKnowledgeBase(knowledgeBaseId);

  return new Response(null, { status: HttpStatus.NoContent });
});

app.get('/api/V1/ai/conversations', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const parsed = runListQuerySchema.safeParse({
    limit: c.req.query('limit') ?? 50,
    before: c.req.query('before'),
  });

  if (!parsed.success) {
    throw new ApiError('The conversation query is invalid.', {
      code: ApiErrorCode.ValidationFailed,
      status: HttpStatus.UnprocessableEntity,
    });
  }

  const conversations = requireConversationStore(c.env);
  const page = await conversations.list(
    principal.id,
    parsed.data.limit,
    parsed.data.before,
  );

  return c.json({
    ok: true,
    data: page.items,
    pagination: {
      nextBefore: page.nextBefore ?? null,
    },
    meta: responseMeta(c.get('apiContext')),
  });
});

app.post('/api/V1/ai/conversations', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const body = await readOptionalJson(c.req.raw);
  const parsed = conversationCreateSchema.safeParse(body ?? {});

  if (!parsed.success) {
    throw new ApiError('The conversation request is invalid.', {
      code: ApiErrorCode.ValidationFailed,
      status: HttpStatus.UnprocessableEntity,
    });
  }

  const conversation = await requireConversationStore(c.env).create(
    principal.id,
    parsed.data.title,
  );

  return c.json(
    {
      ok: true,
      data: conversation,
      meta: responseMeta(c.get('apiContext')),
    },
    HttpStatus.Created,
  );
});

app.get('/api/V1/ai/conversations/:conversationId', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const conversationId = parseUuid(
    c.req.param('conversationId'),
    'conversation',
  );
  const conversation = await requireConversationStore(c.env).get(
    principal.id,
    conversationId,
  );

  if (!conversation || conversation.tenantId !== principal.id) {
    throw new ApiError('The AI conversation was not found.', {
      code: ApiErrorCode.NotFound,
      status: HttpStatus.NotFound,
    });
  }

  return c.json({
    ok: true,
    data: conversation,
    meta: responseMeta(c.get('apiContext')),
  });
});

app.post('/api/V1/ai/conversations/:conversationId/messages', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const conversationId = parseUuid(
    c.req.param('conversationId'),
    'conversation',
  );

  let body: unknown;
  try {
    body = await c.req.json();
  } catch (error) {
    throw new ApiError('A valid JSON body is required.', {
      code: ApiErrorCode.BadRequest,
      status: HttpStatus.BadRequest,
      cause: error,
    });
  }

  const parsed = conversationMessageSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError('The conversation message is invalid.', {
      code: ApiErrorCode.ValidationFailed,
      status: HttpStatus.UnprocessableEntity,
    });
  }

  const conversation = await requireConversationStore(c.env).append(
    principal.id,
    conversationId,
    parsed.data,
  );

  if (!conversation) {
    throw new ApiError('The AI conversation was not found.', {
      code: ApiErrorCode.NotFound,
      status: HttpStatus.NotFound,
    });
  }

  return c.json(
    {
      ok: true,
      data: conversation,
      meta: responseMeta(c.get('apiContext')),
    },
    HttpStatus.Created,
  );
});

app.delete('/api/V1/ai/conversations/:conversationId', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const conversationId = parseUuid(
    c.req.param('conversationId'),
    'conversation',
  );
  const deleted = await requireConversationStore(c.env).delete(
    principal.id,
    conversationId,
  );

  if (!deleted) {
    throw new ApiError('The AI conversation was not found.', {
      code: ApiErrorCode.NotFound,
      status: HttpStatus.NotFound,
    });
  }

  return new Response(null, { status: HttpStatus.NoContent });
});

app.get('/api/V1/ai/usage', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);

  if (!c.env.AI_USAGE) {
    throw new ApiError('AI usage tracking is not configured.', {
      code: ApiErrorCode.InternalError,
      status: HttpStatus.ServiceUnavailable,
    });
  }

  const usage = await new AiUsageStore(c.env.AI_USAGE).getUsage(principal.id);

  return c.json({
    ok: true,
    data: {
      ...usage,
      limits: {
        dailyRuns: parseNonNegativeInteger(c.env.AI_DAILY_RUN_LIMIT, 0),
        dailyCostBudgetUsd: parseNonNegativeNumber(
          c.env.AI_DAILY_COST_BUDGET_USD,
          0,
        ),
        runsPerMinute: parsePositiveInteger(c.env.AI_RUNS_PER_MINUTE, 60),
      },
    },
    meta: responseMeta(c.get('apiContext')),
  });
});

app.get('/api/V1/ai/runs', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const parsed = runListQuerySchema.safeParse({
    limit: c.req.query('limit') ?? 50,
    before: c.req.query('before'),
  });

  if (!parsed.success) {
    throw new ApiError('The run-history query is invalid.', {
      code: ApiErrorCode.ValidationFailed,
      status: HttpStatus.UnprocessableEntity,
      metadata: {
        issues: parsed.error.issues.map(({ code, message, path }) => ({
          code,
          message,
          path,
        })),
      },
    });
  }

  const index = createRunIndexStore(c.env);
  if (!index) {
    throw new ApiError('AI run history is not configured.', {
      code: ApiErrorCode.InternalError,
      status: HttpStatus.ServiceUnavailable,
    });
  }

  const page = await index.list(
    principal.id,
    parsed.data.limit,
    parsed.data.before,
  );

  return c.json({
    ok: true,
    data: page.items,
    pagination: {
      nextBefore: page.nextBefore ?? null,
    },
    meta: responseMeta(c.get('apiContext')),
  });
});

app.get('/api/V1/ai/runs/:runId/events', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const parsedRunId = runIdSchema.safeParse(c.req.param('runId'));

  if (!parsedRunId.success) {
    throw new ApiError('The AI run id is invalid.', {
      code: ApiErrorCode.ValidationFailed,
      status: HttpStatus.UnprocessableEntity,
    });
  }

  const runs = createRunStore(c.env);
  if (!runs) {
    throw new ApiError('AI run persistence is not configured.', {
      code: ApiErrorCode.InternalError,
      status: HttpStatus.ServiceUnavailable,
    });
  }

  const run = await runs.get(parsedRunId.data);
  if (!run || run.tenantId !== principal.id) {
    throw new ApiError('The AI run was not found.', {
      code: ApiErrorCode.NotFound,
      status: HttpStatus.NotFound,
    });
  }

  return createRunEventStream(runs, run.id, c.req.raw.signal);
});

app.get('/api/V1/ai/runs/:runId', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const parsedRunId = runIdSchema.safeParse(c.req.param('runId'));

  if (!parsedRunId.success) {
    throw new ApiError('The AI run id is invalid.', {
      code: ApiErrorCode.ValidationFailed,
      status: HttpStatus.UnprocessableEntity,
    });
  }

  const runs = createRunStore(c.env);
  if (!runs) {
    throw new ApiError('AI run persistence is not configured.', {
      code: ApiErrorCode.InternalError,
      status: HttpStatus.ServiceUnavailable,
    });
  }

  const run = await runs.get(parsedRunId.data);
  if (!run || run.tenantId !== principal.id) {
    throw new ApiError('The AI run was not found.', {
      code: ApiErrorCode.NotFound,
      status: HttpStatus.NotFound,
    });
  }

  return c.json({
    ok: true,
    data: run,
    meta: responseMeta(c.get('apiContext')),
  });
});

app.get('/api/V1/ai/artifacts/:artifactId', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const artifactId = c.req.param('artifactId');
  const artifacts = createArtifactStore(c.env);

  if (!artifacts) {
    throw new ApiError('AI artifact storage is not configured.', {
      code: ApiErrorCode.InternalError,
      status: HttpStatus.ServiceUnavailable,
    });
  }

  let artifact: Response | undefined;
  try {
    artifact = await artifacts.get(`user:${principal.id}`, artifactId);
  } catch {
    throw new ApiError('The AI artifact id is invalid.', {
      code: ApiErrorCode.ValidationFailed,
      status: HttpStatus.UnprocessableEntity,
    });
  }

  if (!artifact) {
    throw new ApiError('The AI artifact was not found.', {
      code: ApiErrorCode.NotFound,
      status: HttpStatus.NotFound,
    });
  }

  return artifact;
});

app.delete('/api/V1/ai/artifacts/:artifactId', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const artifactId = c.req.param('artifactId');
  const artifacts = createArtifactStore(c.env);

  if (!artifacts) {
    throw new ApiError('AI artifact storage is not configured.', {
      code: ApiErrorCode.InternalError,
      status: HttpStatus.ServiceUnavailable,
    });
  }

  try {
    await artifacts.delete(`user:${principal.id}`, artifactId);
  } catch {
    throw new ApiError('The AI artifact id is invalid.', {
      code: ApiErrorCode.ValidationFailed,
      status: HttpStatus.UnprocessableEntity,
    });
  }

  return new Response(null, { status: 204 });
});

app.delete('/api/V1/ai/runs/:runId', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);
  const parsedRunId = runIdSchema.safeParse(c.req.param('runId'));

  if (!parsedRunId.success) {
    throw new ApiError('The AI run id is invalid.', {
      code: ApiErrorCode.ValidationFailed,
      status: HttpStatus.UnprocessableEntity,
    });
  }

  const runs = createRunStore(c.env);
  const workflow = c.env.AI_ORCHESTRATION_WORKFLOW;

  if (!runs || !workflow) {
    throw new ApiError('AI run cancellation is not configured.', {
      code: ApiErrorCode.InternalError,
      status: HttpStatus.ServiceUnavailable,
    });
  }

  const existing = await runs.get(parsedRunId.data);
  if (!existing || existing.tenantId !== principal.id) {
    throw new ApiError('The AI run was not found.', {
      code: ApiErrorCode.NotFound,
      status: HttpStatus.NotFound,
    });
  }

  const controller = new AiRunController(workflow, runs);
  const run = await controller.cancel(parsedRunId.data);

  return c.json({
    ok: true,
    data: run,
    meta: responseMeta(c.get('apiContext')),
  });
});

app.post('/api/V1/ai/stream', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch (error) {
    throw new ApiError('A valid JSON body is required.', {
      code: ApiErrorCode.BadRequest,
      status: HttpStatus.BadRequest,
      cause: error,
    });
  }

  const parsed = orchestrationRequestSchema.safeParse(body);
  if (!parsed.success || parsed.data.capability !== 'text') {
    throw new ApiError(
      'Streaming currently accepts text capability requests only.',
      {
        code: ApiErrorCode.ValidationFailed,
        status: HttpStatus.UnprocessableEntity,
        metadata: {
          ...(parsed.success
            ? {}
            : {
                issues: parsed.error.issues.map(({ code, message, path }) => ({
                  code,
                  message,
                  path,
                })),
              }),
        },
      },
    );
  }

  assertStreamingSubmissionReady(c.env);
  await enforceRunRateLimit(c.env, principal.id);
  const usageReserved = await enforceDailyUsageLimits(c.env, principal.id);
  const runs = createRunStore(c.env);

  if (!runs) {
    throw new ApiError('AI run persistence is not configured.', {
      code: ApiErrorCode.InternalError,
      status: HttpStatus.ServiceUnavailable,
    });
  }

  try {
    const streaming = await startStreamingTextRun(
      c.env,
      {
        ...parsed.data,
        tenantId: principal.id,
        actorId: principal.id,
      },
      runs,
    );

    c.executionCtx.waitUntil(streaming.completion.catch(() => undefined));

    return new Response(streaming.stream, {
      status: HttpStatus.Ok,
      headers: {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform',
        'x-ai-run-id': streaming.run.id,
      },
    });
  } catch (error) {
    if (usageReserved && c.env.AI_USAGE) {
      await new AiUsageStore(c.env.AI_USAGE)
        .releaseRun(principal.id)
        .catch(() => undefined);
    }

    throw error;
  }
});

app.post('/api/V1/ai/runs', async (c) => {
  const principal = await requirePrincipal(c.req.raw, c.env);

  let body: unknown;
  try {
    body = await c.req.json();
  } catch (error) {
    throw new ApiError('A valid JSON body is required.', {
      code: ApiErrorCode.BadRequest,
      status: HttpStatus.BadRequest,
      cause: error,
    });
  }

  const parsed = orchestrationRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError('The orchestration request is invalid.', {
      code: ApiErrorCode.ValidationFailed,
      status: HttpStatus.UnprocessableEntity,
      metadata: {
        issues: parsed.error.issues.map(({ code, message, path }) => ({
          code,
          message,
          path,
        })),
      },
    });
  }

  const result = await submitDurableRun(
    c.env,
    principal,
    {
      ...parsed.data,
      tenantId: principal.id,
      actorId: principal.id,
    },
    c.req.header('idempotency-key'),
  );

  return c.json(
    {
      ok: true,
      data: result,
      meta: responseMeta(c.get('apiContext')),
    },
    HttpStatus.Accepted,
  );
});

async function submitDurableRun(
  bindings: AiOrchestratorBindings,
  principal: AiPrincipal,
  request: OrchestrationRequest,
  idempotencyKey?: string,
): Promise<RunRecord> {
  let submissionOptions:
    | {
        runId: string;
        requestFingerprint: string;
      }
    | undefined;

  if (idempotencyKey !== undefined) {
    try {
      submissionOptions = await createIdempotentRunIdentity(
        principal.id,
        idempotencyKey,
        request,
      );
    } catch (error) {
      throw new ApiError('The Idempotency-Key header is invalid.', {
        code: ApiErrorCode.ValidationFailed,
        status: HttpStatus.UnprocessableEntity,
        cause: error,
      });
    }

    const runs = createRunStore(bindings);
    const existing = runs ? await runs.get(submissionOptions.runId) : undefined;

    if (existing) {
      if (
        existing.requestFingerprint !== submissionOptions.requestFingerprint
      ) {
        throw new ApiError(
          'The Idempotency-Key was already used for a different request.',
          {
            code: ApiErrorCode.Conflict,
            status: HttpStatus.Conflict,
          },
        );
      }

      return existing;
    }
  }

  assertRunSubmissionReady(bindings, request.capability);

  if (
    request.capability === 'code' &&
    codeRequestNeedsSandbox(request.input as CodeGenerationInput) &&
    !bindings.AI_CODE_SANDBOX
  ) {
    throw new ApiError('AI code sandbox is not configured.', {
      code: ApiErrorCode.InternalError,
      status: HttpStatus.ServiceUnavailable,
    });
  }

  await enforceRunRateLimit(bindings, principal.id);
  const usageReserved = await enforceDailyUsageLimits(bindings, principal.id);
  const engine = resolveEngine(bindings);

  try {
    return await engine.submit(request, submissionOptions);
  } catch (error) {
    if (usageReserved && bindings.AI_USAGE) {
      await new AiUsageStore(bindings.AI_USAGE)
        .releaseRun(principal.id)
        .catch(() => undefined);
    }

    throw error;
  }
}

function requireKnowledgeCatalog(
  bindings: AiOrchestratorBindings,
  tenantId: string,
) {
  if (!bindings.AI_KNOWLEDGE_CATALOG) {
    throw new ApiError('AI knowledge catalog is not configured.', {
      code: ApiErrorCode.InternalError,
      status: HttpStatus.ServiceUnavailable,
    });
  }

  const id = bindings.AI_KNOWLEDGE_CATALOG.idFromName(tenantId);
  return bindings.AI_KNOWLEDGE_CATALOG.get(id);
}

function requireConversationStore(
  bindings: AiOrchestratorBindings,
): ConversationStore {
  if (!bindings.AI_CONVERSATION_STATE || !bindings.AI_CONVERSATION_INDEX) {
    throw new ApiError('AI conversation storage is not configured.', {
      code: ApiErrorCode.InternalError,
      status: HttpStatus.ServiceUnavailable,
    });
  }

  return new ConversationStore(
    bindings.AI_CONVERSATION_STATE,
    bindings.AI_CONVERSATION_INDEX,
  );
}

function parseUuid(value: string, resource: string): string {
  const parsed = z.uuid().safeParse(value);

  if (!parsed.success) {
    throw new ApiError(`The AI ${resource} id is invalid.`, {
      code: ApiErrorCode.ValidationFailed,
      status: HttpStatus.UnprocessableEntity,
    });
  }

  return parsed.data;
}

async function readOptionalJson(
  request: Request,
): Promise<unknown | undefined> {
  const contentLength = request.headers.get('content-length');
  if (contentLength === '0') return undefined;

  const text = await request.text();
  if (!text.trim()) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new ApiError('A valid JSON body is required.', {
      code: ApiErrorCode.BadRequest,
      status: HttpStatus.BadRequest,
      cause: error,
    });
  }
}

async function requirePrincipal(
  request: Request,
  bindings: AiOrchestratorBindings,
): Promise<AiPrincipal> {
  try {
    return await authenticateRequest(request, bindings);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      throw new ApiError('Authentication is required.', {
        code: ApiErrorCode.Unauthorized,
        status: HttpStatus.Unauthorized,
      });
    }

    if (error instanceof AuthServiceUnavailableError) {
      throw new ApiError('Authentication service is unavailable.', {
        code: ApiErrorCode.InternalError,
        status: HttpStatus.ServiceUnavailable,
        cause: error,
      });
    }

    throw error;
  }
}

async function enforceDailyUsageLimits(
  bindings: AiOrchestratorBindings,
  tenantId: string,
): Promise<boolean> {
  if (!bindings.AI_USAGE) {
    if ((bindings.ENVIRONMENT ?? 'development') === 'production') {
      throw new ApiError('AI usage tracking is not configured.', {
        code: ApiErrorCode.InternalError,
        status: HttpStatus.ServiceUnavailable,
      });
    }

    return false;
  }

  const dailyRunLimit = parseNonNegativeInteger(bindings.AI_DAILY_RUN_LIMIT, 0);
  const dailyCostBudgetUsd = parseNonNegativeNumber(
    bindings.AI_DAILY_COST_BUDGET_USD,
    0,
  );
  const decision = await new AiUsageStore(bindings.AI_USAGE).consumeRun(
    tenantId,
    dailyRunLimit,
    dailyCostBudgetUsd,
  );

  if (!decision.allowed) {
    throw new ApiError(
      decision.reason === 'DAILY_COST_BUDGET'
        ? 'Daily AI cost budget reached.'
        : 'Daily AI run limit reached.',
      {
        code: ApiErrorCode.RateLimited,
        status: HttpStatus.TooManyRequests,
        metadata: {
          reason: decision.reason,
          usage: decision.usage,
          limits: {
            dailyRunLimit,
            dailyCostBudgetUsd,
          },
        },
        headers: {
          'retry-after': String(secondsUntilNextUtcDay()),
        },
      },
    );
  }

  return true;
}

async function enforceRunRateLimit(
  bindings: AiOrchestratorBindings,
  tenantId: string,
): Promise<void> {
  if (!bindings.AI_RATE_LIMIT) {
    if ((bindings.ENVIRONMENT ?? 'development') === 'production') {
      throw new ApiError('AI rate limiting is not configured.', {
        code: ApiErrorCode.InternalError,
        status: HttpStatus.ServiceUnavailable,
      });
    }

    return;
  }

  const limiter = new AiRateLimiter(bindings.AI_RATE_LIMIT);
  const limit = parsePositiveInteger(bindings.AI_RUNS_PER_MINUTE, 60);
  const windowMs = parsePositiveInteger(
    bindings.AI_RATE_LIMIT_WINDOW_MS,
    60_000,
  );
  const decision = await limiter.consume(tenantId, limit, windowMs);

  if (!decision.allowed) {
    throw new ApiError('AI run rate limit exceeded.', {
      code: ApiErrorCode.RateLimited,
      status: HttpStatus.TooManyRequests,
      metadata: {
        limit: decision.limit,
        remaining: decision.remaining,
        retryAfterSeconds: decision.retryAfterSeconds,
      },
      headers: {
        'retry-after': String(decision.retryAfterSeconds),
      },
    });
  }
}

function secondsUntilNextUtcDay(now = new Date()): number {
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );

  return Math.max(1, Math.ceil((next - now.getTime()) / 1_000));
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInteger(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseNonNegativeNumber(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) return fallback;

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function assertStreamingSubmissionReady(
  bindings: AiOrchestratorBindings,
): void {
  if ((bindings.ENVIRONMENT ?? 'development') !== 'production') {
    return;
  }

  const missing = [
    ...(bindings.AUTH_WORKER ? [] : ['AUTH_WORKER']),
    ...(bindings.AI_RUN_STATE ? [] : ['AI_RUN_STATE']),
    ...(bindings.AI_RUN_INDEX ? [] : ['AI_RUN_INDEX']),
    ...(bindings.AI_RATE_LIMIT ? [] : ['AI_RATE_LIMIT']),
    ...(bindings.AI_USAGE ? [] : ['AI_USAGE']),
    ...(bindings.AI ? [] : ['AI']),
  ];

  if (missing.length > 0) {
    throw new ApiError('AI streaming runtime is not ready.', {
      code: ApiErrorCode.InternalError,
      status: HttpStatus.ServiceUnavailable,
      metadata: { missing },
    });
  }
}

function assertRunSubmissionReady(
  bindings: AiOrchestratorBindings,
  capability: (typeof capabilityKinds)[number],
): void {
  if ((bindings.ENVIRONMENT ?? 'development') !== 'production') {
    return;
  }

  const missing = [
    ...(bindings.AUTH_WORKER ? [] : ['AUTH_WORKER']),
    ...(bindings.AI_ORCHESTRATION_WORKFLOW
      ? []
      : ['AI_ORCHESTRATION_WORKFLOW']),
    ...(bindings.AI_RUN_STATE ? [] : ['AI_RUN_STATE']),
    ...(bindings.AI_RUN_INDEX ? [] : ['AI_RUN_INDEX']),
    ...(bindings.AI_RATE_LIMIT ? [] : ['AI_RATE_LIMIT']),
    ...(bindings.AI_USAGE ? [] : ['AI_USAGE']),
  ];

  if (missing.length > 0) {
    throw new ApiError('AI orchestration runtime is not ready.', {
      code: ApiErrorCode.InternalError,
      status: HttpStatus.ServiceUnavailable,
      metadata: { missing },
    });
  }

  const executable = executableCapabilities(bindings);
  if (!executable.includes(capability)) {
    throw new ApiError(
      `No configured production provider can execute capability "${capability}".`,
      {
        code: ApiErrorCode.InternalError,
        status: HttpStatus.ServiceUnavailable,
      },
    );
  }
}

function resolveEngine(bindings: AiOrchestratorBindings): OrchestrationEngine {
  const runs = createRunStore(bindings);

  if (bindings.AI_ORCHESTRATION_WORKFLOW) {
    return new CloudflareWorkflowOrchestrationEngine(
      bindings.AI_ORCHESTRATION_WORKFLOW,
      runs,
    );
  }

  return new BasicOrchestrationEngine();
}

function responseMeta(context: ApiRequestContext) {
  return {
    requestId: context.requestId,
    ...(context.correlationId ? { correlationId: context.correlationId } : {}),
    timestamp: new Date().toISOString(),
  };
}

export { AiCodeSandbox } from './code-sandbox-container';
export { AiConversationIndex } from './conversation-index';
export { AiConversationState } from './conversation-state';
export { AiKnowledgeCatalog } from './knowledge-catalog';
export { AiRateLimit } from './rate-limit';
export { AiRunIndex } from './run-index';
export { AiRunState } from './run-state';
export { AiUsageLedger } from './usage-ledger';
export { AiOrchestrationWorkflow } from './workflow';
export default app;
