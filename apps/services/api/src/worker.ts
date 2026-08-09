import { Hono } from 'hono';

export interface ServiceWorkerEnvironment {
  Bindings: Record<string, unknown>;
}

const app = new Hono<{ Bindings: ServiceWorkerEnvironment['Bindings'] }>();

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

app.get('/api/v1/services/:serviceName/health', (c) => {
  const serviceName = c.req.param('serviceName');

  return c.json({
    service: serviceName,
    status: 'ok',
  });
});

export default app;
