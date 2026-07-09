---
title: 'Entity, Schema, and Contract Strategy'
rfc: '0005'
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
related_release: '0.2 — Core Domain & Data Platform'
future_releases:
  - '0.3 — Authentication & Identity'
  - '0.5 — API & Service Platform'
  - '0.6 — Developer Portal & Integrations'
related_docs:
  - 'docs/rfcs/README.md'
  - 'docs/rfcs/RFC Template.md'
  - 'docs/rfcs/0001-rfc-process.md'
  - 'docs/rfcs/0002-monorepo-library-boundaries.md'
  - 'docs/rfcs/0003-api-versioning-and-route-strategy.md'
  - 'docs/rfcs/0004-error-and-result-model.md'
  - 'docs/releases/0.1/README.md'
  - 'docs/releases/0.1/Release.md'
supersedes: []
superseded_by: []
tags:
  - rfc
  - entities
  - schemas
  - contracts
  - validation
  - data
  - architecture
---

# 0005 — Entity, Schema, and Contract Strategy

Status: Implemented
Created: 2026-07-09
Updated: 2026-07-09
Owner: Tim Pierce / SinLess Games
Reviewed By: Timothy Pierce
Reviewed On: 2026-07-09
Implemented By: Timothy Pierce
Implemented On: 2026-07-09
Related Release: `0.2 — Core Domain & Data Platform`

---

## Summary

This RFC defines how Aerealith AI should organize entities, schemas, DTOs, and contracts.

Aerealith should separate:

```text
domain entities
persistence entities
validation schemas
API contracts
DTOs
mappers
database migrations
```

The goal is to keep data modeling clean, strongly typed, validation-friendly, and safe to expose through APIs.

Entities should not leak database implementation details into public contracts.

Contracts should not depend on database models.

Schemas should validate data at boundaries.

This RFC is marked as implemented because the initial entity, schema, and contract strategy has been reviewed and accepted by Timothy Pierce.

---

## Context

Aerealith will have many platform domains over time.

Examples:

```text
users
accounts
sessions
profiles
settings
services
integrations
modules
workflows
notifications
audit events
organizations
billing later
marketplace later
```

These systems need a consistent way to define:

- what data exists
- how it is validated
- how it is stored
- how it is exposed through APIs
- how it is shared between apps, services, integrations, and tools
- how changes are versioned and migrated

Without a strategy, data definitions can become duplicated, inconsistent, and unsafe.

---

## Problem

Aerealith needs clear boundaries between data concepts.

Without this RFC, the project risks:

```text
database entities being exposed directly through APIs
API DTOs being used as persistence models
validation being skipped or duplicated
schemas living in random folders
one model trying to serve every purpose
database-specific decorators leaking into shared contracts
unsafe fields being returned to clients
difficult migrations
inconsistent naming
hard-to-test data transformations
contracts changing accidentally
```

The platform needs a clean structure before release `0.2 — Core Domain & Data Platform`.

---

## Goals

This RFC should define:

```text
Where domain entities live.
Where persistence entities live.
Where schemas live.
Where API contracts live.
Where DTOs live.
Where mappers live.
How entities should be named.
How schemas should be named.
How contracts should be named.
How validation should work.
How database models and API models stay separate.
How Zod should be used.
How future generated types may fit.
```

---

## Non-Goals

This RFC does not define:

```text
The final database provider.
The final ORM implementation.
The complete database schema.
Every entity Aerealith will ever need.
The final public API contract.
The full migration system.
The full SDK generation system.
The complete authorization model.
```

Those decisions may be handled by later RFCs, architecture docs, or implementation tasks.

---

## Proposed Decision

Aerealith should use a layered data model.

The layers are:

| Layer              | Purpose                                                            | Location                                           |
| ------------------ | ------------------------------------------------------------------ | -------------------------------------------------- |
| Domain Entity      | Platform concept without database-specific implementation details. | `libs/core/src/entities/`                          |
| Persistence Entity | Database/ORM-specific model used for storage.                      | `libs/db/src/entities/`                            |
| Schema             | Runtime validation for input, output, and domain rules.            | `libs/core/src/schemas/` and `libs/contracts/src/` |
| Contract           | API-facing request/response shape.                                 | `libs/contracts/src/`                              |
| DTO                | Data transfer object used across API/service boundaries.           | `libs/contracts/src/`                              |
| Mapper             | Converts between persistence, domain, and contract shapes.         | app/service layer or dedicated mapper folders      |
| Migration          | Database change history.                                           | `libs/db/src/migrations/`                          |

Core rule:

```text
Database entities are not API contracts.
API contracts are not database entities.
Schemas validate boundaries.
Mappers translate between layers.
```

---

## Approved Folder Strategy

Recommended initial structure:

```text
libs/
├── core/
│   └── src/
│       ├── entities/
│       ├── schemas/
│       ├── types/
│       ├── enums/
│       └── utils/
├── contracts/
│   └── src/
│       ├── api/
│       ├── dto/
│       ├── requests/
│       ├── responses/
│       └── schemas/
└── db/
    └── src/
        ├── entities/
        ├── migrations/
        ├── repositories/
        └── mappers/
```

Apps and services may also have local mappers when the mapping is specific to one runtime boundary.

Example:

```text
apps/services/api/src/mappers/
apps/services/accounts/src/mappers/
apps/integrations/example/src/mappers/
```

---

## Entity Types

Aerealith should distinguish between domain entities and persistence entities.

### Domain Entities

Domain entities represent platform concepts.

They should be provider-neutral and database-neutral.

Examples:

```text
User
Account
Profile
IntegrationConnection
Workflow
AuditEvent
```

Domain entities should live in:

```text
libs/core/src/entities/
```

Domain entities may be:

```text
interfaces
types
classes
plain objects
readonly object models
```

They should not contain database decorators or ORM-specific behavior.

---

### Persistence Entities

Persistence entities represent how data is stored.

They may include database-specific or ORM-specific configuration.

Persistence entities should live in:

```text
libs/db/src/entities/
```

Persistence entities may include:

```text
table names
column mappings
indexes
relations
database defaults
ORM decorators or metadata
```

Persistence entities should not be returned directly from public APIs.

---

## One Entity Per File Rule

Entities should be defined one per file.

Good:

```text
libs/core/src/entities/user/user.entity.ts
libs/core/src/entities/account/account.entity.ts
libs/db/src/entities/user/user.persistence-entity.ts
libs/db/src/entities/account/account.persistence-entity.ts
```

Avoid:

```text
libs/core/src/entities/all-entities.ts
libs/db/src/entities/models.ts
libs/db/src/entities/everything.ts
```

One entity per file keeps models easier to review, test, refactor, and document.

---

## Naming Standards

Use predictable names.

### Domain Entity Files

```text
user.entity.ts
account.entity.ts
profile.entity.ts
integration-connection.entity.ts
workflow.entity.ts
audit-event.entity.ts
```

### Persistence Entity Files

```text
user.persistence-entity.ts
account.persistence-entity.ts
profile.persistence-entity.ts
integration-connection.persistence-entity.ts
workflow.persistence-entity.ts
audit-event.persistence-entity.ts
```

### Schema Files

```text
user.schema.ts
create-user.schema.ts
update-user.schema.ts
user-response.schema.ts
```

### Contract Files

```text
create-user.request.ts
update-user.request.ts
user.response.ts
user.contract.ts
```

### Mapper Files

```text
user.mapper.ts
account.mapper.ts
workflow.mapper.ts
audit-event.mapper.ts
```

---

## Schema Strategy

Aerealith should use runtime schemas to validate data at boundaries.

Recommended validation library:

```text
Zod
```

Schemas should be used for:

```text
API request validation
API response validation where useful
environment/config validation
domain input validation
integration payload validation
webhook payload validation
workflow config validation
module config validation
```

Schemas should not be skipped just because TypeScript types exist.

TypeScript checks compile time.

Schemas check runtime.

Aerealith needs both.

---

## Core Schemas

Core schemas should live in:

```text
libs/core/src/schemas/
```

Core schemas should be reusable, platform-level primitives.

Examples:

```text
email.schema.ts
id.schema.ts
slug.schema.ts
date-time.schema.ts
url.schema.ts
pagination.schema.ts
```

Core schemas may validate:

```text
email shape
ID shape
slug shape
ISO datetime strings
URLs
pagination primitives
shared enum values
```

Core schemas should not depend on database models.

---

## Contract Schemas

Contract schemas should live in:

```text
libs/contracts/src/schemas/
```

Contract schemas define API-facing request and response validation.

Examples:

```text
create-user.request.schema.ts
update-user.request.schema.ts
user.response.schema.ts
list-users.response.schema.ts
```

Contracts may depend on core schemas.

Contracts should not depend on database entities.

---

## DTO Strategy

DTOs should represent data moving across service/API boundaries.

DTOs should live in:

```text
libs/contracts/src/dto/
```

Examples:

```text
user.dto.ts
account.dto.ts
integration-connection.dto.ts
workflow.dto.ts
audit-event.dto.ts
```

DTOs should be safe to expose only if they are intentionally designed as response models.

Do not use persistence entities as DTOs.

Do not accidentally include sensitive fields.

---

## API Contract Strategy

API contracts define request and response shapes for versioned API routes.

API contracts should align with:

```text
/api/V#/
```

Example route:

```text
POST /api/V1/services/users
```

Possible contract files:

```text
libs/contracts/src/api/V1/services/users/create-user.request.ts
libs/contracts/src/api/V1/services/users/create-user.response.ts
libs/contracts/src/api/V1/services/users/user.contract.ts
```

Contracts should define:

```text
request body
response body
params where useful
query where useful
validation schema
inferred TypeScript type
```

---

## Contract Versioning

Contracts should be version-aware.

Recommended path style:

```text
libs/contracts/src/api/V1/
```

Future major versions may use:

```text
libs/contracts/src/api/V2/
```

Contract compatibility should follow the API versioning strategy from:

```text
RFC 0003 — API Versioning and Route Strategy
```

Breaking API contract changes should not be made casually inside the same major API version.

---

## Type Inference Strategy

When using Zod, infer TypeScript types from schemas when practical.

Example:

```ts
import { z } from 'zod'

export const CreateUserRequestSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(120),
})

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>
```

This keeps runtime validation and TypeScript types aligned.

Avoid writing separate manual types that drift from schemas unless there is a clear reason.

---

## Entity Example

Domain entity:

```ts
export interface UserEntity {
  readonly id: string
  readonly email: string
  readonly displayName: string
  readonly createdAt: string
  readonly updatedAt: string
}
```

Persistence entity:

```ts
export interface UserPersistenceEntity {
  readonly id: string
  readonly email: string
  readonly displayName: string
  readonly createdAt: Date
  readonly updatedAt: Date
}
```

API response contract:

```ts
export interface UserResponse {
  readonly id: string
  readonly email: string
  readonly displayName: string
  readonly createdAt: string
  readonly updatedAt: string
}
```

These may look similar early.

They should still be treated as separate layers.

That separation prevents painful future refactors.

---

## Mapper Strategy

Mappers convert between layers.

Examples:

```text
persistence entity -> domain entity
domain entity -> API response
API request -> domain input
integration payload -> domain input
```

Example:

```ts
export function mapUserPersistenceToDomain(
  entity: UserPersistenceEntity,
): UserEntity {
  return {
    id: entity.id,
    email: entity.email,
    displayName: entity.displayName,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  }
}
```

Mappers should be simple, explicit, and testable.

Do not hide large amounts of business logic in mappers.

---

## Normalization Strategy

Normalize data before persistence when appropriate.

Examples:

```text
Trim email addresses.
Lowercase email addresses.
Trim display names.
Normalize slugs.
Normalize URLs.
Convert dates to expected formats.
```

Example:

```ts
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
```

Normalization helpers should live in shared libraries when reused.

---

## Validation Boundary Rules

Validate data at boundaries.

Important boundaries:

```text
API requests
integration callbacks
webhooks
environment variables
database writes
workflow definitions
module configuration
admin/support inputs
developer-facing APIs
```

Do not rely only on frontend validation.

Do not trust provider payloads without validation.

Do not trust internal calls blindly when crossing service boundaries.

---

## Sensitive Field Strategy

Sensitive fields must not be exposed through API contracts unless explicitly intended.

Sensitive examples:

```text
password hashes
tokens
OAuth secrets
session secrets
private provider credentials
internal notes
private audit details
raw webhook payloads
internal diagnostic fields
```

Public response contracts should be intentionally designed.

Never return persistence entities directly as API responses.

---

## ID Strategy

IDs should be opaque to clients.

Do not expose database implementation details through IDs.

Recommended early rule:

```text
Use stable string IDs in contracts.
Do not expose auto-increment assumptions in public contracts.
Do not require clients to understand database internals.
```

The exact ID generation strategy may be defined in a later RFC or engineering doc.

---

## Date and Time Strategy

Contracts should use string timestamps.

Recommended format:

```text
ISO 8601 string
```

Example:

```text
2026-07-09T00:00:00.000Z
```

Persistence layers may use native `Date` objects or database-specific date types.

Mappers should convert persistence dates to contract-safe strings.

---

## Enum Strategy

Shared enums should live in core when they represent platform concepts.

Examples:

```text
libs/core/src/enums/
libs/core/src/entities/*/enums/
```

API-specific enum schemas may live in contracts.

Enums exposed through public contracts should be treated as compatibility-sensitive.

Adding enum values can break clients that do not handle unknown values.

Document enum changes carefully.

---

## Repository and Data Access Strategy

Data access should not be scattered across apps.

Database access should be organized in:

```text
libs/db/src/repositories/
```

or service-specific persistence adapters where appropriate.

Repository methods should return domain entities or results, not raw database details, unless the caller is explicitly persistence-aware.

Expected result style should follow:

```text
RFC 0004 — Error and Result Model
```

---

## Migration Strategy

Database migrations should live in:

```text
libs/db/src/migrations/
```

Migration files should be:

```text
ordered
reviewable
repeatable
documented when risky
```

Schema changes should include migration notes when they affect persisted data.

---

## Relationship to Monorepo Boundaries

This RFC builds on:

```text
RFC 0002 — Monorepo Library Boundaries
```

Boundary expectations:

```text
libs/core contains domain-level shared types and schemas.
libs/contracts contains API contracts and DTOs.
libs/db contains persistence entities and migrations.
apps/services use contracts, core, and db as needed.
apps/integrations use contracts and core as needed.
tools may use schemas/contracts for generation and validation when useful.
```

Libraries should still avoid unnecessary cross-library dependencies.

When cross-library dependencies are needed, they should be intentional and documented.

---

## Relationship to Error Model

This RFC builds on:

```text
RFC 0004 — Error and Result Model
```

Validation failures should use platform error codes and result patterns.

Examples:

```text
COMMON_VALIDATION_ERROR
DATABASE_RECORD_NOT_FOUND
API_UNSUPPORTED_VERSION
```

Expected validation failures should generally return typed results.

Unexpected mapping or persistence failures may throw structured platform errors.

---

## Relationship to API Versioning

This RFC builds on:

```text
RFC 0003 — API Versioning and Route Strategy
```

API contracts should align with:

```text
/api/V#/
```

Contracts should be version-aware.

Example:

```text
libs/contracts/src/api/V1/services/users/
```

Future breaking contract changes should use a new API version.

---

## Example File Layout

Example user domain layout:

```text
libs/core/src/entities/user/user.entity.ts
libs/core/src/entities/user/user-role.enum.ts
libs/core/src/schemas/email.schema.ts

libs/contracts/src/api/V1/services/users/create-user.request.schema.ts
libs/contracts/src/api/V1/services/users/create-user.response.schema.ts
libs/contracts/src/api/V1/services/users/user.response.schema.ts

libs/db/src/entities/user/user.persistence-entity.ts
libs/db/src/repositories/user.repository.ts
libs/db/src/mappers/user.mapper.ts
libs/db/src/migrations/0001-create-users.ts
```

This is an example, not the only allowed structure.

The main rule is separation.

---

## Alternatives Considered

| Option                              | Summary                                            | Why Not                                                  |
| ----------------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| One model for everything            | Use the same object for DB, domain, and API.       | Fast early, painful later, easy to leak private fields.  |
| Database-first contracts            | Generate public contracts directly from DB models. | Exposes persistence decisions and weakens API stability. |
| Contract-first only                 | Define everything from API contracts.              | Poor fit for internal domain and persistence concerns.   |
| No runtime schemas                  | Use TypeScript types only.                         | TypeScript does not validate runtime input.              |
| Schemas everywhere with no layering | Put schemas anywhere they are needed.              | Leads to duplication and unclear ownership.              |
| App-local entities                  | Define entities inside services/apps only.         | Causes duplication and weak shared domain modeling.      |

---

## Tradeoffs

| Benefit                              | Cost                                           |
| ------------------------------------ | ---------------------------------------------- |
| Clear separation between layers      | More files to maintain.                        |
| Safer API responses                  | Requires mapper discipline.                    |
| Runtime validation                   | Requires schema maintenance.                   |
| Better future API versioning         | Requires contract organization.                |
| Easier provider/database replacement | Requires persistence details to stay isolated. |
| Better testing                       | Requires mapper and schema tests.              |

---

## Risks

```text
Developers may bypass contracts and return persistence entities.
Schemas and types may drift if not inferred from schemas.
Mappers may become bloated with business logic.
Too many folders may feel heavy early.
Database details may leak into contracts.
Contracts may be changed without version awareness.
Sensitive fields may be accidentally exposed.
Validation may be skipped in internal paths.
```

---

## Mitigations

```text
Use one entity per file.
Keep schemas close to contract boundaries.
Infer types from schemas where practical.
Write mapper tests.
Review response contracts for sensitive fields.
Do not return persistence entities from APIs.
Document API versioning rules.
Use shared core schemas for primitives.
Use clear naming conventions.
Add generators later to reduce boilerplate.
```

---

## Security and Trust Impact

This RFC has direct security and trust impact.

Good entity and contract boundaries help prevent:

```text
private fields leaking to API clients
tokens appearing in responses
internal database details being exposed
unsafe provider payloads being trusted
validation bypasses
confusing or unstable API responses
```

Security-sensitive data should be excluded from public contracts by default.

APIs should return only intentionally designed response shapes.

---

## Privacy Impact

This RFC has direct privacy impact.

Entities may contain private user, organization, service, integration, workflow, or audit data.

Privacy expectations:

```text
Public contracts must not expose private fields by accident.
Sensitive persistence fields must be intentionally mapped.
Raw provider payloads should not become public DTOs.
Deletion/export requirements should be considered when modeling data.
Audit and diagnostic fields should be scoped carefully.
```

Future privacy docs should define deeper retention, export, and deletion behavior.

---

## AI Impact

This RFC has indirect AI impact.

Future AI systems will use entities, schemas, and contracts for context, memory, workflows, and actions.

AI-related data models should follow the same rules:

```text
AI memory entities are not API response contracts.
AI context schemas validate runtime data.
AI action contracts define approval-safe inputs.
AI outputs should be validated before trusted actions.
Sensitive prompt/context details should not leak through public contracts.
```

---

## Self-Hosting and Provider Impact

This RFC supports future self-hosting and provider replacement.

By separating domain models, persistence models, and contracts, Aerealith can change:

```text
database providers
storage providers
email providers
observability providers
AI providers
runtime hosts
```

without forcing public contracts to change unnecessarily.

Provider-specific data should stay isolated behind integration or persistence boundaries.

---

## Migration Plan

Because this is an early foundational RFC, no production migration is required.

Implementation migration should include:

```text
Create core entity folders.
Create core schema folders.
Create contract folders.
Create database entity folders.
Create mapper folders.
Move existing shared entities into libs/core where appropriate.
Move persistence-specific entities into libs/db.
Move API request/response types into libs/contracts.
Add Zod schemas for runtime validation.
Add mapper functions where data crosses boundaries.
Add tests for schemas and mappers.
```

---

## Rollout Plan

```text
Accept this RFC.
Mark this RFC as implemented.
Use the strategy during 0.2 core/domain work.
Create initial core entities and schemas.
Create initial contract structure.
Create initial persistence entity structure.
Use one entity per file.
Add mapper tests as models become real.
Update architecture and engineering docs as needed.
```

---

## Acceptance Criteria

This RFC is accepted when:

```text
Domain entity location is defined.
Persistence entity location is defined.
Schema locations are defined.
Contract location is defined.
DTO location is defined.
Mapper strategy is defined.
One entity per file rule is defined.
Zod validation strategy is defined.
API contract versioning is defined.
Sensitive field rules are defined.
Database-to-contract separation is defined.
Migration strategy is defined.
Testing expectations are defined.
```

---

## Implementation Checklist

```text
Mark RFC as reviewed by Timothy Pierce.
Mark RFC as implemented by Timothy Pierce.
Create libs/core/src/entities/.
Create libs/core/src/schemas/.
Create libs/contracts/src/.
Create libs/contracts/src/api/V1/.
Create libs/db/src/entities/.
Create libs/db/src/migrations/.
Create libs/db/src/repositories/.
Create mapper folders where needed.
Use one entity per file.
Use Zod for runtime schemas.
Infer types from schemas where practical.
Do not return persistence entities from API routes.
Document sensitive field handling.
```

---

## Testing Requirements

Testing should verify:

```text
Schemas accept valid input.
Schemas reject invalid input.
Inferred types align with expected contracts.
Mappers convert persistence entities to domain entities.
Mappers convert domain entities to response contracts.
Sensitive fields are not included in public response mappers.
Date fields serialize consistently.
Normalization helpers behave consistently.
Validation errors map to the platform error model.
```

Documentation-only testing requires:

```text
Markdownlint passes.
Only one H1 exists.
Tables follow markdownlint spacing.
Frontmatter is valid YAML.
Examples are internally consistent.
Folder names are consistent with RFC 0002.
API examples use /api/V#/ from RFC 0003.
```

---

## Documentation Updates

If this RFC changes, update or verify:

```text
docs/rfcs/README.md
docs/rfcs/RFC Template.md
docs/rfcs/0002-monorepo-library-boundaries.md
docs/rfcs/0003-api-versioning-and-route-strategy.md
docs/rfcs/0004-error-and-result-model.md
docs/releases/0.1/README.md
docs/releases/0.1/Architecture Changes.md
docs/releases/0.1/Checklist.md
docs/architecture/System Architecture.md
docs/engineering/README.md
docs/api/README.md
docs/api/Contracts.md
```

---

## Open Questions

```text
Should persistence entities be ORM classes, plain TypeScript objects, or adapter-specific models?
Should contracts be generated into OpenAPI later?
Should all API response schemas be runtime-validated in production or only at boundaries/tests?
Should mappers live mostly in libs/db or app/service layers?
Should entity IDs use prefixes such as user_, acct_, mod_, and wf_?
Should schema files use .schema.ts only or distinguish request.schema.ts and response.schema.ts?
Should DTO folders be separated by API version or by domain first?
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
The approved strategy separates domain entities, persistence entities, schemas, contracts, DTOs, and mappers.
Database entities must not be treated as public API contracts.
Runtime validation should use Zod where practical.
Entities should be defined one per file.
```

---

## References

```text
docs/rfcs/README.md
docs/rfcs/RFC Template.md
docs/rfcs/0001-rfc-process.md
docs/rfcs/0002-monorepo-library-boundaries.md
docs/rfcs/0003-api-versioning-and-route-strategy.md
docs/rfcs/0004-error-and-result-model.md
docs/releases/0.1/README.md
docs/releases/0.1/Release.md
```

---

## Final Standard

Aerealith data models should be clear, validated, and safe to expose.

The standard is:

> Domain entities describe platform concepts, persistence entities describe storage, schemas validate runtime data, contracts define API boundaries, and mappers keep those layers from leaking into each other.
