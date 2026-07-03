// apps/frontend/src/worker.ts
//
// Cloudflare Worker entry point for the Aerealith frontend.
//
// The Worker serves the Vite-generated frontend assets through Cloudflare
// Workers Assets. React Router client-side routes are handled by the
// single-page-application fallback configured in wrangler.toml.

export interface FrontendWorkerEnvironment {
  ASSETS: {
    fetch(request: Request): Promise<Response>
  }
}

const HealthPath = '/__aerealith/health'

export default {
  async fetch(
    request: Request,
    environment: FrontendWorkerEnvironment,
  ): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === HealthPath) {
      return Response.json(
        {
          status: 'ok',
        },
        {
          headers: {
            'cache-control': 'no-store',
          },
        },
      )
    }

    return environment.ASSETS.fetch(request)
  },
}
