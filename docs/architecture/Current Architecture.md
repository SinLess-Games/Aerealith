# Current Architecture

Status: Active
Owner: SinLess Games LLC
Last Updated: 2026-07-15
Document Type: Architecture
Implementation State: Current repository truth

## Purpose

This document describes only architecture that is present in the repository.
It is the bridge between the repository and the broader target architecture
described by the other architecture documents.

When this document conflicts with a target-state diagram, this document wins for
questions about what exists today. Accepted decisions still govern what new work
must converge toward.

## Current Repository Model

Aerealith is an Nx and pnpm TypeScript monorepo.

```text
apps/
├── frontend/
├── frontend-e2e/
└── services/             Service pattern and generator destination

libs/
├── content/
├── core/
├── db/
├── ui/
└── utils/

tools/
└── generators/
    └── service/

docs/
├── vision/
├── product/
├── architecture/
├── engineering/
├── decisions/
├── operations/
├── releases/
├── reference/
└── archive/
```

## Implemented Applications

| Project        | Path                | Type             | Current Responsibility                                                                    |
| -------------- | ------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `frontend`     | `apps/frontend`     | Application      | Public site, authenticated application, documentation, and developer-facing web surfaces. |
| `frontend-e2e` | `apps/frontend-e2e` | Test application | Playwright end-to-end validation for the frontend.                                        |

## Implemented Libraries

| Project   | Path           | Current Responsibility                                                                     |
| --------- | -------------- | ------------------------------------------------------------------------------------------ |
| `content` | `libs/content` | Structured product copy, localization source, translation workflow, and generated locales. |
| `core`    | `libs/core`    | Runtime-neutral primitives and foundational shared behavior.                               |
| `db`      | `libs/db`      | Drizzle schemas, database access foundations, migrations, and persistence mapping.         |
| `ui`      | `libs/ui`      | Reusable interface primitives and design-system components.                                |
| `utils`   | `libs/utils`   | General-purpose utilities that do not belong to a narrower domain.                         |

## Current Tooling

| Tool                       | Role                                                        |
| -------------------------- | ----------------------------------------------------------- |
| Node.js `26.5.0`           | Repository-pinned JavaScript and TypeScript runtime.        |
| pnpm `11.13.1`             | Package and workspace manager.                              |
| Nx                         | Project graph, task orchestration, caching, and generators. |
| TypeScript                 | Primary application language.                               |
| Vite and React             | Frontend runtime and build system.                          |
| React Router               | Client-side routing.                                        |
| Tailwind CSS               | Styling system.                                             |
| Vitest                     | Unit and integration tests.                                 |
| Playwright                 | Browser and end-to-end tests.                               |
| Drizzle ORM and PostgreSQL | Current relational data stack.                              |
| Hono                       | Lightweight API and Worker framework.                       |
| Cloudflare                 | Current edge and deployment platform.                       |
| Tanstack                   | Query and state management.                                 |

Exact versions remain controlled by `package.json`, the lockfile, and runtime
pin files.

## Service State

`apps/services/` currently defines the destination and pattern for independently
deployed services. It is not evidence that every planned service exists.

The service generator lives at:

```text
tools/generators/service
```

A generated service must still provide:

- One clear responsibility.
- An Nx project definition.
- A runtime entry point.
- Typed configuration.
- Health and readiness behavior.
- Tests.
- A Dockerfile when independently deployable.
- A project-local README.
- Related architecture and decision links.

## Planned but Not Yet Implemented as Projects

The accepted target architecture includes projects such as:

```text
apps/services/api
apps/integrations/discord
libs/api
libs/contracts
libs/flags
libs/observability
```

These paths are planned boundaries, not current implementation claims.

## Current Deployment Shape

The frontend is Cloudflare-oriented. Independently deployable services remain
Docker-required by policy even when their primary managed deployment does not
use Docker.

The MVP target remains deliberately small:

1. A combined frontend and API Worker where practical.
2. A persistent Discord bot runtime.

Additional deployables require an explicit operational reason.

## Current Data Direction

PostgreSQL is the default relational database. Drizzle ORM owns typed schemas,
queries, and migrations. CockroachDB compatibility is an accepted future
deployment goal and must be validated rather than assumed.

Domain and contract types must not expose persistence rows or ORM-specific
types.

## Current Trust Boundaries

Meaningful actions are expected to pass through:

```text
authenticate
→ authorize Aerealith scope
→ verify provider permissions
→ evaluate risk
→ obtain required approval
→ execute
→ publish events
→ write audit records
→ notify
```

Some platform components needed to implement the full flow remain planned. The
flow is nevertheless an accepted architectural constraint for new work.

## Evidence Sources

Current implementation must be verified against:

- `package.json`
- `.node-version`
- `pnpm-workspace.yaml`
- `nx.json`
- project-level `project.json` files
- source entry points
- committed deployment configuration
- CI workflows
- generated project inventory

## Update Rule

Update this document whenever a project is created, removed, renamed, changes
runtime, changes ownership, or becomes independently deployable.
