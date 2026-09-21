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

const metadataSchema = z
  .record(z.string().max(64), z.string().max(512))
  .refine((value) => Object.keys(value).length <= 32, {
    message: 'metadata may contain at most 32 entries.',
  });

const requestSchema = z.object({
  capability: z.enum(capabilityKinds),
  input: z.unknown(),
  priority: z.enum(['interactive', 'background', 'batch']).optional(),
  preferences: z
    .object({
      provider: z.string().min(1).max(128).optional(),
      model: z.string().min(1).max(256).optional(),
      allowFallback: z.boolean().optional(),
      maxCostUsd: z.number().nonnegative().finite().optional(),
      maxLatencyMs: z.number().int().positive().max(3_600_000).optional(),
    })
    .optional(),
  metadata: metadataSchema.optional(),
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

  if (environment === 'production' && !workflowConfigured) {
    return c.json(
      {
        service: 'ai-orchestrator',
        status: 'not_ready',
        reason: 'AI_ORCHESTRATION_WORKFLOW binding is required in production.',
        meta: responseMeta(c.get('apiContext')),
      },
      HttpStatus.ServiceUnavailable,
    );
  }

  return c.json({
    service: 'ai-orchestrator',
    status: 'ready',
    workflowConfigured,
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

app.get('/api/V1/ai/capabilities', (c) =>
  c.json({
    ok: true,
    data: capabilityKinds,
    meta: responseMeta(c.get('apiContext')),
  }),
);

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

  const parsed = requestSchema.safeParse(body);
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
  if (bindings.AI_ORCHESTRATION_WORKFLOW) {
    return new CloudflareWorkflowOrchestrationEngine(
      bindings.AI_ORCHESTRATION_WORKFLOW,
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

export { AiOrchestrationWorkflow } from './workflow';
export default app;
