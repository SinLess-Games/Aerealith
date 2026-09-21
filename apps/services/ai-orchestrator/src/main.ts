import { capabilityKinds } from '@aerealith-ai/ai-orchestration';
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { z } from 'zod';

import { BasicOrchestrationEngine } from './orchestrator';

type Bindings = {
  ENVIRONMENT?: string;
};

const app = new Hono<{ Bindings: Bindings }>();
const engine = new BasicOrchestrationEngine();

const requestSchema = z.object({
  capability: z.enum(capabilityKinds),
  input: z.unknown(),
  tenantId: z.string().min(1).optional(),
  actorId: z.string().min(1).optional(),
  priority: z.enum(['interactive', 'background', 'batch']).optional(),
  preferences: z
    .object({
      provider: z.string().min(1).optional(),
      model: z.string().min(1).optional(),
      allowFallback: z.boolean().optional(),
      maxCostUsd: z.number().nonnegative().optional(),
      maxLatencyMs: z.number().int().positive().optional(),
    })
    .optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

app.use('*', secureHeaders());

app.get('/health', (c) =>
  c.json({
    service: 'ai-orchestrator',
    status: 'ok',
    environment: c.env.ENVIRONMENT ?? 'development',
  }),
);

app.get('/api/V1/services/ai-orchestrator', (c) =>
  c.json({
    service: 'ai-orchestrator',
    status: 'ok',
    capabilities: capabilityKinds,
  }),
);

app.get('/api/V1/ai/capabilities', (c) =>
  c.json({
    ok: true,
    data: capabilityKinds,
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
      },
      422,
    );
  }

  const result = await engine.submit(parsed.data);
  return c.json({ ok: true, data: result }, 202);
});

app.onError((error, c) => {
  console.error('AI orchestration request failed.', error);
  return c.json(
    {
      ok: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'The orchestration request could not be completed.',
      },
    },
    500,
  );
});

export default app;
