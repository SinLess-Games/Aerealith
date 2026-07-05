import { Hono } from 'hono';

const app = new Hono();

app.get('<%= routePrefix %>', (c) => {
  return c.json({ service: '<%= serviceName %>', status: 'ok' });
});

export default app;
