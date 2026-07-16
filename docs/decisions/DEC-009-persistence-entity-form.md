# DEC-009 — Persistence Entity Form

Status: Accepted
Owner: SinLess Games LLC
Decision Date: 2026-07-15
Last Updated: 2026-07-15
Document Type: Decision Record
Blocks: 0.2 — Core Domain & Data Platform
Supersedes: Conflicting undocumented guidance and deleted RFC references
Superseded By: None

## Summary

Drizzle table schemas and persistence records remain data-layer implementation details, separate from domain entities and external contracts.

## Context

The database and ORM decision determines how storage records are represented.
Using ORM rows as domain entities would spread nullability, column names,
database date types, and migration concerns throughout the platform.

## Decision

Persistence entities consist of:

1. Drizzle table and relation definitions.
2. Inferred insert and select record types used only inside the data layer.
3. Repository implementations.
4. Explicit mappers between records and domain entities.
5. Ordered migrations.

Domain entities remain pure TypeScript models with domain meaning. Contracts
remain provider- and persistence-neutral Zod schemas and inferred types.

## Rationale

Separating the three forms—persistence, domain, and contract—allows schema
changes, API versioning, and business rules to evolve independently.

## Consequences

### Positive

- Contributors have one binding interpretation.
- Release planning can use objective gates.
- Architecture and engineering documents can remove conflicting language.
- Tests can verify the decision rather than relying on prose.

### Tradeoffs

- Existing documentation and code may require migration.
- The decision narrows implementation freedom.
- Any future reversal requires an explicit superseding record.

## Implementation Requirements

- Persistence records are not exported from `libs/db` public boundaries unless
  explicitly required by data-owned tooling.
- Repositories return domain entities or `Result`.
- Inserts accept domain-specific commands or data-layer inputs, not arbitrary
  database rows from callers.
- Database defaults, generated IDs, timestamps, and retry behavior are owned by
  the data layer.
- Transactions do not leak outside the data/application orchestration boundary.
- CockroachDB transaction retries are handled explicitly when compatibility is
  enabled.

## Verification

- Dependency and type tests prove contracts cannot import Drizzle.
- Repository tests inspect mapping, constraints, and transaction behavior.
- Migration tests start from an empty database.
- API snapshots contain no column-only or ORM-only fields.

## Implementation Status

Accepted with DEC-004. Existing and new schemas must follow this separation during release 0.2.

## Alternatives Considered

Active Record and direct row-as-domain designs were rejected because they couple business logic and public behavior to persistence.

## Related Documentation

- [`docs/README.md`](../README.md)
- [`docs/STACK.md`](../STACK.md)
- [`docs/architecture/`](../architecture/)
- [`docs/engineering/`](../engineering/)
- [`docs/releases/`](../releases/)

## Change Policy

This record may be corrected for clarity without changing the decision.
A material change requires a new decision that names this record in
`Supersedes`.
