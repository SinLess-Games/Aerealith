# Project Inventory

Status: Active
Owner: SinLess Games LLC
Last Updated: 2026-07-15
Document Type: Reference
Source: Nx project metadata inspected on the `master` branch
Generation State: Manual baseline; automate through Nx

## Project Context

- [Project Overview](../Project-Overview.md)
- [Company and Project Structure](../Company-and-Project-Structure.md)
- [Current State](../CURRENT_STATE.md)
- [Documentation Index](../README.md)

## Implemented Nx Projects

| Project             | Path                       | Type            | Tags                         | Key Targets                                      |
| ------------------- | -------------------------- | --------------- | ---------------------------- | ------------------------------------------------ |
| `frontend`          | `apps/frontend`            | Application     | `scope:frontend`, `type:app` | Nx-inferred frontend targets                     |
| `frontend-e2e`      | `apps/frontend-e2e`        | Application     | No explicit tags             | End-to-end testing                               |
| `content`           | `libs/content`             | Library         | `scope:content`, `type:lib`  | Build, typecheck, translation, locale generation |
| `core`              | `libs/core`                | Library         | `scope:core`, `type:lib`     | Build                                            |
| `db`                | `libs/db`                  | Library         | `scope:db`, `type:lib`       | Build                                            |
| `ui`                | `libs/ui`                  | Library         | `scope:ui`, `type:lib`       | Nx-inferred library targets                      |
| `utils`             | `libs/utils`               | Library         | `scope:utils`, `type:lib`    | Build                                            |
| `service-generator` | `tools/generators/service` | Tooling library | Generator/tooling scope      | Build and tests                                  |

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
