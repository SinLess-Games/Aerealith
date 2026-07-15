import { AuthService, createApiApp, KvRateLimitStore } from '@aerealith-ai/api'
import {
  createPostgresAuthStores,
  createWorkersDatabaseConnection,
  type DatabaseClient,
} from '@aerealith-ai/db'

// A per-request Postgres client, opened over Hyperdrive in `fetch` and injected
// into the request env for the auth routes to resolve. It is not a Cloudflare
// binding, so it is optional and only present on the auth path.
type ApiEnv = Env & { readonly DB_CLIENT?: DatabaseClient }

// The `/api/V1` surface is served by the same Worker that serves the SPA
// assets. Split it into its own Worker only when load or ownership demands it.
const api = createApiApp<ApiEnv>({
  serviceName: 'aerealith',
  auth: {
    resolveAuthService: (env) => {
      if (!env.DB_CLIENT) {
        throw new Error('Database client is unavailable for the auth route.')
      }
      return new AuthService(createPostgresAuthStores(env.DB_CLIENT))
    },
    // Throttle auth routes: 10 requests per minute per client IP, via KV.
    rateLimit: {
      resolveStore: (env) => new KvRateLimitStore(env.AEREALITH_KV),
      limit: 10,
      windowSeconds: 60,
    },
  },
})

// Only the auth routes touch the database; health and the rest do not, so we
// avoid opening a Hyperdrive connection for them.
const AUTH_PATH_PREFIX = '/api/V1/auth'

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      if (url.pathname.startsWith(AUTH_PATH_PREFIX)) {
        const db = createWorkersDatabaseConnection(env.HYPERDRIVE)
        try {
          return await api.fetch(request, { ...env, DB_CLIENT: db.client }, ctx)
        } finally {
          // Close after the response is sent, not before it is used.
          ctx.waitUntil(db.close())
        }
      }

      return api.fetch(request, env, ctx)
    }

    if (url.pathname === '/__aerealith/health') {
      return Response.json({ status: 'ok' })
    }

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
