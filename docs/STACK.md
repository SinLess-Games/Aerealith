# Aerealith Technology Stack

Status: Active
Owner: SinLess Games LLC
Last Updated: 2026-07-14
Document Type: Engineering Reference
Authority: Canonical for approved technology choices

## Project Context

- [Project Overview](./Project-Overview.md)
- [Company and Project Structure](./Company-and-Project-Structure.md)
- [Current State](./CURRENT_STATE.md)
- [Documentation Index](./README.md)

## Purpose

This document defines the current and planned technology stack for Aerealith AI.

It answers:

- What technologies does Aerealith use?
- Which choices are implemented?
- Which choices are approved but not yet implemented?
- What role does each technology play?
- What constraints govern future additions?

The repository remains the source of truth for exact installed versions. This
document records approved technologies, responsibilities, and architectural
direction.

## Status Definitions

| Status           | Meaning                                                   |
| ---------------- | --------------------------------------------------------- |
| Implemented      | Present in the repository and actively used.              |
| Adopted          | Approved for use where applicable.                        |
| Planned          | Intended for future implementation.                       |
| Optional         | Approved for limited use cases but not required globally. |
| Under Evaluation | Not yet approved as a permanent stack choice.             |
| Deprecated       | Must not be used for new work.                            |

A technology must not be described as implemented unless the repository contains
the relevant dependency, configuration, code, or deployment definition.

## Core Engineering Decisions

- The project uses an Nx and pnpm monorepo.
- TypeScript is the primary application language.
- The web frontend uses React and Vite.
- React Router owns client-side routing.
- Tailwind CSS is the primary styling system.
- TanStack Query manages frontend server state.
- Hono is the default lightweight HTTP and service framework.
- NestJS may be used for larger services that need stronger application structure.
- Drizzle ORM is the relational data-access layer.
- PostgreSQL is the default relational database.
- CockroachDB compatibility is a goal for distributed deployments.
- Discord is a first-class platform integration.
- Every independently deployable service must provide a Dockerfile.
- Aerealith is cloud-first but must avoid unnecessary provider lock-in.
- The architecture must remain compatible with future self-hosting.
- AI enhances the platform but is not required for core functionality.
- External providers should be accessed through replaceable boundaries.
- Exact package versions are controlled by manifests and lockfiles.

## Stack Summary

| Area                  | Technology                 | Status      | Primary Role                          |
| --------------------- | -------------------------- | ----------- | ------------------------------------- |
| Runtime               | Node.js                    | Implemented | JavaScript and TypeScript runtime     |
| Language              | TypeScript                 | Implemented | Primary application language          |
| Package manager       | pnpm                       | Implemented | Workspace dependency management       |
| Monorepo              | Nx                         | Implemented | Project graph and task orchestration  |
| Frontend              | React                      | Implemented | User-interface framework              |
| Build tooling         | Vite                       | Implemented | Development and production builds     |
| Routing               | React Router               | Implemented | Client-side routing                   |
| Styling               | Tailwind CSS               | Implemented | Utility-first styling                 |
| UI primitives         | Base UI                    | Implemented | Accessible unstyled components        |
| Server state          | TanStack Query             | Implemented | Fetching, caching, and mutations      |
| API framework         | Hono                       | Implemented | Lightweight and edge-compatible APIs  |
| Structured backend    | NestJS                     | Adopted     | Larger modular backend services       |
| Typed API             | tRPC                       | Implemented | Internal end-to-end typed APIs        |
| Validation            | Zod                        | Implemented | Runtime schema validation             |
| GraphQL               | GraphQL Yoga               | Optional    | GraphQL APIs where justified          |
| ORM                   | Drizzle ORM                | Implemented | Typed SQL and schema management       |
| Database              | PostgreSQL                 | Implemented | Default relational database           |
| Distributed SQL       | CockroachDB                | Planned     | Scalable PostgreSQL-compatible option |
| Email                 | Resend                     | Implemented | Transactional email                   |
| Media                 | Cloudinary                 | Adopted     | Managed media storage and delivery    |
| Frontend telemetry    | Grafana Faro               | Implemented | Browser telemetry and monitoring      |
| Managed observability | Datadog                    | Adopted     | Logs, metrics, traces, and alerts     |
| Logging               | Pino                       | Implemented | Structured application logs           |
| Unit testing          | Vitest                     | Implemented | Unit and integration tests            |
| Browser testing       | Playwright                 | Implemented | End-to-end browser tests              |
| Accessibility         | axe-core                   | Implemented | Automated accessibility checks        |
| Visual testing        | Meticulous AI              | Adopted     | Visual regression testing             |
| Coverage              | Codecov                    | Implemented | Coverage reporting                    |
| Formatting            | Prettier                   | Implemented | Source formatting                     |
| Linting               | ESLint                     | Implemented | Static analysis                       |
| Markdown linting      | markdownlint-cli2          | Implemented | Markdown validation                   |
| Git hooks             | Husky                      | Implemented | Local workflow enforcement            |
| Security              | Snyk                       | Adopted     | Dependency and code analysis          |
| Security              | Semgrep                    | Adopted     | Static security rules                 |
| Dependencies          | Renovate                   | Adopted     | Scheduled dependency maintenance      |
| Dependencies          | Dependabot                 | Adopted     | GitHub-native security updates        |
| Deployment            | Cloudflare                 | Implemented | Edge runtime and hosting              |
| Containers            | Docker                     | Adopted     | Portable service packaging            |
| Documentation         | Markdown + Mermaid         | Implemented | Docs as code and diagrams             |
| Documentation UI      | Fumadocs                   | Implemented | Structured documentation rendering    |
| Platform integration  | Discord                    | Adopted     | First production integration          |
| AI                    | Provider-agnostic AI layer | Planned     | Assistant and automation enhancement  |

## Runtime and Language

### Node.js

**Status:** Implemented

Node.js is the primary runtime for application services, repository tooling,
scripts, and local development.

Requirements:

- Contributors use the repository-pinned Node.js version.
- CI should use the same supported version.
- Services must not depend on undocumented global packages.
- Runtime-specific APIs should be isolated when they reduce portability.
- Edge services must account for differences between Node.js and worker runtimes.

### TypeScript

**Status:** Implemented

TypeScript is the primary language for:

- frontend applications
- backend services
- API contracts
- shared libraries
- repository tooling
- tests
- Discord modules
- workflows
- integration adapters

New application code should use strict typing. Runtime validation is still
required at trust boundaries because TypeScript types do not exist at runtime.

## Monorepo and Package Management

### Nx

**Status:** Implemented

Nx manages:

- the project graph
- applications and libraries
- affected-project execution
- task orchestration
- caching
- build ordering
- generators
- lint, test, typecheck, and build targets

Project boundaries must remain explicit and circular dependencies are prohibited.

Nx Cloud is not required. Remote caching may be evaluated independently later.

### pnpm

**Status:** Implemented

pnpm is the only supported package manager.

It manages:

- workspaces
- dependency installation
- script execution
- the lockfile
- dependency overrides
- shared package configuration

npm, Yarn, and Bun lockfiles must not be committed.

## Frontend Stack

### React

**Status:** Implemented

React is the primary UI framework for the Aerealith dashboard and shared
interface components.

It supports:

- dashboard surfaces
- assistant interfaces
- Discord configuration
- module management
- workflow interfaces
- account and organization administration
- reusable design-system components

### Vite

**Status:** Implemented

Vite is the primary frontend development and build tool.

It provides:

- the local development server
- hot module replacement
- production bundling
- React integration
- TypeScript integration
- Tailwind integration
- Cloudflare integration

Build configuration should remain understandable and avoid unnecessary plugins.

### React Router

**Status:** Implemented

React Router owns:

- application routes
- nested layouts
- route loading
- route error boundaries
- navigation
- authorization entry points
- module route composition

Routing logic should not be duplicated in unrelated state systems.

### Tailwind CSS

**Status:** Implemented

Tailwind CSS is the primary styling system for:

- layouts
- spacing
- typography
- responsive behavior
- interaction states
- design tokens
- component variants

Repeated patterns should become reusable components or typed variants when that
improves clarity.

### Base UI

**Status:** Implemented

Base UI provides accessible, unstyled primitives for components such as dialogs,
menus, popovers, tooltips, tabs, and selects.

Aerealith owns the visual design system layered on top of these primitives.

### TanStack Query

**Status:** Implemented

TanStack Query manages frontend server state, including:

- request caching
- background refresh
- mutation state
- invalidation
- loading and error state
- safe optimistic updates

It must not replace ordinary local UI state.

### Supporting UI Libraries

| Technology               | Role                               |
| ------------------------ | ---------------------------------- |
| Class Variance Authority | Typed component variants           |
| clsx                     | Conditional class composition      |
| tailwind-merge           | Tailwind class conflict resolution |
| Sonner                   | Toast notifications                |
| Hugeicons                | Interface icons                    |
| Fontsource               | Repository-managed fonts           |

These are supporting packages rather than separate architecture layers.

## Backend and API Stack

### Hono

**Status:** Implemented

Hono is the default framework for lightweight APIs, middleware, edge services,
and HTTP entry points.

Use Hono when a service benefits from:

- low overhead
- explicit routing
- edge-runtime compatibility
- small deployment size
- composable middleware
- straightforward request handling

Hono services must still follow shared validation, authorization, logging, error,
and contract standards.

### NestJS

**Status:** Adopted

NestJS is approved for larger backend services where its structure provides
clear value.

Use it when a service needs:

- substantial domain orchestration
- dependency injection
- strongly defined modules
- complex background processing
- multiple transports
- extensive lifecycle management
- a larger contributor surface

NestJS is not required for every service. Hono remains preferred when it is
sufficient.

NestJS is currently an architectural commitment and is not installed in the
root package manifest.

### tRPC

**Status:** Implemented

tRPC may be used for end-to-end typed APIs where both client and server are
TypeScript applications controlled by Aerealith.

Public or language-neutral APIs must not depend solely on tRPC.

### GraphQL Yoga

**Status:** Optional

GraphQL Yoga may be used for domains that materially benefit from graph-shaped
queries or a schema-driven integration surface.

GraphQL should not be introduced merely because its packages are installed.

### Zod

**Status:** Implemented

Zod is the primary runtime validation library.

Use it at:

- HTTP request boundaries
- environment-variable loading
- provider payload boundaries
- webhook boundaries
- configuration parsing
- event ingestion
- untrusted AI output boundaries

Validation failures must be converted into the standard error model.

## Data Stack

### PostgreSQL

**Status:** Implemented

PostgreSQL is the default relational database.

It stores durable platform data such as:

- users and organizations
- Discord server configuration
- module settings
- permissions and role mappings
- workflows
- tickets and transcripts
- audit records
- notifications
- integration state
- approved assistant metadata

Database design should favor explicit relational models, durable identifiers,
constraints, migrations, and auditable state changes.

### CockroachDB

**Status:** Planned

CockroachDB is the intended PostgreSQL-compatible option for deployments that
require distributed SQL and horizontal resilience.

Compatibility must be validated before production adoption, including:

- SQL features
- transaction behavior
- retry semantics
- migrations
- identifier generation
- indexes
- Drizzle compatibility
- operational requirements

PostgreSQL remains the default development and initial production target.

### Drizzle ORM

**Status:** Implemented

Drizzle ORM owns:

- typed table definitions
- relational queries
- schema evolution
- migration generation
- migration execution
- SQL visibility

Raw SQL is allowed when it is clearer or more capable, but it must remain
parameterized, tested, and documented where non-obvious.

## Discord Platform

### First-Class Integration

**Status:** Adopted

Discord is the first real platform integration and must be treated as a
first-class application surface, not a side feature.

Discord capabilities will be organized into independently configurable modules,
including areas such as:

- moderation
- automod
- tickets
- logging
- role management
- server configuration
- notifications
- workflows
- identity and persona features
- AI-assisted community operations

Discord uses the same platform foundations as other integrations:

- permissions
- audit logging
- module lifecycle
- configuration
- provider health
- events
- workflows
- observability

Discord-specific behavior must not leak into unrelated platform domains without
an explicit abstraction.

## AI Stack

### AI as an Enhancement

**Status:** Adopted architectural rule

AI is important to Aerealith, but core functionality must remain useful when AI
providers are unavailable, disabled, rate-limited, or unaffordable.

The following must not require AI:

- authentication
- account and organization management
- Discord server linking
- module controls
- deterministic moderation rules
- ticket management
- audit logs
- provider configuration
- permissions
- deterministic workflows
- operational health views

AI may enhance these areas through:

- summaries
- recommendations
- classification
- drafting
- natural-language interaction
- workflow preparation
- assisted moderation
- search and retrieval

### Provider Abstraction

**Status:** Planned

AI providers should be accessed through internal interfaces rather than called
directly throughout application code.

The provider layer should support:

- provider replacement
- model selection
- timeouts and retries
- usage accounting
- safety controls
- structured-output validation
- health reporting
- audit metadata
- future local-model support

AI-generated actions must pass through the same authorization, approval, and
audit controls as manual actions.

## Cloud, Deployment, and Portability

### Cloudflare

**Status:** Implemented

Cloudflare is the current edge and deployment platform.

It may provide:

- application hosting
- worker runtimes
- routing
- edge request handling
- security controls
- deployment environments

Cloudflare-specific APIs should be isolated where practical so domain logic
remains portable and testable.

### Docker

**Status:** Adopted

Every independently deployable service must provide a Dockerfile, even when its
primary hosted deployment does not require Docker.

Docker supports:

- reproducible local environments
- CI execution
- staging and production portability
- future self-hosting
- provider migration

A Dockerfile is not complete until it can build and run the service using
documented configuration.

### Cloud-First but Self-Hostable

**Status:** Adopted architectural rule

Aerealith is cloud-first because managed infrastructure accelerates delivery and
reduces early operational burden.

Cloud-first does not mean cloud-locked.

The architecture should preserve:

- containerized service boundaries
- environment-driven configuration
- replaceable provider adapters
- portable data formats
- standard database support
- documented external dependencies
- deployment-independent business logic

Full self-hosting is not an MVP requirement, but present decisions must avoid
making it unnecessarily impossible.

## External Providers

### Resend

**Status:** Implemented

Resend is the transactional email provider for:

- account verification
- security notifications
- access workflows
- ticket notifications
- operational alerts
- workflow-generated email

Application code should use an internal email boundary so Resend can be replaced.

### Cloudinary

**Status:** Adopted

Cloudinary is the approved managed media provider for:

- image uploads
- image transformations
- optimized media delivery
- generated media
- user and organization assets
- module media

Provider identifiers and URLs must not become the sole domain representation of
stored media.

## Observability and Logging

### Grafana Faro

**Status:** Implemented

Grafana Faro provides frontend telemetry and real-user monitoring, including:

- browser errors
- performance information
- user-session telemetry
- frontend events
- trace context

Telemetry must respect privacy and data-minimization requirements.

### Datadog

**Status:** Adopted

Datadog is approved as a primary managed observability platform for:

- logs
- metrics
- traces
- dashboards
- alerts
- service health
- incident investigation

Instrumentation should remain standards-based where practical.

### Pino

**Status:** Implemented

Pino is the primary structured logging library.

Logs must be:

- structured
- machine-readable
- correlated with request or trace IDs
- free of secrets
- appropriate for the environment
- useful during incidents

Sensitive values must be redacted before logging.

## Testing Stack

### Vitest

**Status:** Implemented

Vitest is the default unit and integration test runner.

It should cover:

- domain logic
- shared libraries
- validation
- APIs
- integration boundaries
- utilities
- component behavior where browser automation is unnecessary

### Playwright

**Status:** Implemented

Playwright is the default browser and end-to-end framework.

Critical coverage should include:

- authentication
- navigation
- account setup
- Discord linking
- module configuration
- permissions
- tickets
- destructive-action confirmation

### Testing Library

**Status:** Implemented

Testing Library is used for user-centered React component testing. Tests should
prefer accessible queries and observable behavior over implementation details.

### axe-core

**Status:** Implemented

axe-core provides automated accessibility checks in Playwright tests.

Automated checks do not replace keyboard testing, screen-reader review, contrast
review, or human usability testing.

### MSW

**Status:** Implemented

Mock Service Worker provides controlled API mocking for tests and development.

Mocks must reflect real contracts and must not silently diverge from production.

### Meticulous AI

**Status:** Adopted

Meticulous AI is approved for visual regression testing.

Visual regression complements rather than replaces unit, integration,
accessibility, and end-to-end testing.

### Codecov

**Status:** Implemented

Codecov reports test coverage and coverage changes.

Coverage is a diagnostic signal, not proof of correctness.

## Code Quality and Security

### ESLint

**Status:** Implemented

ESLint provides static analysis for TypeScript, React, imports, accessibility,
Playwright tests, and repository-specific rules.

### Prettier

**Status:** Implemented

Prettier is the canonical formatter. Formatting disagreements should be resolved
through configuration rather than repeated manual discussion.

### markdownlint-cli2

**Status:** Implemented

Markdownlint validates Markdown structure and consistency across documentation.

### Husky and lint-staged

**Status:** Implemented

Husky and lint-staged provide fast local feedback through Git hooks. Local hooks
do not replace CI.

### Commitlint

**Status:** Implemented

Commitlint enforces the repository commit-message convention.

Commit messages should clearly describe the intent of a change.

### Snyk

**Status:** Adopted

Snyk is approved for dependency, code, container, and infrastructure security
analysis where applicable.

### Semgrep

**Status:** Adopted

Semgrep is approved for static security analysis and organization-specific code
rules.

### Dependabot and Renovate

**Status:** Adopted

Both may be used when responsibilities are configured to prevent duplicate pull
requests.

Recommended division:

- Dependabot handles GitHub-native security alerts and urgent remediation.
- Renovate handles scheduled maintenance, grouping, and update policy.

Automated updates must still pass review and CI.

## Documentation Stack

### Markdown

**Status:** Implemented

Markdown is the primary documentation format. Documentation lives in Git and is
reviewed alongside code.

### Mermaid

**Status:** Adopted

Mermaid is the preferred diagram format when it can communicate the required
architecture clearly. Static diagrams may be used when Mermaid cannot provide
sufficient readability.

### Fumadocs

**Status:** Implemented

Fumadocs packages are available for building and rendering structured project
documentation.

Published documentation must remain traceable to repository source files.

## Version Management

Exact versions are not duplicated throughout this document.

Authoritative version sources include:

```text
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
project.json files
Dockerfiles
infrastructure configuration
```

This document records approved choices and responsibilities. Manifests record
exact versions.

When the document and implementation disagree:

1. Determine whether the difference is an implementation gap or stale documentation.
2. Update the incorrect source in the same change where practical.
3. Do not assume an experimental dependency is an approved permanent choice.

## Adding a New Technology

A new framework, provider, database, runtime, or major library should be adopted
only when it provides value the existing stack cannot reasonably supply.

Evaluate:

- the problem being solved
- overlap with current tools
- maintenance burden
- security history
- license
- ecosystem health
- runtime cost
- deployment compatibility
- testing requirements
- observability requirements
- self-hosting impact
- migration and replacement path

Small implementation dependencies do not require a stack-document update unless
they become a meaningful architectural choice.

Major additions must update this document and all affected architecture or
engineering documentation.

## Technologies Not Automatically Approved

The presence of a package in a prototype, experiment, branch, generated project,
or transitive dependency does not make it an approved stack choice.

The following require explicit evaluation:

- additional frontend frameworks
- additional backend frameworks
- alternate ORMs
- alternate primary databases
- alternate package managers
- alternate monorepo systems
- overlapping state-management systems
- additional API paradigms without a defined use case
- provider SDKs used directly throughout domain logic
- AI frameworks that obscure provider behavior

Stack sprawl is not architecture. Every major addition must earn its operational
and cognitive cost.

## Current Implementation Notes

As of 2026-07-14:

- Nx and pnpm are configured.
- Node.js and pnpm versions are pinned.
- React, Vite, React Router, and Tailwind CSS are installed.
- TanStack Query is installed.
- Hono is installed.
- NestJS is approved but not installed in the root manifest.
- tRPC, GraphQL Yoga, GraphQL, and Zod are installed.
- Drizzle ORM, Drizzle Kit, and the PostgreSQL driver are installed.
- PostgreSQL is the active database target.
- CockroachDB remains a compatibility goal requiring validation.
- Resend is installed.
- Grafana Faro and Pino are installed.
- Vitest, Playwright, Testing Library, axe-core, and MSW are installed.
- ESLint, Prettier, markdownlint, Husky, lint-staged, and Commitlint are installed.
- Cloudflare Workers and Vite tooling are installed.
- Docker support remains an approved requirement per deployable service.
- Discord remains the first first-class integration.
- AI remains optional for core platform operation.

## Maintenance

Update this document when:

- a major technology is adopted or removed
- the default framework changes
- the database strategy changes
- the deployment strategy changes
- an external provider becomes authoritative
- a planned technology becomes implemented
- a technology becomes deprecated
- a core responsibility moves between tools

Routine patch and minor version upgrades do not require an update unless they
change architecture, compatibility, or operating requirements.

Implementation, architecture documentation, engineering standards, and this
stack reference should be updated together whenever practical.
