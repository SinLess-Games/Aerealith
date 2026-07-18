# Aerealith Documentation

Status: Active
Owner: SinLess Games LLC
Last Updated: 2026-07-18
Document Type: Documentation Index
Authority: Canonical navigation and documentation-authority map

## Purpose

This file is the front door for Aerealith documentation.

It explains where information belongs, which sources are authoritative, how
documents are classified, and which reading path a contributor should follow.
It is intentionally an index rather than a second product or architecture
specification.

Aerealith documentation answers eight questions:

1. Why does Aerealith exist?
2. What are we building for users?
3. How is the platform designed?
4. What implementation rules are binding?
5. Why were important choices made?
6. How is Aerealith operated and recovered?
7. What is being delivered now?
8. Where are exact registries and generated facts recorded?

## Start Here

- [Project Overview](./Project-Overview.md)
- [Company and Project Structure](./Company-and-Project-Structure.md)
- [Current State](./CURRENT_STATE.md)
- [Approved Technology Stack](./STACK.md)
- [Current Architecture](./architecture/Current%20Architecture.md)
- [Project Inventory](./reference/Project%20Inventory.md)
- [Master Index](./MASTER_INDEX.md)

## Canonical Structure

```text
README.md
│
├── docs/README.md                  Navigation and authority
├── docs/STACK.md                   Approved technology source of truth
│
├── docs/vision/                    Why
├── docs/product/                   What
├── docs/architecture/              How
├── docs/engineering/               Required implementation rules
├── docs/decisions/                 Why major choices were made
├── docs/operations/                How to run and recover it
├── docs/releases/                  What is being delivered
├── docs/reference/                 Exact facts and registries
└── docs/archive/                   Historical material

apps/**/README.md                   Application-specific contract
libs/**/README.md                   Library-specific contract
tools/**/README.md                  Tool-specific contract
```

## Authority Order

When two sources disagree, use this order:

1. Accepted or active records in [`docs/decisions/`](./decisions/).
2. [`docs/STACK.md`](./STACK.md) for approved technologies and implementation
   status.
3. Active architecture documents.
4. Active engineering standards.
5. Active product and operations documentation.
6. Project-local README files.
7. Release plans.
8. Historical, archived, or generated material.
9. Code comments and scaffolding text.

The repository remains authoritative for exact installed package versions,
existing paths, and executable behavior. Documentation must not claim that a
technology, service, module, or route is implemented without repository
evidence.

## Status Model

| Status     | Meaning                                               |
| ---------- | ----------------------------------------------------- |
| Draft      | Incomplete and not authoritative.                     |
| Proposed   | Complete enough for review but not approved.          |
| Accepted   | Approved direction; implementation may be incomplete. |
| Active     | Describes current authoritative behavior.             |
| Deprecated | Present temporarily but must not guide new work.      |
| Superseded | Replaced by another document or decision.             |
| Rejected   | Considered and intentionally declined.                |
| Archived   | Retained only for history.                            |

The essential distinction is:

```text
Accepted does not mean implemented.
Active means current truth.
```

## Documentation Sections

### [`vision/`](./vision/)

Explains why Aerealith exists and what must remain true as the platform grows.

Vision documents cover mission, values, trust, positioning, product philosophy,
manifesto, and long-term direction. They do not define package versions,
directory layouts, API shapes, or release tasks.

### [`product/`](./product/)

Explains what users experience.

Product documentation defines personas, capabilities, Discord behavior,
assistant behavior, workflows, dashboards, integrations, modules, and scope.
Each capability must be labeled as current, accepted, planned, or out of scope.

### [`architecture/`](./architecture/)

Explains how the system is designed.

Start with
[`Current Architecture.md`](./architecture/Current%20Architecture.md), which
describes only what exists today. Other architecture documents may describe an
accepted target state, but they must separate that target from current
implementation.

### [`engineering/`](./engineering/)

Defines rules contributors must follow.

Engineering standards cover local development, code style, TypeScript, testing,
monorepo boundaries, dependencies, package management, configuration, secrets,
containers, Cloudflare, documentation, security, Git workflow, and releases.

A standard marked `Draft` is not mandatory. A standard marked `Active` is
binding.

### [`decisions/`](./decisions/)

Records why major choices were made and resolves conflicts between other
documents.

Decision records are stable history. A material reversal requires a new
decision that supersedes the old record rather than silently rewriting the
past.

### [`operations/`](./operations/)

Explains how Aerealith is deployed, observed, supported, recovered, and rolled
back.

Operational documents must identify prerequisites, access requirements, risks,
steps, verification, rollback, audit requirements, and ownership.

### [`releases/`](./releases/)

Tracks what is being delivered and what each release must prove.

Release documents may reference permanent decisions but must not redefine them.
Completed releases become historical delivery records.

### [`reference/`](./reference/)

Contains exact facts and registries.

Reference material should be precise, searchable, and generated where
practical. Examples include project inventories, environment variables, route
registries, error codes, permissions, events, modules, and service catalogs.

### [`archive/`](./archive/)

Contains superseded, rejected, or historical material.

Archived material must not guide new work. Every archived document must state
why it was archived and identify its replacement when one exists.

## Recommended Reading Paths

### New Contributor

1. [Root README](../README.md)
2. [Project Overview](./Project-Overview.md)
3. [Company and Project Structure](./Company-and-Project-Structure.md)
4. [Current State](./CURRENT_STATE.md)
5. [Approved Technology Stack](./STACK.md)
6. [Current Architecture](./architecture/Current%20Architecture.md)
7. [Local Development](./engineering/Local%20Development.md)
8. [Monorepo Rules](./engineering/Monorepo%20Rules.md)
9. [Testing](./engineering/Testing.md)

### Product Contributor

1. [`Vision.md`](./vision/Vision.md)
2. [`Product Overview.md`](./product/Product%20Overview.md)
3. [`MVP Scope.md`](./product/MVP%20Scope.md)
4. [`User Personas.md`](./product/User%20Personas.md)
5. [Current release 0.1](./releases/0.1/README.md)

### Backend Contributor

1. [`docs/STACK.md`](./STACK.md)
2. [`Current Architecture.md`](./architecture/Current%20Architecture.md)
3. [`API Architecture.md`](./architecture/API%20Architecture.md)
4. [`Service Architecture.md`](./architecture/Service%20Architecture.md)
5. [`Data Architecture.md`](./architecture/Data%20Architecture.md)
6. Relevant accepted decisions
7. Engineering standards

### Discord Contributor

1. [`Discord Platform.md`](./product/Discord%20Platform.md)
2. [`Discord Architecture.md`](./architecture/Discord%20Architecture.md)
3. [`DEC-002`](./decisions/DEC-002-discord-mvp-module-scope.md)
4. [`DEC-014`](./decisions/DEC-014-mvp-persona-priority.md)
5. Dependency, testing, environment, and secrets standards

### Operator

1. [`Current Architecture.md`](./architecture/Current%20Architecture.md)
2. [`docs/operations/README.md`](./operations/README.md)
3. Deployment and rollback procedures
4. Monitoring and incident response
5. Backup and recovery
6. Secrets and access recovery

## Current Documentation Priorities

The documentation system is considered healthy when:

- Every significant document has status, owner, and review metadata.
- Every internal link resolves on a case-sensitive filesystem.
- Current implementation is separated from accepted target architecture.
- Release tracking matches repository reality.
- No active document cites deleted RFCs as authority.
- Project-local README files describe real project contracts.
- Commands shown in documentation exist in package scripts or Nx targets.
- Decision records are linked from affected architecture and release documents.
- CI validates Markdown, links, metadata, and generated references.

## Contribution Rule

Cross-project concepts belong in `docs/`.

Project-specific setup, commands, exports, dependencies, and deployment behavior
belong in the README beside that project.
