# Current State

Status: Active
Owner: SinLess Games LLC
Last Updated: 2026-08-08
Document Type: Implementation Summary
Authority: Current-state navigation; repository evidence remains definitive

## Purpose

This document separates what exists in the repository now from accepted plans
and long-term vision. It is a short entry point, not a replacement for the
[Current Architecture](./architecture/Current%20Architecture.md),
[Project Inventory](./reference/Project%20Inventory.md), or executable source.

## Current Organizational State

Aerealith is a SinLess Games LLC product operated under SinLess Industries.
Aerealith is the platform; Aerealith AI is the assistant within that platform.
The full relationship is defined in
[Company and Project Structure](./Company-and-Project-Structure.md).

## Implemented Now

The repository currently contains these Nx projects:

- The `frontend` React and Vite application, including public and application
  surfaces with Cloudflare-oriented deployment configuration.
- The `frontend-e2e` Playwright test application.
- The `service-api` and `service-auth` Hono and Cloudflare Worker services.
- The `api-platform`, `auth`, `authorization`, `content`, `core`, `db`,
  `observability`, `ui`, and `utils` shared libraries.
- The `service-generator` workspace tool.

The resolved Nx graph also contains the workspace-root
`@aerealith-ai/source` project. It is an orchestration project, not a deployable
application.

The frontend Worker serves static assets, health and feature-flag responses,
and proxies the canonical `/api/V1/` service surface. The React application
contains public marketing routes, policy pages, a documentation site under
`/documentation`, account access and recovery, and a session-protected `/app`
shell with account, security, session-management, and permission-gated
administration views.

`service-auth` implements opaque HttpOnly cookie sessions, registration,
sign-in and sign-out, email verification, password recovery, account updates,
session listing and revocation, centralized authorization checks, trusted-origin
protection, Worker rate limits, and sanitized security-event logging.
`service-api` provides the general API and operational service surface.

The `db` library implements Drizzle tables, mappings, queries, repositories,
transactions, tests, and committed migrations for users, profiles,
preferences, sessions, verification, password-reset tokens, and normalized
authorization. Repository migrations are generated and inspected but are not
automatically applied to a deployed database.

The repository also contains active continuous integration, security, quality,
coverage, and repository-automation workflows. Exact projects and targets are
listed in the [Project Inventory](./reference/Project%20Inventory.md).

## Current Technology Foundation

The implemented foundation is a TypeScript monorepo using Node.js, pnpm, Nx,
React, Vite, React Router, Tailwind CSS, Vitest, Playwright, Drizzle ORM,
PostgreSQL-oriented data access, Hono, and Cloudflare deployment tooling.

Use the [approved stack](./STACK.md) for technology status and `package.json`
for exact installed versions. A technology appearing in a vision or target
architecture document does not prove that it is implemented.

## Current Product Stage

The project is in active foundation development. The repository demonstrates a
working frontend, shared libraries, tests, build automation, and delivery
guardrails. It does not yet demonstrate the complete product described by the
vision and roadmap.

Release `0.1` is the current documented foundation milestone. See the
[0.1 release plan](./releases/0.1/README.md) for its scope and acceptance
criteria. Release plans describe intended delivery; repository evidence proves
completion.

Cloudflare configuration declares queue, Key-Value (KV), R2, Flagship,
Analytics Engine, service, secret-store, and rate-limit bindings. Current
Workers consume assets, feature flags, service bindings, auth secrets, and the
auth rate limiter. Queue-backed product workflows remain planned.

## Known Configuration Conflicts

- Implemented database configuration reads `DATABASE_URL`. Documents that use
  `AEREALITH_DATABASE_URL` describe a target naming convention, not current
  runtime behavior.
- The auth Worker currently uses a direct PostgreSQL URL; Hyperdrive is not yet
  provisioned for the production edge path.
- Security events use a typed, sanitized structured-log adapter, but a durable
  audit sink is not yet wired.

## Accepted or Planned, Not Current Product Claims

The following are product direction unless and until repository evidence and a
release record show otherwise:

- Production Discord community management and bot capabilities.
- MFA, passkeys, OAuth, API keys, periodic session rotation, and full
  organization/account approval workflows.
- General-purpose workflow automation and marketplace capabilities.
- Production Aerealith AI chat, memory, tool use, and autonomous actions.
- Hosted commercial service availability.
- Self-hosted, hybrid, local, and air-gapped distributions.
- Mobile and desktop companion applications.
- Provider-independent production deployments across all subsystems.

Discord is the first flagship integration in the
[roadmap](./vision/Roadmap.md), not the full product and not an assertion that
the planned Discord platform is already available. Self-hosting is a future
direction whose compatibility boundaries are considered early.

## How to Verify a Claim

Use this evidence order for current implementation questions:

1. Executable source, project definitions, and tests.
2. `package.json`, the lockfile, and runtime pin files.
3. [Current Architecture](./architecture/Current%20Architecture.md).
4. [Project Inventory](./reference/Project%20Inventory.md).
5. Active release evidence and release notes.
6. Accepted target architecture, product documents, and roadmap material.

If a claim appears only in vision, product, roadmap, or funding material, treat
it as direction rather than implemented functionality.

## Related Documentation

- [Project Overview](./Project-Overview.md)
- [Company and Project Structure](./Company-and-Project-Structure.md)
- [Documentation Index](./README.md)
- [Approved Technology Stack](./STACK.md)
- [Current Architecture](./architecture/Current%20Architecture.md)
- [Project Inventory](./reference/Project%20Inventory.md)
- [Release Index](./releases/README.md)
- [Module Catalog](./modules/README.md)
- [Repository Documentation Audit](./audits/Repository-Documentation-Audit.md)
