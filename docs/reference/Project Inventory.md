# Project Inventory

Status: Active
Owner: SinLess Games LLC
Last Updated: 2026-08-08
Document Type: Reference
Source: Resolved Nx project metadata and graph inspected in the working tree
Generation State: Manual baseline; automate through Nx

## Project Context

- [Project Overview](../Project-Overview.md)
- [Company and Project Structure](../Company-and-Project-Structure.md)
- [Current State](../CURRENT_STATE.md)
- [Documentation Index](../README.md)

## Implemented Nx Projects

| Project                | Path                       | Type            | Tags                                    | Principal targets                                   |
| ---------------------- | -------------------------- | --------------- | --------------------------------------- | --------------------------------------------------- |
| `@aerealith-ai/source` | `.`                        | Workspace root  | None                                    | Workspace orchestration                             |
| `frontend`             | `apps/frontend`            | Application     | `scope:frontend`, `type:app`            | build, dev, test, lint, typecheck, deploy           |
| `frontend-e2e`         | `apps/frontend-e2e`        | Application     | None                                    | e2e, lint                                           |
| `service-api`          | `apps/services/api`        | Service         | `scope:services`, `type:service`        | build, test, lint, typegen, worker dry-run, deploy  |
| `service-auth`         | `apps/services/auth`       | Service         | `scope:services`, `type:service`        | build, test, lint, typecheck, typegen, deploy       |
| `api-platform`         | `libs/api-platform`        | Library         | `scope:api`, `type:lib`                 | build, test, lint, typecheck                        |
| `auth`                 | `libs/auth`                | Library         | `scope:auth`, `type:lib`                | build, test, lint, typecheck                        |
| `authorization`        | `libs/authorization`       | Library         | `scope:authorization`, `type:lib`       | build, test, lint                                   |
| `content`              | `libs/content`             | Library         | `scope:content`, `type:lib`             | build, test, lint, typecheck, translation workflows |
| `core`                 | `libs/core`                | Library         | `npm:private`, `scope:core`, `type:lib` | build, test, lint                                   |
| `db`                   | `libs/db`                  | Library         | `npm:private`, `scope:db`, `type:lib`   | build, test, lint                                   |
| `observability`        | `libs/observability`       | Library         | `scope:observability`, `type:lib`       | build, test, lint                                   |
| `ui`                   | `libs/ui`                  | Library         | `scope:ui`, `type:lib`                  | build, test, lint, typecheck                        |
| `utils`                | `libs/utils`               | Library         | `scope:utils`, `type:lib`               | build, test, lint                                   |
| `service-generator`    | `tools/generators/service` | Tooling library | None                                    | build, test, lint                                   |

Targets are resolved through `pnpm nx show project <name> --json`; inferred
targets do not necessarily appear in each `project.json`.

## Project Dependencies

Nx resolves dependencies from imports and project configuration. The frontend
uses the content, core, observability, and UI libraries. The auth service uses
the API platform, auth, authorization, core, database, and observability
libraries. Use `pnpm nx graph` or `pnpm nx show project <name>` for the current
resolved graph rather than maintaining a second exhaustive edge list here.

## Runtime and Publication Boundaries

- `frontend`, `service-api`, and `service-auth` are deployable Worker-oriented
  applications.
- `frontend-e2e` is test-only.
- All library package manifests are private; no publishable package is
  established.
- `db` owns relational persistence implementation.
- `core` owns domain entities, schemas, contracts, constants, and errors.
- The shared libraries are internal implementation packages.
- `service-generator` scaffolds future service projects but is not a service.

## Non-Project Structural Paths

| Path            | Purpose                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------- |
| `apps/services` | Implemented API/auth runtimes and the destination for additional generated services.         |
| `docs`          | Product, architecture, engineering, decisions, operations, releases, reference, and history. |
| `.github`       | CI, policy, security, automation, issue, pull-request, and project configuration.            |

## Accepted Planned Projects

These names represent accepted target boundaries but are not implementation
claims:

| Planned Project             | Intended Responsibility                                  |
| --------------------------- | -------------------------------------------------------- |
| `apps/integrations/discord` | Persistent Discord gateway and provider adapter runtime. |
| `libs/contracts`            | Provider-neutral API, event, and DTO schemas.            |
| `libs/flags`                | Feature-flag contracts and evaluation boundaries.        |

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
