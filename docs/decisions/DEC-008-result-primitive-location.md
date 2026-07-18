# DEC-008 — Result Primitive Ownership

Status: Accepted
Owner: SinLess Games LLC
Decision Date: 2026-07-15
Last Updated: 2026-07-15
Document Type: Decision Record
Blocks: 0.2 — Core Domain & Data Platform
Supersedes: Conflicting undocumented guidance and deleted RFC references
Superseded By: None

## Summary

The `Result` primitive lives in `libs/core` because it is a language-level control-flow primitive rather than an API contract.

## Context

Several layers need a shared way to represent expected success and failure
without throwing. Placing `Result` in contracts would make domain and data code
depend on a transport-oriented package. Defining separate results in every layer
would fragment error handling.

## Decision

`Result<T, E>` and its constructors live in `libs/core`.

The primitive provides at minimum:

```text
ok(value)
err(error)
isOk()
isErr()
```

Additional helpers may be added only when they simplify common, readable
control flow.

Expected domain, validation, provider, and persistence failures use `Result`.
Programmer errors, violated invariants that cannot be recovered locally, and
process-level failures may throw.

## Rationale

`Result` is broadly reusable, runtime-neutral, and independent of HTTP, events,
or persistence. `libs/core` is therefore the lowest valid shared ownership
boundary.

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

- `Result` does not import API, database, provider, UI, or observability code.
- Error types remain explicit.
- Throw-versus-Result guidance is documented in engineering standards.
- API adapters convert results into the mandatory response envelope.
- Event consumers classify retryable and terminal failures explicitly.

## Verification

- Unit and type tests cover constructors, narrowing, mapping, and failure paths.
- Dependency checks prove `libs/core` remains runtime-neutral.
- Public examples show expected failures without broad `try/catch`.
- API handlers cannot accidentally serialize the internal Result object.

## Implementation Status

Accepted. The final primitive implementation and migration of callers belong to release 0.2.

## Alternatives Considered

Contracts ownership and per-layer Result implementations were rejected because they create incorrect dependency direction or duplicated semantics.

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
