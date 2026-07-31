# Auth service

The authentication service exposes the same application operations over:

- HTTP: `/api/V1/auth/*` and `/api/V1/users/me`
- GraphQL Yoga: `/graphql`
- tRPC: `/trpc/auth.*`

## Local development

Frontend development uses the deployed `aerealith-auth-preview` Worker. Its
`DATABASE_URL` binding resolves to the Cloudflare Secrets Store
`PREVIEW_POSTGRES_URL`; the credential is never copied into the repository or
a local process.

```bash
pnpm nx run service-auth:deploy-preview
pnpm dev
```

Vite proxies `/api`, `/graphql`, and `/trpc` to the preview Worker.

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
for a new account, it prints a generated password once. Run the seed through an
authorized environment with `DATABASE_URL` injected.

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
