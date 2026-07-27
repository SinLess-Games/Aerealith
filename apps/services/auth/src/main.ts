import { Hono } from 'hono'

const app = new Hono()

app.get('/api/v1/services/auth', (c) => {
  return c.json({ service: 'auth', status: 'ok' })
})

export default app
