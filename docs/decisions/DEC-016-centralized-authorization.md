# DEC-016 — Centralized, Normalized Authorization

Status: Accepted
Owner: SinLess Games LLC
Decision Date: 2026-07-28
Last Updated: 2026-07-28
Document Type: Decision Record
Blocks: Every protected API and service operation
Supersedes: Direct authorization from `users.role`
Superseded By: None

## Summary

Aerealith authorization is centralized in
`@aerealith-ai/authorization`, backed by normalized PostgreSQL role,
permission, hierarchy, conflict, assignment, and principal-version tables.

## Context

The legacy user role field can represent only one coarse global label. It
cannot safely model service principals, scoped access, expiration, revocation,
role hierarchy, separation-of-duty conflicts, cache invalidation, or consistent
enforcement across HTTP, tRPC, GraphQL, and WebSocket transports.

## Decision

Authentication and authorization remain separate. Authentication supplies a
typed user or service principal. Every protected operation requests an exact
permission and scope from the centralized authorization service.

The normalized role assignments are authoritative. `users.role` remains only
as a deprecated compatibility projection during migration and must not be read
to make access decisions.

Unknown permissions, missing principals, disabled records, expired or revoked
assignments, scope mismatches, malformed hierarchy data, repository failures,
and policy failures deny access. Transport responses expose only public-safe
unauthorized or forbidden errors.

## Data and cache rules

- Permission keys are stable and namespaced.
- Active duplicate assignments are rejected by both service policy and a
  database uniqueness constraint.
- Role inheritance is additive and cycle checked.
- Conflicts are evaluated symmetrically.
- Assignment changes update a per-principal authorization version in the same
  transaction and invalidate cached effective access.
- Security-relevant decisions and mutations publish structured audit events.

## Administrative safety

Role assignment cannot exceed the actor's maximum administrative rank.
Self-escalation is denied unless explicitly allowed by a trusted workflow.
System and non-assignable roles are protected. The final active
`platform_owner` assignment cannot be revoked.

## Consequences

All transports use one decision model and one source of truth. The additional
joins and management rules are offset by version-aware caching and explicit
repository boundaries. Product teams must add permissions deliberately and
test both allowed and denied paths.

## Verification

- `libs/authorization` unit tests cover default deny, exact grants, hierarchy,
  scopes, revocation, expiration, cache behavior, conflicts, escalation, and
  final-owner protection.
- `libs/api-platform` tests exercise all transport guards and public-safe
  errors.
- `libs/db` tests inspect schema constraints.
- The PostgreSQL migration is applied in integration validation and the
  requested bootstrap owner is queried from normalized assignments.

## Related Documentation

- [`libs/authorization/README.md`](../../libs/authorization/README.md)
- [`docs/architecture/Auth Architecture.md`](../architecture/Auth%20Architecture.md)
- [`docs/architecture/Security Architecture.md`](../architecture/Security%20Architecture.md)
- [`DEC-004`](./DEC-004-relational-database-and-orm.md)
