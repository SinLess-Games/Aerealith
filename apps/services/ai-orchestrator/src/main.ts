import { capabilityKinds } from '@aerealith-ai/ai-orchestration';
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

import { createArtifactStore } from './artifact-runtime';
import {
  authenticateRequest,
  AuthenticationRequiredError,
  AuthServiceUnavailableError,
  type AiPrincipal,
} from './auth-runtime';
import type { AiOrchestratorBindings } from './bindings';
import { CloudflareWorkflowOrchestrationEngine } from './cloudflare-workflow-engine';
import { executableCapabilities } from './execution-runtime';
import {
  BasicOrchestrationEngine,
  type OrchestrationEngine,
} from './orchestrator';
import { providerRuntimeStatus } from './provider-runtime';
import { AiRateLimiter } from './rate-limit';
import { orchestrationRequestSchema } from './request-schema';
import { AiRunController } from './run-controller';
import { createRunEventStream } from './run-events';
import { createRunIndexStore, createRunStore } from './run-store';
import { vectorStoreStatus } from './vector-store';

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
  const vectorStore = vectorStoreStatus(c.env);
  const providers = providerRuntimeStatus(c.env);
  const executable = executableCapabilities(c.env);

  const missingProductionDependencies = [
    ...(authConfigured ? [] : ['AUTH_WORKER']),
    ...(workflowConfigured ? [] : ['AI_ORCHESTRATION_WORKFLOW']),
    ...(runStateConfigured ? [] : ['AI_RUN_STATE']),
    ...(runIndexConfigured ? [] : ['AI_RUN_INDEX']),
    ...(rateLimitConfigured ? [] : ['AI_RATE_LIMIT']),
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

  assertRunSubmissionReady(c.env, parsed.data.capability);
  await enforceRunRateLimit(c.env, principal.id);

  const engine = resolveEngine(c.env);
  const result = await engine.submit({
    ...parsed.data,
    tenantId: principal.id,
    actorId: principal.id,
  });

  return c.json(
    {
      ok: true,
      data: result,
      meta: responseMeta(c.get('apiContext')),
    },
    HttpStatus.Accepted,
  );
});

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
    });
  }
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
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
    ...(context.correlationId
      ? { correlationId: context.correlationId }
      : {}),
    timestamp: new Date().toISOString(),
  };
}

export { AiRateLimit } from './rate-limit';
export { AiRunIndex } from './run-index';
export { AiRunState } from './run-state';
export { AiOrchestrationWorkflow } from './workflow';
export default app;
