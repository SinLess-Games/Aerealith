# Applications

Status: Active
Owner: SinLess Games LLC
Last Updated: 2026-07-15
Document Type: Project Index

## Purpose

`apps/` contains runnable, deployable, or user-facing entry points.

Deployable behavior belongs in an application. Reusable behavior belongs in a
library. Provider-specific persistent runtimes belong under
`apps/integrations/` when created.

## Current Applications

| Project        | Path                | Responsibility                                                           |
| -------------- | ------------------- | ------------------------------------------------------------------------ |
| `frontend`     | `apps/frontend`     | Public, authenticated, documentation, and developer-facing web surfaces. |
| `frontend-e2e` | `apps/frontend-e2e` | Browser and end-to-end validation.                                       |

`apps/services/` currently defines service conventions and the destination used
by the service generator.

## Application Contract

Every application must provide:

- One clear responsibility and owner.
- Runtime and deployment model.
- Nx project metadata and architectural tags.
- Typed configuration and secret ownership.
- Development, lint, typecheck, test, build, and deployment commands.
- Health and readiness behavior when independently deployable.
- A Dockerfile when independently deployable.
- A project-local README.
- Links to related architecture and decisions.
