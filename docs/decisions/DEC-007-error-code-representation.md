# DEC-007 — Error-Code Representation

Status: Accepted
Owner: SinLess Games LLC
Decision Date: 2026-07-15
Last Updated: 2026-07-15
Document Type: Decision Record
Blocks: 0.2 — Core Domain & Data Platform
Supersedes: Conflicting undocumented guidance and deleted RFC references
Superseded By: None

## Summary

Error codes are defined in immutable const objects with a derived string-literal union and stable namespaced values.

## Context

Error codes must be usable at runtime, type-safe at compile time, serializable
through APIs and events, searchable in logs, and stable for external clients.
Enums and free-form strings each solve only part of that problem.

## Decision

Each error domain defines an immutable const object and derives its type from the
object values.

```ts
export const AccountErrorCode = {
  NotFound: 'account.not_found',
  EmailConflict: 'account.email_conflict',
  Disabled: 'account.disabled',
} as const

export type AccountErrorCode =
  (typeof AccountErrorCode)[keyof typeof AccountErrorCode]
```

Canonical values use lowercase dot-separated namespaces:

```text
<domain>.<specific-condition>
```

Error codes are stable public identifiers. Human-readable messages are separate
and may change.

## Rationale

Const objects provide runtime values, tree-shaking, predictable JSON, direct
autocomplete, and derived union types without enum runtime behavior.
Namespacing prevents collisions across services and modules.

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

- Codes are never generated from human messages.
- A code has one canonical meaning.
- Removing or changing a public code is a breaking change.
- Internal causes may be logged safely but are not exposed automatically.
- Every public endpoint documents the codes it may return.
- HTTP status mapping is centralized and tested.
- Provider errors map to platform codes at provider boundaries.

## Verification

- Type tests reject arbitrary strings.
- Duplicate-value tests fail.
- API and event schemas validate codes.
- Generated error reference lists every active public code and HTTP mapping.
- Logs include code, request ID, trace ID, and safe metadata.

## Implementation Status

Accepted. The canonical registry and generated reference remain release 0.2 work.

## Alternatives Considered

TypeScript enums were rejected because const objects are simpler and more interoperable. Free-form strings were rejected because they provide no central ownership or compile-time safety.

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
