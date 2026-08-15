# Auth service

The authentication service exposes the same application operations over:

- HTTP: `/api/V1/auth/*` and `/api/V1/users/me`
- GraphQL Yoga: `/graphql`
- tRPC: `/trpc/auth.*`

## Local development

Frontend development starts a local auth Worker. Wrangler requires
`DATABASE_URL` from the ignored root `.env` through `wrangler.local.toml`.
`RESEND_API_KEY` is optional for existing-account login; when unavailable,
email delivery becomes a no-op without logging verification or reset tokens.
Deployed preview and production Workers continue to resolve configured
bindings through Cloudflare Secrets Store.

`wrangler.local.toml` explicitly enables registration for local development.
That flag changes signup availability only; login and sessions remain backed
by the configured database.

```bash
pnpm dev
```

Vite proxies `/api`, `/graphql`, and `/trpc` to the local Worker on port 8787.
Use `pnpm nx run service-auth:deploy-preview` only when updating the deployed
preview Worker.

## Email verification

Signup sends a branded, plain-text-backed verification email through Resend.
Only a hash of the single-use 24-hour token is stored. Configure:

- `RESEND_API_KEY`: a Resend API key
- `RESEND_FROM_EMAIL`: a sender on a verified Resend domain
- `FRONTEND_URL`: the public frontend origin used to build verification links

The HTTP operations are `POST /api/V1/auth/verify-email` and
`POST /api/V1/auth/resend-verification`; matching GraphQL mutations and tRPC
procedures are also available.

## Grafana observability

The Node service initializes observability before loading Hono so automatic
HTTP instrumentation can attach correctly. It exports:

- Structured logs directly to Grafana Loki.
- Metrics and distributed traces through the Grafana Cloud OTLP gateway.
- Process uptime and memory metrics.
- Route-aware request rate, error, duration, and active-request metrics.
- Auth operation outcomes and latency across HTTP, GraphQL, and tRPC.
- Trace/span correlation on structured request logs.
- PostgreSQL-backed readiness at `/ready`; `/health` remains process liveness.
- Continuous wall/CPU profiles through Grafana Cloud Profiles.

Configure the `OTEL_*`, `LOKI_*`, and `PYROSCOPE_*` variables documented in
`.env.example`. Tokens and completed authorization headers belong only in
`.env`, deployment secrets, or a secret manager. Shutdown handlers flush
telemetry and profiles before the process exits.

Import `ops/observability/grafana/auth-overview.dashboard.json`, load
`ops/observability/grafana/auth-alerts.yaml` through your metrics rule
deployment, and publish the linked runbook before enabling alert notifications.

## Super-administrator seed

Create or normalize the configured verified super-administrator account with:

```bash
pnpm nx run db:seed-admin
```

The seed reads `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
It is idempotent, refuses ambiguous username/email collisions, and refreshes
the bootstrap account password to the explicitly configured development
password. The normalized `platform-owner` assignment is authoritative;
`users.role = super_admin` is maintained only as a frontend compatibility
projection.

## Cloudflare Worker

The Worker uses `wrangler.toml` and the shared Cloudflare Flagship app.
`authentication` is the service-wide kill switch, `registration` controls
signup, `maintenance-mode` returns a temporary outage response, and
`observability` enables structured request telemetry.

The Wrangler environments bind account-level Cloudflare secrets:

- Production: `PRODUCTION_POSTGRES_URL` maps to `DATABASE_URL`
- Preview: `PREVIEW_POSTGRES_URL` maps to `DATABASE_URL`
- Both environments: `RESEND_API_KEY` maps to `RESEND_API_KEY`

Useful Nx targets:

```bash
pnpm nx run service-auth:typegen
pnpm nx run service-auth:worker-dry-run
pnpm nx run service-auth:worker-serve
pnpm nx run service-auth:deploy-preview
pnpm nx run service-auth:deploy
```
