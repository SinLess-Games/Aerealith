# Service worker pattern

Use this directory for Cloudflare Workers that are deployed independently from the frontend.

## Recommended structure

Each service should live in its own folder under this directory, for example:

- apps/services/auth
- apps/services/email
- apps/services/payments

Each service should include:

- a Wrangler config at apps/services/<service>/wrangler.toml
- a Worker entrypoint at apps/services/<service>/src/worker.ts

## Quick start

Create a new service from the shared template:

```bash
pnpm services:new <service-name>
```

Then customize the generated Worker and bindings, and deploy it with:

```bash
pnpm exec wrangler deploy --config apps/services/<service-name>/wrangler.toml
```
