# Auth service

The authentication service exposes the same application operations over:

- HTTP: `/api/V1/auth/*` and `/api/V1/users/me`
- GraphQL Yoga: `/graphql`
- tRPC: `/trpc/auth.*`

## Local development

Copy `.env.example` to `.env`, replace the Resend placeholder, and make sure
the configured PostgreSQL database is available. The repository includes a
local PostgreSQL service and Drizzle migrations:

```bash
pnpm nx run db:postgres-up
pnpm nx run db:postgres-migrate
pnpm nx serve service-auth
```

The service listens on `AUTH_SERVICE_PORT` (`3001` by default). The frontend
development server proxies `/api`, `/graphql`, and `/trpc` to
`AUTH_SERVICE_URL`.

## Email verification

Signup sends a branded, plain-text-backed verification email through Resend.
Only a hash of the single-use 24-hour token is stored. Configure:

- `RESEND_API_KEY`: a Resend API key
- `RESEND_FROM_EMAIL`: a sender on a verified Resend domain
- `FRONTEND_URL`: the public frontend origin used to build verification links

The HTTP operations are `POST /api/V1/auth/verify-email` and
`POST /api/V1/auth/resend-verification`; matching GraphQL mutations and tRPC
procedures are also available.

## Administrator seed migration

Create or normalize the configured verified administrator account with:

```bash
pnpm nx run db:seed-admin
```

The migration reads `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
It is idempotent, refuses ambiguous username/email collisions, and never
replaces the password of an existing account. If `ADMIN_PASSWORD` is absent
for a new account, it prints a generated password once. For local PostgreSQL,
use `pnpm nx run db:postgres-seed-admin`.

## Cloudflare Worker

The Worker uses `wrangler.toml` and the shared Cloudflare Flagship app.
`authentication` is the service-wide kill switch, `registration` controls
signup, `maintenance-mode` returns a temporary outage response, and
`observability` enables structured request telemetry.

Configure production secrets before deployment:

```bash
pnpm wrangler secret put DATABASE_URL --config apps/services/auth/wrangler.toml
pnpm wrangler secret put RESEND_API_KEY --config apps/services/auth/wrangler.toml
pnpm wrangler secret put RESEND_FROM_EMAIL --config apps/services/auth/wrangler.toml
```

Useful Nx targets:

```bash
pnpm nx run service-auth:typegen
pnpm nx run service-auth:worker-dry-run
pnpm nx run service-auth:worker-serve
pnpm nx run service-auth:deploy
```
