# 0.1 — Foundation & Workspace Release

Release `0.1 — Foundation & Workspace` establishes the baseline repository, tooling, workspace structure, documentation structure, and development standards for Aerealith.

This release does not ship user-facing product features.

It creates the foundation that every later release depends on.

---

## Purpose

The purpose of this release is to make the Aerealith repository predictable, buildable, documented, and ready for serious development.

Aerealith is planned as a modular AI platform with:

- a web dashboard
- Discord platform features
- AI assistant capabilities
- workflows and automation
- integrations
- modules
- developer APIs
- observability
- future marketplace support
- future self-hosting

Before those systems can be built safely, the project needs a clean workspace foundation.

---

## Release Goal

The goal of release `0.1` is:

> Create a stable monorepo foundation that developers can install, inspect, lint, format, typecheck, build, document, and extend without confusion.

This release should answer:

```text
Where does code live?
Where do docs live?
How do we install dependencies?
How do we run checks?
How do we format code?
How do we lint code?
How do we build the workspace?
How do libraries depend on each other?
How do future releases build on this?
```

---

## What This Release Proves

Release `0.1` proves that:

- the repository has a stable structure
- the workspace can install dependencies
- the workspace has predictable scripts
- TypeScript is configured
- formatting is configured
- linting is configured
- documentation has a clear home
- release docs have a clear format
- apps and libraries have initial boundaries
- future releases have a safe foundation

This release is successful when the project stops feeling like “a pile of files” and starts feeling like a real platform workspace.

---

## Included Scope

---

## Workspace Foundation

Release `0.1` includes:

```text
Nx workspace foundation
pnpm workspace foundation
Node version standard
TypeScript foundation
Root package scripts
Workspace configuration
Project naming conventions
Base folder structure
```

Expected root-level workspace files may include:

```text
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
nx.json
tsconfig.base.json
eslint.config.*
prettier.config.*
commitlint.config.*
README.md
```

Exact filenames may vary based on tooling choices, but the workspace should be understandable and repeatable.

---

## Package Manager

Aerealith should use:

```text
pnpm
```

Release `0.1` should make dependency installation predictable.

Expected command:

```bash
pnpm install
```

---

## Monorepo Tooling

Aerealith should use:

```text
Nx
```

Nx should provide the foundation for:

- apps
- libraries
- tasks
- dependency graph
- build orchestration
- affected commands later
- CI optimization later
- workspace consistency

Nx Cloud and daemon support may be enabled or prepared according to project needs.

---

## Runtime Standard

Aerealith should standardize around:

```text
Node 24.x
```

Release `0.1` should document or enforce the expected Node version.

Possible files:

```text
.node-version
.nvmrc
package.json engines
```

---

## TypeScript Foundation

Release `0.1` includes TypeScript configuration.

The project should define:

- root TypeScript settings
- library/app TypeScript inheritance
- path aliases where appropriate
- strict typing expectations
- typecheck command

Expected command:

```bash
pnpm typecheck
```

---

## Code Quality Foundation

Release `0.1` includes basic code quality tools.

Required tools:

```text
ESLint
Prettier
Commitlint
```

The project should support:

```bash
pnpm lint
pnpm format
```

Optional but useful commands:

```bash
pnpm format:check
pnpm lint:fix
```

---

## Testing Foundation

Release `0.1` should prepare testing standards even if test coverage is still minimal.

Expected test tool:

```text
Vitest
```

Expected command:

```bash
pnpm test
```

Release `0.1` does not need deep product tests.

It should establish the test command and basic testing expectations.

---

## Build Foundation

Release `0.1` should define how the workspace builds.

Expected command:

```bash
pnpm build
```

If some apps/services are still placeholders, the build path should be documented clearly.

---

## Repository Structure

Release `0.1` should establish the first stable version of the repository structure.

Recommended structure:

```text
apps/
├── frontend/
└── api/

libs/
├── api/
├── content/
├── contracts/
├── core/
├── db/
├── flags/
├── observability/
└── ui/

docs/
├── README.md
├── vision/
├── product/
├── releases/
├── architecture/
├── engineering/
├── services/
├── modules/
├── integrations/
├── api/
├── operations/
└── rfcs/
```

The structure may evolve, but changes should be intentional.

---

## Apps

Apps are deployable or user-facing applications.

Initial app expectations:

| App             | Purpose                                                  |
| --------------- | -------------------------------------------------------- |
| `apps/frontend` | Main Aerealith web/dashboard frontend.                   |
| `apps/api`      | API or service entrypoint foundation if used separately. |

The exact app model may evolve as Cloudflare Worker architecture becomes clearer.

---

## Libraries

Libraries contain shared code.

Initial library expectations:

| Library              | Purpose                                                                         |
| -------------------- | ------------------------------------------------------------------------------- |
| `libs/core`          | Shared constants, errors, utility functions, primitive types, base logic.       |
| `libs/contracts`     | Shared contracts, DTOs, schemas, and API boundaries.                            |
| `libs/api`           | API helpers, routing utilities, middleware foundations, service-facing helpers. |
| `libs/db`            | Database entities, schemas, migrations, and data access foundations.            |
| `libs/ui`            | Shared frontend UI components and design system foundations.                    |
| `libs/content`       | Shared content, copy, docs/content helpers, and structured content foundations. |
| `libs/flags`         | Feature flag helpers and configuration boundaries.                              |
| `libs/observability` | Logging, metrics, tracing, and diagnostics helpers.                             |

---

## Library Dependency Rule

The default library dependency rule is:

```text
libs/* may depend on libs/core only.
```

Cross-library dependencies should be avoided unless explicitly allowed.

This prevents dependency spaghetti early.

Examples:

```text
libs/api -> libs/core is allowed.
libs/db -> libs/core is allowed.
libs/ui -> libs/core is allowed.
libs/api -> libs/db should not happen by default.
libs/ui -> libs/api should not happen by default.
```

Exceptions should be documented in architecture or engineering docs.

---

## Documentation Scope

Release `0.1` includes documentation foundations.

Required documentation areas:

```text
docs/README.md
docs/vision/
docs/product/
docs/releases/
docs/releases/README.md
docs/releases/0.1/
```

Release `0.1` should establish docs as part of the product.

Documentation should be:

- easy to navigate
- written in Markdown
- structured by topic
- version-aware where appropriate
- useful to future contributors
- aligned with the product roadmap

---

## Release Documentation

Release `0.1` should include:

```text
docs/releases/0.1/README.md
docs/releases/0.1/Release.md
docs/releases/0.1/Features.md
docs/releases/0.1/Architecture Changes.md
docs/releases/0.1/Tasks.md
docs/releases/0.1/Testing.md
docs/releases/0.1/Checklist.md
docs/releases/0.1/Breaking Changes.md
```

---

## Docker Scope

Full self-hosting is not part of release `0.1`.

However, release `0.1` should establish Docker expectations.

Expected direction:

```text
Every deployable app/service should eventually have a Dockerfile.
```

Release `0.1` may include:

- Docker planning notes
- initial Dockerfile placeholders
- documentation expectations
- deployment boundary notes

Release `0.1` does not require:

- full Docker Compose
- production self-hosting
- self-hosted installer
- provider replacement dashboard
- backup/restore system

---

## CI Scope

Release `0.1` should prepare the project for CI.

A basic CI flow should eventually verify:

```text
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Release `0.1` may include an initial CI workflow or at least document the expected CI path.

Full deployment automation can come later.

---

## Explicitly Out of Scope

Release `0.1` should not include major product features.

The following are out of scope:

```text
User authentication implementation
Production user accounts
Discord bot feature implementation
Discord moderation implementation
Ticket system implementation
AI assistant behavior
Memory system implementation
Workflow automation implementation
Marketplace implementation
Billing implementation
Advanced integrations
Database-heavy product behavior
Production observability system
Mobile app
Desktop app
Browser extension
Full self-hosting
Public launch
```

Some placeholders, folders, stubs, or planning docs may exist, but full product implementation belongs to later releases.

---

## Product Requirements

Release `0.1` has minimal direct product requirements.

The product requirement is:

> The repository foundation should make future product work easier, safer, and more predictable.

Product-facing work in this release may include:

- product documentation structure
- release documentation
- project README
- basic product language
- roadmap alignment
- MVP scope alignment

No end-user product flow is required in this release.

---

## Engineering Requirements

Release `0.1` should establish the engineering baseline.

Required engineering outcomes:

```text
Workspace installs successfully.
Workspace structure is clear.
Base scripts are defined.
TypeScript is configured.
Linting is configured.
Formatting is configured.
Testing command exists.
Build command exists or build path is documented.
Core library boundaries are documented.
Apps and libs are organized.
Docs are organized.
Release docs exist.
```

---

## Required Commands

The workspace should support or document these commands:

```bash
pnpm install
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm build
```

Optional helpful commands:

```bash
pnpm clean
pnpm graph
pnpm affected
pnpm format:check
pnpm lint:fix
```

---

## Trust Requirements

Release `0.1` is mostly technical, but it still supports trust.

Trust requirements for this release:

```text
Project structure is understandable.
Development commands are documented.
Tooling is consistent.
Code quality checks exist.
Documentation is easy to find.
Release scope is explicit.
Future risky features are not hidden inside this release.
```

A clean foundation is part of trust.

If the project is chaotic internally, it will become harder to build trustworthy product behavior later.

---

## Observability Requirements

Release `0.1` does not require full observability.

It should prepare for future observability by defining where related code and docs will live.

Expected foundations:

```text
libs/observability exists or is planned.
Observability docs folder exists or is planned.
Error/logging expectations are documented.
Future release 0.9 owns full observability and reliability.
```

---

## Documentation Requirements

Release `0.1` documentation should include:

```text
Root README
Vision docs
Product docs
Release docs
0.1 release docs
Initial architecture/engineering folder plans
```

At minimum, a developer should be able to read the docs and understand:

- what Aerealith is
- what the release path is
- what release `0.1` is
- how the repo is expected to be structured
- where future docs belong

---

## Dependencies

Release `0.1` depends on:

```text
Node 24.x
pnpm
Nx
TypeScript
ESLint
Prettier
Commitlint
Vitest
Git
GitHub repository
```

Optional dependencies:

```text
Docker
GitHub Actions
Nx Cloud
```

---

## Risks

## Risk: Overbuilding Too Early

Release `0.1` could accidentally turn into product implementation.

Mitigation:

```text
Keep 0.1 focused on foundation and workspace.
Move product features to later releases.
```

---

## Risk: Poor Library Boundaries

Bad early dependency rules can create long-term architecture problems.

Mitigation:

```text
Use libs/core as the default shared dependency.
Avoid cross-library dependencies unless explicitly approved.
Document exceptions.
```

---

## Risk: Tooling Complexity

Too many tools too early can slow development.

Mitigation:

```text
Use only tools with clear value.
Keep commands simple.
Avoid unnecessary dependencies.
```

---

## Risk: Documentation Drift

Docs can become outdated quickly.

Mitigation:

```text
Tie docs to releases.
Update docs when scope changes.
Keep release docs clear and explicit.
```

---

## Risk: Case-Sensitive Folder Confusion

Using both `docs/releases` and `docs/releases` can cause problems across operating systems and Git.

Mitigation:

```text
Use lowercase folder names consistently.
Prefer docs/releases/.
```

---

## Exit Criteria

Release `0.1` is complete when all of the following are true:

```text
Repository installs successfully with pnpm.
Nx workspace is configured.
Node version expectation is documented.
TypeScript foundation exists.
ESLint is configured.
Prettier is configured.
Commitlint is configured.
Core package scripts exist.
Testing command exists.
Build command exists or build path is documented.
Apps folder exists or is planned.
Libs folder exists or is planned.
Docs folder exists.
Release docs folder exists.
0.1 release docs exist.
Library dependency rule is documented.
Basic CI expectations are documented.
Docker expectations are documented.
Future release path is documented.
```

---

## Completion Checklist

Release `0.1` should not be marked complete until:

```text
pnpm install works.
pnpm lint works.
pnpm format works or formatting command is documented.
pnpm typecheck works.
pnpm test works or test command is documented.
pnpm build works or build limitations are documented.
Docs are committed.
Release docs are committed.
No major product features are hidden inside 0.1.
```

---

## Handoff to Next Release

After release `0.1`, the next release is:

```text
0.2 — Core Domain & Data Platform
```

Release `0.2` should build on the workspace foundation by defining:

- core constants
- error system
- shared types
- schemas
- entities
- database foundations
- contracts
- data modeling rules
- domain boundaries

Release `0.1` gives `0.2` a clean place to build.

---

## Final Standard

Release `0.1` is successful when Aerealith has a clean foundation that future product, architecture, engineering, Discord, AI, automation, integration, and release work can safely build on.

The release standard is:

> A developer can clone the repo, install dependencies, understand the structure, run core checks, and know where future work belongs.
