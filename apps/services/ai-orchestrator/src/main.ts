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

import type { AiOrchestratorBindings } from './bindings';
import { CloudflareWorkflowOrchestrationEngine } from './cloudflare-workflow-engine';
import {
  BasicOrchestrationEngine,
  type OrchestrationEngine,
} from './orchestrator';
import { providerRuntimeStatus } from './provider-runtime';
import { orchestrationRequestSchema } from './request-schema';
import { createRunStore } from './run-store';
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
  const runStateConfigured = Boolean(c.env.AI_RUN_STATE);
  const vectorStore = vectorStoreStatus(c.env);
  const providers = providerRuntimeStatus(c.env);

  const missingProductionDependencies = [
    ...(workflowConfigured ? [] : ['AI_ORCHESTRATION_WORKFLOW']),
    ...(runStateConfigured ? [] : ['AI_RUN_STATE']),
    ...(providers.configuredProviders > 0 ? [] : ['AI_PROVIDER_CATALOG']),
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
          workflowConfigured,
          runStateConfigured,
          vectorStore: {
            provider: vectorStore.provider,
            configured: vectorStore.configured,
          },
          providers: {
            configured: providers.configuredProviders,
            total: providers.totalProviders,
          },
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
      workflowConfigured,
      runStateConfigured,
      vectorStore: {
        provider: vectorStore.provider,
        configured: vectorStore.configured,
      },
      providers: {
        configured: providers.configuredProviders,
        total: providers.totalProviders,
      },
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
    data: capabilityKinds,
    meta: responseMeta(c.get('apiContext')),
  }),
);

app.get('/api/V1/ai/runs/:runId', async (c) => {
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
  if (!run) {
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

app.post('/api/V1/ai/runs', async (c) => {
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

  const engine = resolveEngine(c.env);
  const result = await engine.submit(parsed.data);

  return c.json(
    {
      ok: true,
      data: result,
      meta: responseMeta(c.get('apiContext')),
    },
    HttpStatus.Accepted,
  );
});

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

export { AiRunState } from './run-state';
export { AiOrchestrationWorkflow } from './workflow';
export default app;
