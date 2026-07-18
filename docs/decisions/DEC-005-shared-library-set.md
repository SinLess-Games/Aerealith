# DEC-005 — Canonical Shared-Library Set

Status: Accepted
Owner: SinLess Games LLC
Decision Date: 2026-07-15
Last Updated: 2026-07-15
Document Type: Decision Record
Blocks: 0.2 — Core Domain & Data Platform
Supersedes: Conflicting undocumented guidance and deleted RFC references
Superseded By: None

## Summary

Aerealith uses a defined shared-library set with narrow responsibilities; new libraries require demonstrated ownership and boundary needs.

## Context

Architecture documents listed different library sets, while the repository
contains only part of the accepted target. An unbounded library catalog would
create overlapping homes for code and weaken Nx dependency enforcement.

## Decision

The canonical shared-library set is:

| Library              | Responsibility                                                                        |
| -------------------- | ------------------------------------------------------------------------------------- |
| `libs/core`          | Runtime-neutral primitives, result type, identifiers, errors, and foundational logic. |
| `libs/contracts`     | Provider-neutral API, event, webhook, DTO, and boundary schemas.                      |
| `libs/db`            | Drizzle schemas, migrations, repositories, and persistence mapping.                   |
| `libs/api`           | Transport helpers, middleware foundations, and route composition.                     |
| `libs/ui`            | Reusable interface primitives and design-system components.                           |
| `libs/content`       | Structured copy, localization source, translation workflow, and generated locales.    |
| `libs/flags`         | Feature-flag contracts and evaluation boundaries.                                     |
| `libs/observability` | Provider-neutral logging, metrics, tracing, diagnostics, and correlation helpers.     |
| `libs/utils`         | Small general utilities that do not belong to a narrower domain.                      |

Current implementation may contain only a subset. Missing accepted libraries are
created when their release requires them rather than as empty placeholders.

## Rationale

This set gives core primitives, contracts, transport, persistence, interface,
content, feature control, observability, and carefully constrained utility code
clear homes.

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

- Every library has an owner, README, Nx tags, public entry point, tests, and
  one clear responsibility.
- Libraries expose intentional public APIs.
- Circular dependencies are prohibited.
- `libs/contracts` never depends on persistence implementations.
- `libs/ui` never imports server implementations.
- `libs/utils` must not become a miscellaneous dumping ground.
- New shared libraries require an architecture reason and dependency review.

## Verification

- Nx project inventory matches implemented libraries.
- ESLint/Nx constraints enforce allowed tag relationships.
- Project README files state allowed dependencies.
- Public entry-point tests prevent deep internal imports.
- Empty placeholder libraries are not created solely to satisfy a diagram.

## Implementation Status

`content`, `core`, `db`, `ui`, and `utils` are implemented. `api`, `contracts`, `flags`, and `observability` are accepted target libraries and remain planned.

## Alternatives Considered

A minimal `libs/* → libs/core`-only model was retained as a safe default but is insufficient as the permanent complete graph. An unrestricted graph was rejected.

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
