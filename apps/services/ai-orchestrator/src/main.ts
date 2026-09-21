import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { z } from 'zod';

import { capabilityKinds } from './domain';
import { BasicOrchestrationEngine } from './orchestrator';

type Bindings = {
  ENVIRONMENT?: string;
};

const app = new Hono<{ Bindings: Bindings }>();
const engine = new BasicOrchestrationEngine();

const requestSchema = z.object({
  capability: z.enum(capabilityKinds),
  input: z.unknown(),
  model: z.string().min(1).optional(),
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
