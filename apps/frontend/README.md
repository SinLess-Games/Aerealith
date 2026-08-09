# Frontend

Status: Active
Owner: Frontend Platform
Last Updated: 2026-07-15
Project Type: Nx application
Runtime: React, Vite, TypeScript, Cloudflare-compatible web runtime
Nx Project: `frontend`

## Purpose

The frontend owns Aerealith web experiences, including the public site,
authenticated application, documentation surface, and developer-facing portal
shell.

It presents platform state and prepares user actions. It does not own server
authorization, provider credentials, audit creation, Discord action authority,
or workflow execution.

## Responsibilities

- Public product and trust pages.
- Authentication entry and account-facing surfaces.
- Dashboard shell and navigation.
- Module and integration configuration interfaces.
- Assistant presentation and approval prompts.
- Audit-log and operational visibility.
- Documentation and developer portal web surfaces.
- Accessibility, responsive behavior, themes, and frontend telemetry.

## Boundaries

The frontend may depend on shared UI, content, contract, and runtime-neutral
libraries through public entry points.

The frontend must not:

- Import database implementations.
- Treat hidden UI controls as authorization.
- Store server or provider secrets.
- Execute privileged Discord actions directly.
- Create authoritative audit records.
- Trust unvalidated provider or AI output.

## Development

```bash
pnpm dev
pnpm nx lint frontend
pnpm nx typecheck frontend
pnpm nx test frontend
pnpm nx build frontend
```

`pnpm dev` (and the equivalent `pnpm nx dev frontend`) starts Vite and proxies
authentication requests to the deployed `aerealith-auth-preview` Worker. That
Worker uses the Cloudflare Secrets Store `PREVIEW_POSTGRES_URL` binding, so
local development does not require Docker or a local PostgreSQL instance.

Deploy preview auth changes with:

```bash
pnpm nx run service-auth:deploy-preview
```

Use `pnpm nx show project frontend` to inspect inferred targets before assuming
a command exists.

## End-to-End Tests

```bash
pnpm nx e2e frontend-e2e
```

## Configuration

Public browser variables must be explicitly classified and safe to expose.
Server-only secrets must never be included in the client bundle.

## Verification

A frontend change is complete when:

- Lint, typecheck, tests, and build pass.
- Relevant Playwright coverage passes.
- Accessibility checks pass.
- Signed-in and signed-out route behavior is tested.
- Server authorization rejects forged client requests.
- Frontend telemetry contains no secrets or unnecessary personal data.

## Related Documentation

- `docs/architecture/Frontend Architecture.md`
- `docs/architecture/Current Architecture.md`
- `docs/product/Dashboard.md`
- `docs/product/AI Assistant.md`
- `docs/engineering/Testing.md`
- `docs/engineering/Environment Variables.md`
