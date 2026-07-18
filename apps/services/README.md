# Services

Status: Active
Owner: Platform Engineering
Last Updated: 2026-07-15
Document Type: Application Pattern
Runtime: Hono-based Cloudflare-compatible services and workers

## Purpose

Use this directory for independently deployed platform services, workers,
scheduled jobs, and HTTP entry points.

A directory existing under `apps/services/` does not automatically mean a
production service is implemented.

## Generate a Service

Use the workspace generator:

```bash
pnpm nx g @aerealith-ai/service-generator:service <service-name>
```

Inspect generator options before use:

```bash
pnpm nx g @aerealith-ai/service-generator:service --help
```

Do not use the undocumented `pnpm services:new` command.

## Required Service Structure

A generated and accepted service must include:

```text
apps/services/<service-name>/
├── src/
├── project.json
├── tsconfig.json
├── wrangler.toml              when Cloudflare-deployed
├── Dockerfile                 when independently deployable
└── README.md
```

## Service Contract

Every service must document:

- Purpose and owner.
- Runtime and deployment model.
- Public routes, events, and contracts.
- Allowed dependencies.
- Data ownership.
- Configuration and secrets.
- Health, readiness, and graceful shutdown.
- Retry, timeout, idempotency, and failure behavior.
- Logging, metrics, traces, request IDs, and trace IDs.
- Development, testing, build, and deployment commands.
- Rollback behavior.

## Boundaries

- Services compose application behavior.
- Domain and reusable behavior belong in libraries.
- Provider SDKs remain inside provider adapters.
- Services do not import another service's internal source.
- External input is validated before use.
- Meaningful actions follow permission, risk, approval, and audit rules.
