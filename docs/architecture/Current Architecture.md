# Current Architecture

Status: Active
Owner: SinLess Games LLC
Last Updated: 2026-08-08
Document Type: Architecture
Implementation State: Current repository truth

## Project Context

- [Project Overview](../Project-Overview.md)
- [Company and Project Structure](../Company-and-Project-Structure.md)
- [Current State](../CURRENT_STATE.md)
- [Documentation Index](../README.md)

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
└── services/
    ├── api/
    └── auth/

libs/
├── api-platform/
├── auth/
├── authorization/
├── content/
├── core/
├── db/
├── observability/
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

| Project        | Path                 | Type             | Current Responsibility                                                                               |
| -------------- | -------------------- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| `frontend`     | `apps/frontend`      | Application      | Public site, authenticated application, documentation, and developer-facing web surfaces.            |
| `frontend-e2e` | `apps/frontend-e2e`  | Test application | Playwright end-to-end validation for the frontend.                                                   |
| `service-api`  | `apps/services/api`  | Service          | Hono-based public API platform runtime and health surface.                                           |
| `service-auth` | `apps/services/auth` | Service          | Browser authentication, account, session, verification, recovery, and protected administration APIs. |

## Implemented Libraries

| Project         | Path                 | Current Responsibility                                                                      |
| --------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| `api-platform`  | `libs/api-platform`  | Shared Hono application, transport, request-context, error, and authorization adapters.     |
| `auth`          | `libs/auth`          | Runtime-neutral password, session, policy, and authentication application services.         |
| `authorization` | `libs/authorization` | Central permission evaluation, scoped role assignments, management policy, and caching.     |
| `content`       | `libs/content`       | Structured product copy, localized content, documentation MDX, and translation workflow.    |
| `core`          | `libs/core`          | Runtime-neutral primitives, entities, contracts, schemas, flags, and foundational behavior. |
| `db`            | `libs/db`            | Drizzle schemas, repositories, queries, migrations, and persistence mapping.                |
| `observability` | `libs/observability` | Structured logging and telemetry adapters shared by runtime applications.                   |
| `ui`            | `libs/ui`            | Reusable accessible interface primitives, patterns, and semantic design tokens.             |
| `utils`         | `libs/utils`         | General-purpose utilities that do not belong to a narrower domain.                          |

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

`apps/services/` contains two implemented Cloudflare-oriented service runtimes:

- `service-api` provides the shared public API runtime and operational health
  surface.
- `service-auth` provides local-password authentication, server-side browser
  sessions, email verification, password recovery, user-controlled session
  revocation, account management, and permission-protected administration
  endpoints.

These services are real projects, but they are not evidence that every logical
service in the target architecture has been extracted or deployed independently.

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

## Current Frontend and Documentation State

The main React application currently includes public marketing routes, sign-in,
sign-up, email verification, the authenticated dashboard and account surfaces,
administrator views, and the Fumadocs-backed documentation experience under
`/documentation`.

Documentation content is sourced from `libs/content/src/en/docs`. User and
developer audiences have distinct navigation trees. Search, breadcrumbs,
heading links, a table of contents, previous and next navigation, responsive
sidebars, and MDX rendering are implemented in `apps/frontend`.

## Current Authentication and Authorization State

The browser authentication implementation uses an opaque cookie credential and
server-side session rows. Only token hashes are persisted. Session lookup and
revocation happen on the server, and protected API operations use centralized,
scoped authorization from `libs/authorization` rather than the legacy
`users.role` compatibility field.

Current user-facing identity behavior includes local-password registration,
sign-in, sign-out, email verification and resend, authenticated account
updates, password-reset request and completion, active-session listing,
individual session revocation, and revocation of all other sessions.

Public REST behavior uses the canonical `/api/V1/` prefix. Public registration
is REST-only so feature-flag and Turnstile enforcement cannot be bypassed by an
alternate transport. Unsafe browser writes pass through trusted-origin checks;
no wildcard credentialed CORS policy is enabled. Cloudflare's rate-limit binding
bounds sensitive authentication operations, including the remaining GraphQL
and tRPC authentication mutations.

Password creation and reset enforce a shared 12-character policy with upper-
and lowercase letters and a number. Credentials currently use salted,
parameter-versioned scrypt hashes with rehash detection. Reset and verification
tokens are opaque, stored only as hashes, expire, and are single-use. A
successful password reset revokes every existing session.

Auth application services publish sanitized security events through an
`AuthEventPublisher` boundary. The current Worker implementation writes these
as structured logs without credentials, email addresses, or raw tokens.

## Known Authentication and Runtime Gaps

The following target-state controls are not current implementation claims:

- Argon2id remains the preferred password-hashing target; the current runtime
  uses versioned scrypt because an approved Worker-compatible Argon2 provider
  has not been integrated.
- Sessions have bounded lifetime and server-side revocation, but periodic token
  rotation, idle-expiry refresh, step-up authentication, MFA, passkeys, OAuth,
  and API keys are not implemented.
- Security events have a typed provider boundary and structured-log adapter,
  but no durable audit-record sink is wired into the Worker composition.
- The Worker currently opens its PostgreSQL connection from the secret-provided
  URL. A production Hyperdrive configuration has not been provisioned, so the
  current direct database transport must be replaced or explicitly validated
  before an edge production rollout.
- Email delivery requires valid Resend configuration. Development fallbacks do
  not log or expose verification or recovery tokens.
- Migration `0004_loud_mandrill.sql` adds password-reset persistence and
  session self-service grants, but repository work does not apply it to any
  deployed database automatically.

## Planned but Not Yet Implemented as Projects

The accepted target architecture includes projects such as:

```text
apps/integrations/discord
libs/contracts
libs/flags
```

These paths remain planned boundaries, not current implementation claims.
Shared API behavior currently lives in `libs/api-platform`, and shared runtime
contracts currently live primarily in `libs/core`; creating separately named
libraries requires an explicit migration rather than duplicating those roles.

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
