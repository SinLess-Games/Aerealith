# Service Generator

Status: Active
Owner: Developer Experience
Last Updated: 2026-07-15
Project Type: Nx generator package
Runtime: Node.js and TypeScript
Nx Project: `service-generator`
Package: `@aerealith-ai/service-generator`
Generator: `service`

## Purpose

This generator creates a Hono-based service under `apps/services/` with a
consistent Nx project structure.

## Usage

```bash
pnpm nx g @aerealith-ai/service-generator:service <service-name>
```

Inspect options before generating:

```bash
pnpm nx g @aerealith-ai/service-generator:service --help
```

## Generated-Service Expectations

Generated output is a starting point, not automatic architectural approval.

Before merge, a new service must have:

- One clear responsibility and owner.
- Correct Nx tags and dependency boundaries.
- Typed configuration.
- Tests.
- Health and readiness behavior.
- Logging and correlation.
- Dockerfile when independently deployable.
- Project-local README.
- Related architecture and decision links.

## Development

```bash
pnpm nx build service-generator
pnpm nx lint service-generator
pnpm nx typecheck service-generator
pnpm nx test service-generator
```

## Change Requirements

Generator changes must include fixture or snapshot coverage proving that
generated projects remain valid, formatted, and buildable.
