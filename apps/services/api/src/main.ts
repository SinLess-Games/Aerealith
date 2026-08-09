import { Hono } from 'hono';

const app = new Hono();

app.get('/api/V1/services/api', (c) => {
  return c.json({ service: 'api', status: 'ok' });
});

export default app;
