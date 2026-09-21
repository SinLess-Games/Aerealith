import { capabilityKinds } from '@aerealith-ai/ai-orchestration';
import { Hono, type Context } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { z } from 'zod';

import type { AiOrchestratorBindings } from './bindings';
import { CloudflareWorkflowOrchestrationEngine } from './cloudflare-workflow-engine';
import {
  BasicOrchestrationEngine,
  type OrchestrationEngine,
} from './orchestrator';

type Variables = {
  requestId: string;
};

type Environment = {
  Bindings: AiOrchestratorBindings;
  Variables: Variables;
};

const app = new Hono<Environment>();

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

app.use('*', secureHeaders());
app.use('*', async (c, next) => {
  const requestId = normalizeRequestId(c.req.header('x-request-id'));
  c.set('requestId', requestId);

  await next();

  c.header('x-request-id', requestId);
});

app.get('/health', (c) =>
  c.json({
    service: 'ai-orchestrator',
    status: 'ok',
    environment: c.env.ENVIRONMENT ?? 'development',
    meta: responseMeta(c),
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
        meta: responseMeta(c),
      },
      503,
    );
  }

  return c.json({
    service: 'ai-orchestrator',
    status: 'ready',
    workflowConfigured,
    meta: responseMeta(c),
  });
});

app.get('/api/V1/services/ai-orchestrator', (c) =>
  c.json({
    service: 'ai-orchestrator',
    status: 'ok',
    capabilities: capabilityKinds,
    meta: responseMeta(c),
  }),
);

app.get('/api/V1/ai/capabilities', (c) =>
  c.json({
    ok: true,
    data: capabilityKinds,
    meta: responseMeta(c),
  }),
);

app.post('/api/V1/ai/runs', async (c) => {
  const body = await c.req.json().catch(() => undefined);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'The orchestration request is invalid.',
          details: parsed.error.issues,
        },
        meta: responseMeta(c),
      },
      422,
    );
  }

  const engine = resolveEngine(c.env);
  const result = await engine.submit(parsed.data);

  return c.json(
    {
      ok: true,
      data: result,
      meta: responseMeta(c),
    },
    202,
  );
});

app.onError((error, c) => {
  console.error(
    JSON.stringify({
      level: 'error',
      service: 'ai-orchestrator',
      requestId: c.get('requestId'),
      message: 'AI orchestration request failed.',
      error: error instanceof Error ? error.message : String(error),
    }),
  );

  return c.json(
    {
      ok: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'The orchestration request could not be completed.',
      },
      meta: responseMeta(c),
    },
    500,
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

function responseMeta(c: Context<Environment>) {
  return {
    requestId: c.get('requestId'),
    timestamp: new Date().toISOString(),
  };
}

function normalizeRequestId(value: string | undefined): string {
  if (value && /^[A-Za-z0-9._:-]{1,128}$/.test(value)) {
    return value;
  }

  return crypto.randomUUID();
}

export { AiOrchestrationWorkflow } from './workflow';
export default app;
