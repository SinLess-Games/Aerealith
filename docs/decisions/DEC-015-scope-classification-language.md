# DEC-015 — Unambiguous Scope Classification Language

Status: Accepted
Owner: SinLess Games LLC
Decision Date: 2026-07-15
Last Updated: 2026-07-15
Document Type: Decision Record
Blocks: 0.4 and every later release
Supersedes: Conflicting undocumented guidance and deleted RFC references
Superseded By: None

## Summary

The combined label `MVP / Post-MVP` is prohibited; every capability receives one explicit scope classification and, when deferred, a target release or parking-lot reason.

## Context

Several feature tables used `MVP / Post-MVP`, which does not tell planning,
engineering, testing, or release reviewers whether the feature blocks launch.
Ambiguous labels turn every scope discussion into a new interpretation.

## Decision

The label `MVP / Post-MVP` must not be used.

Allowed scope classifications are:

| Classification         | Meaning                                                         |
| ---------------------- | --------------------------------------------------------------- |
| `MVP Required`         | Blocks MVP release when incomplete.                             |
| `MVP Should-Have`      | Valuable but may be deferred through an explicit gate decision. |
| `Post-MVP — <release>` | Accepted for a named release after MVP.                         |
| `Future`               | Accepted direction without a scheduled release.                 |
| `Parking Lot`          | Not accepted into the roadmap; retained for later evaluation.   |
| `Out of Scope`         | Explicitly excluded from the named product or release.          |
| `Rejected`             | Considered and intentionally declined.                          |

Every deferred item must identify either a target release or the reason it
remains unscheduled.

## Rationale

Exact classifications make release gates enforceable, prevent quiet scope
growth, and preserve useful ideas without treating them as commitments.

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

- Product tables use only approved classifications.
- Release documents state required, should-have, deferred, and excluded work.
- A should-have moved out of MVP records the decision, owner, and destination.
- “Later,” “eventually,” and “maybe” are not valid scope fields.
- Generated module and capability registries validate classification values.

## Verification

- Documentation CI rejects `MVP / Post-MVP`.
- Registry schemas restrict status values.
- Every MVP-required item maps to a release task and exit criterion.
- Every deferred item has a release, parking-lot entry, or explicit exclusion.

## Implementation Status

Accepted. Existing Discord and product tables require cleanup.

## Alternatives Considered

Keeping the ambiguous combined label was rejected because it provides no usable release meaning.

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
