---
title: 'API Versioning and Route Strategy'
rfc: '0003'
status: 'Implemented'
created: '2026-07-09'
updated: '2026-07-09'
owner: 'Tim Pierce / SinLess Games'
reviewers:
  - 'Timothy Pierce'
reviewed_by: 'Timothy Pierce'
reviewed_on: '2026-07-09'
implemented_by: 'Timothy Pierce'
implemented_on: '2026-07-09'
related_release: '0.1 — Foundation & Workspace'
future_releases:
  - '0.5 — API & Service Platform'
  - '0.6 — Developer Portal & Integrations'
related_docs:
  - 'docs/rfcs/README.md'
  - 'docs/rfcs/RFC Template.md'
  - 'docs/rfcs/0001-rfc-process.md'
  - 'docs/rfcs/0002-monorepo-library-boundaries.md'
  - 'docs/releases/0.1/README.md'
  - 'docs/releases/0.1/Release.md'
supersedes: []
superseded_by: []
tags:
  - rfc
  - api
  - routes
  - versioning
  - services
  - integrations
  - architecture
---

# 0003 — API Versioning and Route Strategy

Status: Implemented
Created: 2026-07-09
Updated: 2026-07-09
Owner: Tim Pierce / SinLess Games
Reviewed By: Timothy Pierce
Reviewed On: 2026-07-09
Implemented By: Timothy Pierce
Implemented On: 2026-07-09
Related Release: `0.1 — Foundation & Workspace`

---

## Summary

This RFC defines the API versioning and route strategy for Aerealith AI.

Aerealith should use a clear, versioned API route structure:

```text
/api/V#/
```

The canonical first production API version is:

```text
/api/V1/
```

This RFC is marked as implemented because the initial API versioning and route decision has been reviewed and accepted by Timothy Pierce.

---

## Context

Aerealith AI is a platform with multiple services, integrations, modules, workflows, developer-facing APIs, and internal system boundaries.

As the project grows, route structure must stay predictable.

Without a consistent API route strategy, Aerealith risks:

- inconsistent route naming
- unclear public/private API boundaries
- difficult version migrations
- broken client compatibility
- confusing developer documentation
- inconsistent service routing
- unclear integration routing
- accidental breaking changes
- hard-to-debug API behavior

API routes should be easy to read, easy to document, and easy to evolve.

---

## Problem

Aerealith needs one canonical route strategy before API and service work expands.

The project needs to decide:

```text
How API versions are represented.
Where services live.
Where integrations live.
Where internal routes live.
Where public routes live.
How breaking changes are handled.
How future API versions are introduced.
How route names should be formatted.
```

Without this decision, every service or integration could invent its own API layout.

That would create long-term API chaos.

Tiny route chaos becomes giant platform goblin later. Better to trap it now. 🧌

---

## Goals

This RFC should define:

```text
The canonical API route prefix.
The API version format.
The first API version.
Service route conventions.
Integration route conventions.
Internal route conventions.
Public route conventions.
Health route conventions.
Webhook route conventions.
Route naming rules.
Version compatibility rules.
Breaking change behavior.
```

---

## Non-Goals

This RFC does not define:

```text
The full public API contract.
The final authentication model.
The final authorization model.
The final service architecture.
The final integration runtime.
The final database schema.
The final SDK design.
The full developer portal.
The complete OpenAPI specification.
```

Those should be handled by later RFCs, architecture docs, or API docs.

---

## Proposed Decision

Aerealith should use this canonical API route format:

```text
/api/V#/
```

Where:

```text
api = API root namespace
V = uppercase version marker
# = major API version number
```

The first stable API version should be:

```text
/api/V1/
```

Examples:

```text
/api/V1/services/users
/api/V1/services/accounts
/api/V1/integrations/github
/api/V1/internal/health
/api/V1/webhooks/provider-name
```

The uppercase `V` is intentional.

Use:

```text
/api/V1/
```

Do not use:

```text
/api/v1/
/v1/api/
/api/1/
/api/version1/
```

---

## Canonical Route Prefix

The canonical route prefix is:

```text
/api/V#/
```

The first version is:

```text
/api/V1/
```

Future versions should follow the same pattern:

```text
/api/V2/
/api/V3/
```

Version numbers represent major API compatibility versions.

Minor changes should not require a new API version unless they break compatibility.

---

## Route Categories

Aerealith API routes should be grouped into major route categories.

```text
/api/V1/services/
/api/V1/integrations/
/api/V1/modules/
/api/V1/workflows/
/api/V1/webhooks/
/api/V1/internal/
/api/V1/health/
```

Not every category must be implemented immediately.

This RFC defines the route strategy so future systems have a stable home.

---

## Route Category Responsibilities

| Route Prefix            | Responsibility                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `/api/V1/services/`     | Platform-owned service APIs and service-facing routes.                                   |
| `/api/V1/integrations/` | Provider/integration APIs, callbacks, connection actions, and integration-facing routes. |
| `/api/V1/modules/`      | Module registry, module configuration, module lifecycle, and module-facing routes.       |
| `/api/V1/workflows/`    | Workflow records, workflow execution, automation suggestions, and approval gates.        |
| `/api/V1/webhooks/`     | Inbound provider webhooks and external event receivers.                                  |
| `/api/V1/internal/`     | Internal-only routes that should not be treated as public API.                           |
| `/api/V1/health/`       | Health checks, readiness checks, and platform status routes.                             |

---

## Service Routes

Services should use:

```text
/api/V1/services/{serviceId}
```

Examples:

```text
/api/V1/services/users
/api/V1/services/accounts
/api/V1/services/identity
/api/V1/services/audit
/api/V1/services/notifications
```

Service-specific child routes may use nouns and scoped actions.

Examples:

```text
/api/V1/services/users/{userId}
/api/V1/services/accounts/{accountId}/settings
/api/V1/services/audit/events
/api/V1/services/notifications/preferences
```

---

## Integration Routes

Integrations should use:

```text
/api/V1/integrations/{integrationId}
```

Examples:

```text
/api/V1/integrations/github
/api/V1/integrations/google
/api/V1/integrations/cloudflare
/api/V1/integrations/email
/api/V1/integrations/storage
```

Integration child routes may include:

```text
connect
disconnect
callback
health
settings
permissions
sync
```

Examples:

```text
/api/V1/integrations/github/connect
/api/V1/integrations/github/callback
/api/V1/integrations/github/health
/api/V1/integrations/email/settings
/api/V1/integrations/storage/sync
```

---

## Module Routes

Modules should use:

```text
/api/V1/modules/{moduleId}
```

Examples:

```text
/api/V1/modules
/api/V1/modules/{moduleId}
/api/V1/modules/{moduleId}/enable
/api/V1/modules/{moduleId}/disable
/api/V1/modules/{moduleId}/settings
```

Module identifiers should be stable.

Module route naming should avoid provider-specific assumptions unless the module itself is provider-specific.

---

## Workflow Routes

Workflows should use:

```text
/api/V1/workflows/
```

Examples:

```text
/api/V1/workflows
/api/V1/workflows/{workflowId}
api/V1/workflows/{workflowId}/runs
/api/V1/workflows/{workflowId}/approve
/api/V1/workflows/{workflowId}/disable
```

Workflow routes should be explicit when an action changes state.

Approval routes should be clearly named.

---

## Webhook Routes

Webhooks should use:

```text
/api/V1/webhooks/{providerId}
```

Examples:

```text
/api/V1/webhooks/github
/api/V1/webhooks/google
/api/V1/webhooks/cloudflare
/api/V1/webhooks/email
```

Webhook routes should be treated as external ingress points.

Webhook routes should require:

```text
signature verification where supported
idempotency protection where practical
logging
rate limit awareness
clear failure behavior
```

---

## Internal Routes

Internal routes should use:

```text
/api/V1/internal/
```

Examples:

```text
/api/V1/internal/health
/api/V1/internal/queues
/api/V1/internal/jobs
/api/V1/internal/diagnostics
```

Internal routes are not public API.

They should not be documented as stable developer-facing contracts unless explicitly promoted.

Internal routes should still follow security and audit expectations where relevant.

---

## Health Routes

Health routes should use:

```text
/api/V1/health/
```

Examples:

```text
/api/V1/health
/api/V1/health/readiness
/api/V1/health/liveness
/api/V1/health/integrations
```

Health routes should not expose secrets.

Public health routes should provide minimal information.

Private health routes may include richer diagnostics if protected.

---

## Public vs Internal API

Aerealith should distinguish public and internal routes.

Public API routes may be documented and supported for clients.

Internal API routes are implementation details.

| API Type        | Route Pattern              | Stability                     |
| --------------- | -------------------------- | ----------------------------- |
| Public API      | `/api/V1/services/...`     | Stable within major version.  |
| Integration API | `/api/V1/integrations/...` | Stable where documented.      |
| Webhook API     | `/api/V1/webhooks/...`     | Stable where provider-facing. |
| Internal API    | `/api/V1/internal/...`     | Not stable unless documented. |
| Health API      | `/api/V1/health/...`       | Stable enough for operations. |

---

## Route Naming Rules

Use lowercase route segments except the API version marker.

Correct:

```text
/api/V1/services/users
/api/V1/integrations/github
/api/V1/modules/content-moderation
/api/V1/workflows/{workflowId}/approve
```

Incorrect:

```text
/api/v1/services/users
/api/V1/Services/Users
/api/V1/integrations/GitHub
/api/V1/workflows/{workflowId}/Approve
```

Rules:

```text
Use /api/V#/ as the API version prefix.
Use uppercase V for version marker.
Use lowercase route segments after the version.
Use kebab-case for multi-word route segments.
Use nouns for resources.
Use explicit action segments only when needed.
Use stable IDs in path params.
Avoid leaking internal implementation names into public routes.
```

---

## HTTP Method Strategy

Use HTTP methods consistently.

| Method   | Use                                           |
| -------- | --------------------------------------------- |
| `GET`    | Read data.                                    |
| `POST`   | Create resources or trigger explicit actions. |
| `PUT`    | Replace a resource.                           |
| `PATCH`  | Partially update a resource.                  |
| `DELETE` | Delete or disconnect a resource.              |

Examples:

```text
GET /api/V1/services/users/{userId}
PATCH /api/V1/services/users/{userId}
POST /api/V1/modules/{moduleId}/enable
POST /api/V1/workflows/{workflowId}/approve
DELETE /api/V1/integrations/github
```

---

## Action Route Strategy

Most routes should be resource-oriented.

Action routes are allowed when the action is clearer than pretending it is a resource update.

Allowed action examples:

```text
enable
disable
approve
reject
connect
disconnect
sync
retry
cancel
```

Examples:

```text
POST /api/V1/modules/{moduleId}/enable
POST /api/V1/modules/{moduleId}/disable
POST /api/V1/workflows/{workflowId}/approve
POST /api/V1/integrations/github/sync
```

Avoid vague action names:

```text
do
runThing
process
handle
magic
```

---

## Path Parameter Naming

Use descriptive parameter names.

Examples:

```text
{userId}
{accountId}
{serviceId}
{integrationId}
{moduleId}
{workflowId}
{eventId}
```

Avoid:

```text
{id}
{thing}
{name}
{x}
```

Generic `{id}` may be acceptable in local documentation examples, but implementation should prefer descriptive names.

---

## Query Parameter Strategy

Query parameters should be used for filtering, sorting, pagination, and optional read modifiers.

Examples:

```text
?limit=50
?cursor=abc123
?status=active
?sort=createdAt
?direction=desc
```

Query parameters should not be used to hide destructive actions.

Avoid:

```text
GET /api/V1/modules/{moduleId}?enable=true
GET /api/V1/workflows/{workflowId}?delete=true
```

Destructive or state-changing behavior should use explicit methods and routes.

---

## Request and Response Strategy

This RFC does not define the full API response shape.

However, all API routes should eventually follow consistent request and response conventions.

Expected future behavior:

```text
stable success shape
stable error shape
request ID support
trace ID support
pagination shape
validation error shape
auth error shape
rate limit error shape
```

The exact error and result model is owned by:

```text
RFC 0004 — Error and Result Model
```

---

## Request ID Strategy

API routes should support request IDs.

Future expected header:

```text
x-request-id
```

If a request ID is not provided, Aerealith should generate one where practical.

Request IDs should help connect:

```text
API response
logs
audit events
traces
error reports
support diagnostics
```

---

## Version Compatibility Rules

Within a major API version, avoid breaking changes.

Compatible changes may include:

```text
Adding optional fields.
Adding new routes.
Adding new optional query parameters.
Adding new enum values only when clients can safely ignore them.
Improving validation messages without changing error codes.
Adding metadata fields.
```

Breaking changes include:

```text
Removing fields.
Renaming fields.
Changing required fields.
Changing route paths.
Changing response shape.
Changing error code meanings.
Changing authentication requirements unexpectedly.
Changing behavior of existing actions in incompatible ways.
```

Breaking changes should require a new major API version unless explicitly handled through a migration path.

---

## Version Migration Strategy

When a future major version is needed:

```text
Add /api/V2/.
Keep /api/V1/ available during migration where practical.
Document differences.
Provide migration notes.
Avoid sudden removal of old routes.
Deprecate old routes before removal.
```

Example:

```text
/api/V1/services/users
/api/V2/services/users
```

Version migration should be explicit.

Do not silently change `/api/V1/` behavior in a breaking way.

---

## Deprecation Strategy

Deprecated routes should be documented.

Deprecation documentation should include:

```text
Deprecated route
Replacement route
Reason
Timeline
Migration notes
Removal target
```

Deprecated responses may include headers later.

Possible future headers:

```text
Deprecation
Sunset
Link
```

This RFC does not require these headers immediately.

---

## Route Ownership

Each route should have an owner.

Ownership may be documented by:

```text
service
integration
module
workflow system
internal platform
operations
```

Route ownership should help answer:

```text
Who maintains this route?
Where is its implementation?
Where is its contract?
Where are its tests?
Where is it documented?
```

---

## Documentation Strategy

Public and provider-facing routes should be documented.

API docs should eventually live in:

```text
docs/api/
```

Potential docs:

```text
docs/api/README.md
docs/api/Versioning.md
docs/api/Routes.md
docs/api/Errors.md
docs/api/Authentication.md
docs/api/Pagination.md
docs/api/Webhooks.md
```

Service-specific API docs may live under:

```text
docs/services/
```

Integration-specific API docs may live under:

```text
docs/integrations/
```

---

## Relationship to Monorepo Boundaries

This RFC builds on:

```text
RFC 0002 — Monorepo Library Boundaries
```

Route strategy should align with the approved repo structure:

```text
apps/
apps/services/
apps/integrations/
libs/
```

Service routes should map naturally to service apps or service handlers.

Integration routes should map naturally to integration apps or integration handlers.

Shared contracts should live in libraries, not inside one runtime app.

---

## Examples

### Services

```text
GET /api/V1/services/users
GET /api/V1/services/users/{userId}
PATCH /api/V1/services/users/{userId}
GET /api/V1/services/accounts/{accountId}/settings
```

### Integrations

```text
GET /api/V1/integrations
GET /api/V1/integrations/github
POST /api/V1/integrations/github/connect
POST /api/V1/integrations/github/sync
DELETE /api/V1/integrations/github
```

### Modules

```text
GET /api/V1/modules
GET /api/V1/modules/{moduleId}
POST /api/V1/modules/{moduleId}/enable
POST /api/V1/modules/{moduleId}/disable
PATCH /api/V1/modules/{moduleId}/settings
```

### Workflows

```text
GET /api/V1/workflows
GET /api/V1/workflows/{workflowId}
POST /api/V1/workflows/{workflowId}/approve
POST /api/V1/workflows/{workflowId}/reject
GET /api/V1/workflows/{workflowId}/runs
```

### Health

```text
GET /api/V1/health
GET /api/V1/health/readiness
GET /api/V1/health/liveness
GET /api/V1/health/integrations
```

---

## Alternatives Considered

| Option                | Summary                               | Why Not                                                                  |
| --------------------- | ------------------------------------- | ------------------------------------------------------------------------ |
| `/api/v1/`            | Common lowercase version prefix.      | Project standard is uppercase `V#` for stronger visual version identity. |
| `/v1/api/`            | Version before API namespace.         | Less readable and less aligned with API root grouping.                   |
| `/api/1/`             | Number-only version segment.          | Less explicit than `V1`.                                                 |
| `/api/version/1/`     | Verbose version segment.              | Too long and noisy.                                                      |
| No version prefix     | Routes begin directly under `/api/`.  | Makes future breaking changes harder.                                    |
| Provider-first routes | Routes grouped primarily by provider. | Makes platform routes harder to reason about as providers grow.          |

---

## Tradeoffs

| Benefit                                | Cost                                           |
| -------------------------------------- | ---------------------------------------------- |
| Clear versioning                       | Slightly more verbose paths.                   |
| Strong API identity                    | Uppercase `V` must be remembered consistently. |
| Easier future migrations               | Requires discipline around compatibility.      |
| Better docs organization               | Requires route ownership documentation.        |
| Cleaner service/integration separation | Some shared logic must move into libraries.    |

---

## Risks

```text
Developers may accidentally use /api/v1/ instead of /api/V1/.
Routes may become too action-heavy.
Internal routes may accidentally become public contracts.
Breaking changes may be made inside V1.
Integration routes may leak provider-specific behavior into shared APIs.
Service and integration boundaries may blur.
```

---

## Mitigations

```text
Document /api/V#/ as the canonical prefix.
Use route helpers/constants where practical.
Add route tests where practical.
Add API docs early.
Review route additions during PRs.
Track public vs internal routes.
Require new major versions for breaking changes.
Keep shared route contracts in libraries.
```

---

## Security and Trust Impact

This RFC has indirect security and trust impact.

Clear route boundaries help with:

```text
authentication
authorization
audit logging
request tracing
provider callback safety
public/internal route separation
destructive action review
permission-aware APIs
```

This RFC does not directly implement security behavior.

Security requirements should be defined in later API, auth, and trust RFCs.

---

## Privacy Impact

This RFC does not directly process, store, expose, or delete private user data.

It does affect future privacy boundaries by defining where API routes live.

Routes that expose private user, account, community, integration, or workflow data must be protected by future authentication and authorization rules.

---

## AI Impact

This RFC does not directly change AI behavior.

Future AI-facing APIs should follow the same route strategy:

```text
/api/V1/services/assistant
/api/V1/services/memory
/api/V1/workflows/{workflowId}/approve
```

AI-related routes must still follow permission, approval, audit, and privacy requirements.

---

## Self-Hosting and Provider Impact

This RFC supports future self-hosting by keeping route structure provider-neutral.

Routes should not hardcode one infrastructure provider into the public API shape unless the route is specifically integration/provider-facing.

Provider-specific routes should live under:

```text
/api/V1/integrations/{integrationId}
```

Provider-neutral platform behavior should live under:

```text
/api/V1/services/
```

---

## Migration Plan

Because this is an early foundational RFC, no production API migration is required.

Migration steps for existing informal routes:

```text
Identify any existing API routes.
Move public API routes under /api/V1/.
Move service routes under /api/V1/services/.
Move integration routes under /api/V1/integrations/.
Move webhook routes under /api/V1/webhooks/.
Move internal-only routes under /api/V1/internal/.
Update docs.
Update route constants.
Update tests.
```

---

## Rollout Plan

```text
Accept this RFC.
Mark this RFC as implemented.
Use /api/V1/ for the first API version.
Document route conventions in API docs.
Create route constants/helpers where useful.
Apply route strategy during 0.5 API & Service Platform.
Review future routes against this RFC.
```

---

## Acceptance Criteria

This RFC is accepted when:

```text
The canonical API prefix is defined as /api/V#/.
The first API version is defined as /api/V1/.
Service route conventions are defined.
Integration route conventions are defined.
Module route conventions are defined.
Workflow route conventions are defined.
Webhook route conventions are defined.
Internal route conventions are defined.
Health route conventions are defined.
Route naming rules are defined.
Version compatibility rules are defined.
Breaking change rules are defined.
Migration expectations are defined.
```

---

## Implementation Checklist

```text
Mark RFC as reviewed by Timothy Pierce.
Mark RFC as implemented by Timothy Pierce.
Use /api/V#/ as canonical API prefix.
Use /api/V1/ as first stable API version.
Avoid /api/v1/.
Update release 0.1 architecture notes if needed.
Update future API docs with this route standard.
Create route constants/helpers during API implementation.
Use this strategy for future service and integration routes.
```

---

## Testing Requirements

This RFC is documentation and architecture-only.

Testing requires:

```text
Markdownlint passes.
Only one H1 exists.
Tables follow markdownlint spacing.
Frontmatter is valid YAML.
Route examples consistently use /api/V1/.
No examples use /api/v1/ as the canonical path.
Docs are internally consistent.
```

Future implementation testing may include:

```text
Route helper unit tests.
API route smoke tests.
Public route compatibility tests.
Internal route access tests.
Webhook route tests.
Health route tests.
```

---

## Documentation Updates

If this RFC changes, update or verify:

```text
docs/rfcs/README.md
docs/releases/0.1/README.md
docs/releases/0.1/Release.md
docs/releases/0.1/Architecture Changes.md
docs/releases/0.1/Checklist.md
docs/api/README.md
docs/api/Versioning.md
docs/api/Routes.md
docs/architecture/System Architecture.md
docs/engineering/README.md
```

---

## Open Questions

```text
Should API routes be generated from route constants?
Should route constants live in libs/core or libs/contracts?
Should public API docs be generated from OpenAPI later?
Should internal routes use a separate hostname later?
Should webhooks remain under /api/V1/webhooks/ or move to /webhooks/V1/ later?
Should version deprecation headers be required in V2 and beyond?
```

---

## Decision

```text
Accepted and implemented.
```

---

## Decision Notes

```text
Reviewed by Timothy Pierce on 2026-07-09.
Implemented by Timothy Pierce on 2026-07-09.
The approved canonical API versioning format is /api/V#/.
The first stable API version is /api/V1/.
The lowercase /api/v1/ style is intentionally not the canonical format.
```

---

## References

```text
docs/rfcs/README.md
docs/rfcs/RFC Template.md
docs/rfcs/0001-rfc-process.md
docs/rfcs/0002-monorepo-library-boundaries.md
docs/releases/0.1/README.md
docs/releases/0.1/Release.md
```

---

## Final Standard

Aerealith API routes should be predictable, versioned, and boring in the best way.

The standard is:

> All stable Aerealith API routes live under `/api/V#/`, beginning with `/api/V1/`, with clear service, integration, module, workflow, webhook, internal, and health route boundaries.
