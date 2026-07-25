# Project Inventory

Status: Active
Owner: SinLess Games LLC
Last Updated: 2026-07-23
Document Type: Reference
Source: Resolved Nx project metadata and graph inspected in the working tree
Generation State: Manual baseline; automate through Nx

## Project Context

- [Project Overview](../Project-Overview.md)
- [Company and Project Structure](../Company-and-Project-Structure.md)
- [Current State](../CURRENT_STATE.md)
- [Documentation Index](../README.md)

## Implemented Nx Projects

| Project                | Path                       | Type            | Tags                                    | Principal targets                                     |
| ---------------------- | -------------------------- | --------------- | --------------------------------------- | ----------------------------------------------------- |
| `@aerealith-ai/source` | `.`                        | Workspace root  | None                                    | Workspace orchestration                               |
| `frontend`             | `apps/frontend`            | Application     | `scope:frontend`, `type:app`            | build, serve/dev, test, lint, typecheck, deploy, tail |
| `frontend-e2e`         | `apps/frontend-e2e`        | Application     | None                                    | e2e, lint                                             |
| `content`              | `libs/content`             | Library         | `scope:content`, `type:lib`             | build, test, lint, typecheck, translation workflows   |
| `core`                 | `libs/core`                | Library         | `npm:private`, `scope:core`, `type:lib` | build, test, lint                                     |
| `db`                   | `libs/db`                  | Library         | `npm:private`, `scope:db`, `type:lib`   | build, test, lint                                     |
| `ui`                   | `libs/ui`                  | Library         | `scope:ui`, `type:lib`                  | build, test, lint, typecheck                          |
| `utils`                | `libs/utils`               | Library         | `scope:utils`, `type:lib`               | build, test, lint                                     |
| `service-generator`    | `tools/generators/service` | Tooling library | None                                    | build, test, lint                                     |

Targets are resolved through `pnpm nx show project <name> --json`; inferred
targets do not necessarily appear in each `project.json`.

## Project Dependencies

| Source         | Direct dependency       |
| -------------- | ----------------------- |
| `frontend-e2e` | `frontend` (implicit)   |
| `frontend`     | `content`, `core`, `ui` |
| `content`      | `core`                  |
| `db`           | `core`                  |

The other resolved projects have no Nx graph dependency edges.

## Runtime and Publication Boundaries

- `frontend` is the only currently deployable application.
- `frontend-e2e` is test-only.
- All library package manifests are private; no publishable package is
  established.
- `db` owns relational persistence implementation.
- `core` owns domain entities, schemas, contracts, constants, and errors.
- `content`, `ui`, and `utils` are internal shared libraries.
- `service-generator` scaffolds future service projects but is not a service.

## Non-Project Structural Paths

| Path            | Purpose                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------- |
| `apps/services` | Destination and documentation for generated service runtimes.                                |
| `docs`          | Product, architecture, engineering, decisions, operations, releases, reference, and history. |
| `.github`       | CI, policy, security, automation, issue, pull-request, and project configuration.            |

## Accepted Planned Projects

These names represent accepted target boundaries but are not implementation
claims:

| Planned Project             | Intended Responsibility                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `apps/services/api`         | Stable API and service entry point when separation is justified. |
| `apps/integrations/discord` | Persistent Discord gateway and provider adapter runtime.         |
| `libs/api`                  | Shared transport and route helpers.                              |
| `libs/contracts`            | Provider-neutral API, event, and DTO schemas.                    |
| `libs/flags`                | Feature-flag contracts and evaluation boundaries.                |
| `libs/observability`        | Provider-neutral logging, metrics, tracing, and diagnostics.     |

## Generation Requirement

Replace this manual table with a generated inventory that includes:

```text
project
path
type
owner
runtime
tags
implicit dependencies
direct dependencies
build target
test target
deployment type
Dockerfile status
README status
```

CI should fail when the generated inventory differs from the committed
reference.
