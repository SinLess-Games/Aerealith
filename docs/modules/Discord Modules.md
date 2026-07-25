# Discord Modules

**Status:** Active  
**Owner:** SinLess Games LLC  
**Product:** Aerealith  
**Last Reviewed:** 2026-07-23  
**Implementation Status:** Planned

## Summary

This document records the Discord module set accepted by
[DEC-002](../decisions/DEC-002-discord-mvp-module-scope.md). It is a product
specification, not an implementation claim. No Discord application, gateway
consumer, REST adapter, command registry, guild configuration store, or module
runtime was found in the inspected source.

All modules depend on the planned registry foundation, guild isolation,
Discord-native permission checks, Aerealith authorization, rate-limit-aware
provider access, structured audit events, and safe disable behavior.

## Shared Lifecycle and Interface

Every module must implement `Available → Enabled → Configured → Active →
Disabled`. Configuration survives disable and re-enable unless an authorized
user explicitly deletes it. A module manifest must declare a stable ID,
version, scope classification, configuration schema, dependencies, Discord
permissions, Aerealith permissions, actions, events, risk levels, audit
behavior, and disable behavior.

Discord writes must use a managed adapter and must not bypass authorization,
approval, idempotency, retry, or audit controls. Tenant data is isolated by
guild and Aerealith ownership boundary.

## Module Registry Foundation

**Status:** Planned  
**Scope:** MVP Required platform foundation; not a user-facing module.

The registry owns manifest validation, dependency resolution, lifecycle
transitions, per-guild configuration, enable and disable behavior, and module
health. It must reject duplicate IDs, invalid dependency graphs, unknown
configuration, and activation without required permissions.

**Failure handling:** Fail closed, retain the previous valid configuration,
emit an operator-visible error, and record the attempted transition.  
**Testing:** Cover registry schema, dependency cycles, lifecycle, configuration
migration, disable/re-enable, and guild isolation.

## Required Modules

### Core Discord Integration

**ID:** `mod.discord.core`  
**Status:** Planned  
**User value:** Connects an authorized Discord server to Aerealith.

Responsibilities include OAuth installation state, bot identity, managed
gateway and REST access, guild lifecycle events, provider health, and token
revocation. It does not grant feature modules permission to act. Installation
must verify guild ownership or delegated authority and store no raw provider
token in module configuration.

### Server Linking

**ID:** `mod.discord.server-linking`  
**Status:** Planned  
**User value:** Establishes and removes the explicit Aerealith-to-guild
ownership link.

Linking must be unique, auditable, reversible, and protected against
cross-tenant reassignment. Unlinking disables dependent modules before provider
access is revoked. It does not implement general identity federation.

### Permissions and Role Mapping

**ID:** `mod.discord.permissions`  
**Status:** Planned  
**User value:** Maps Discord roles to bounded Aerealith capabilities.

The module calculates the intersection of Discord permissions, role hierarchy,
Aerealith authorization, module state, and approval policy. Missing permission
or hierarchy information fails closed. Mapping changes and denied actions are
audited.

### Moderation Basics

**ID:** `mod.discord.moderation`  
**Status:** Planned  
**User value:** Provides explicit, reviewable baseline moderation actions.

Initial actions may include warning, timeout, kick, or ban only when release
scope, authorization, provider permission, hierarchy, risk, and approval checks
allow them. Automatic punishment and unrestricted AI execution are non-goals.
Each action needs actor, target, reason, guild, outcome, and provider reference.

### Automod Foundation

**ID:** `mod.discord.automod`  
**Status:** Planned  
**User value:** Applies deterministic, visible rules to supported Discord
events.

Rules require schemas, versions, enable state, evaluation traces, exemptions,
rate controls, and reversible configuration. AI output may suggest a rule but
cannot silently create or execute punitive automation. Event duplication and
out-of-order delivery must be handled explicitly.

### Tickets

**ID:** `mod.discord.tickets`  
**Status:** Planned  
**User value:** Gives community members a controlled support workflow.

The module owns ticket creation, assignment, state transitions, staff access,
closure, and retention boundaries. It must prevent users from reading other
tickets and must tolerate Discord channel creation or permission-update
failures without losing the ticket state.

### Ticket Transcripts

**ID:** `mod.discord.ticket-transcripts`  
**Status:** Planned  
**User value:** Preserves an authorized, reviewable record of a closed ticket.

Transcripts depend on Tickets and must record provenance, generation status,
access rules, retention, deletion behavior, and partial-capture failures.
Attachments and sensitive content require explicit handling. Public transcript
URLs are outside the accepted default boundary.

### Logging and Audit Events

**ID:** `mod.discord.logging`  
**Status:** Planned  
**User value:** Makes meaningful Discord and module actions reviewable.

The module publishes configured operational events while the platform audit
system remains the authoritative security record. Delivery failure must not
erase the platform audit event. Secrets, raw tokens, and unnecessary message
content must be redacted.

### Basic Welcome

**ID:** `mod.discord.basic-welcome`  
**Status:** Planned  
**User value:** Sends configured onboarding messages for supported member
events.

Configuration includes destination, template, enable state, and safe variable
substitution. The module must validate channel access, suppress duplicate
delivery, escape untrusted content, and expose delivery failure without retry
storms.

### Basic Roles

**ID:** `mod.discord.basic-roles`  
**Status:** Planned  
**User value:** Applies narrowly configured onboarding or self-service roles.

Role assignment must respect bot hierarchy, managed-role restrictions,
Aerealith authorization, and an explicit allowlist. Administrative privilege
escalation and arbitrary role editing are non-goals. Partial provider failures
must be visible and retry-safe.

### Basic Activity Summaries

**ID:** `mod.discord.basic-analytics`  
**Status:** Planned  
**User value:** Shows bounded community activity summaries without claiming
general analytics coverage.

Metrics require documented definitions, time windows, tenant isolation,
retention, and privacy limits. Raw message-content collection is not implied.
Missing or partial data must be labeled rather than estimated as complete.

## Should-Have Modules

### Command Manager

**ID:** `mod.discord.command-manager`  
**Status:** Planned  
**Scope:** MVP Should-Have.

The module lets authorized operators enable or disable supported commands by
guild and context. It cannot override module dependencies or security policy.
Changes propagate through a versioned registry and expose provider
registration failures.

### Discord Health

**ID:** `mod.discord.health`  
**Status:** Planned  
**Scope:** MVP Should-Have.

The module reports connection state, missing permissions, role-hierarchy
problems, command-registration status, rate-limit pressure, and dependency
health. Health output must avoid tokens, private configuration, and
cross-guild data. It is diagnostic and does not silently repair permissions.

## Events and Data Model

The exact event and persistence schemas are not implemented. At minimum,
future records need stable module and guild identifiers, configuration version,
lifecycle state, actor, timestamps, correlation and idempotency identifiers,
provider references, result status, and sanitized failure details.

> **Decision required:** Retention periods, transcript storage, Discord event
> payload minimization, retry ceilings, and the authoritative guild ownership
> model are not established by executable source.

## Observability

Each module must expose lifecycle failures, provider failures, rate-limit
pressure, denied actions, retry exhaustion, and audit-delivery state using
correlation identifiers. Logs must exclude raw tokens and minimize message and
member content.

## Implementation References

No implementation paths exist for these modules as of 2026-07-23.

Accepted design sources:

- `docs/decisions/DEC-002-discord-mvp-module-scope.md`
- `docs/decisions/DEC-003-mvp-ai-assistant-boundaries.md`
- `docs/architecture/Discord Architecture.md`
- `docs/architecture/Module Architecture.md`
- `docs/product/MVP Scope.md`

## Known Limitations

- No Discord deployable project or provider adapter exists.
- No module manifest schema, registry, lifecycle engine, or configuration store
  exists.
- No guild authorization, permission mapping, audit runtime, or retry policy
  exists.
- No tests prove the DEC-002 verification requirements.

## Planned Work

Implement the registry foundation before feature modules. Each module must gain
source references and focused tests before its status changes.

## Related Documentation

- [Module Index](./README.md)
- [Discord Architecture](../architecture/Discord%20Architecture.md)
- [Module Architecture](../architecture/Module%20Architecture.md)
- [Discord Platform](../product/Discord%20Platform.md)
- [Release Tasks](../releases/0.1/Tasks.md)
