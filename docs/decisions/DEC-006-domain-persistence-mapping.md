# DEC-006 — Domain and Persistence Mapping Ownership

Status: Accepted
Owner: SinLess Games LLC
Decision Date: 2026-07-15
Last Updated: 2026-07-15
Document Type: Decision Record
Blocks: 0.2 — Core Domain & Data Platform
Supersedes: Conflicting undocumented guidance and deleted RFC references
Superseded By: None

## Summary

Mapping between persistence records and domain entities lives in the data layer; persistence may know domain types, but domain code must not know persistence.

## Context

The project needs a consistent location for converting database rows, dates,
nullable fields, enums, identifiers, and serialized values into domain entities.
Placing mapping in domain code would couple business rules to the selected ORM.
Placing it in API handlers would duplicate behavior.

## Decision

Persistence-to-domain and domain-to-persistence mappers live in `libs/db` or a
narrow data-owned project.

Allowed direction:

```text
persistence mapper → persistence schema
persistence mapper → domain type
domain type        ✕ persistence schema
contract           ✕ persistence schema
```

Repositories use these mappers and return domain entities or `Result`.

## Rationale

The data layer has the necessary knowledge of storage representation while the
domain remains portable, testable, and independent of Drizzle, PostgreSQL, or
CockroachDB.

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

- Date values are converted at the boundary and represented consistently,
  normally as domain date objects internally and ISO 8601 at external contracts.
- Database nullability is not leaked without domain meaning.
- Mapper failures return typed errors.
- Mapping is deterministic and testable without a live production database.
- API handlers do not hand-map rows.
- Contracts never export mapper or ORM types.

## Verification

- Unit tests cover round-trip mapping for every persistent aggregate.
- Repository public types contain no Drizzle or `pg` types.
- Dependency checks prevent domain packages from importing `libs/db`.
- Serialization tests prove API output remains stable when persistence changes.

## Implementation Status

Accepted for release 0.2. Existing database code must be reviewed for compliance as repositories are implemented.

## Alternatives Considered

Domain-owned and API-owned mapping were rejected because they reverse dependency direction or duplicate persistence knowledge.

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
