# DEC-012 — Webhook Foundation Scope

Status: Accepted
Owner: SinLess Games LLC
Decision Date: 2026-07-15
Last Updated: 2026-07-15
Document Type: Decision Record
Blocks: 0.6 — Developer Portal & Integrations
Supersedes: Conflicting undocumented guidance and deleted RFC references
Superseded By: None

## Summary

The MVP webhook foundation covers secure inbound receipt, verification, normalization, idempotency, and delivery logging; it does not include a full webhook-management product.

## Context

“Webhook foundation” was used without a boundary, allowing anything from one
verified endpoint to a complete outbound webhook marketplace and management UI.
Release 0.6 needs enough infrastructure to connect providers safely without
absorbing later developer-platform scope.

## Decision

The MVP webhook foundation includes:

- Versioned inbound provider routes.
- Raw-body handling where signature verification requires it.
- Provider-specific signature and timestamp verification.
- Replay-window enforcement.
- Payload size and rate limits.
- Schema validation.
- Provider-event normalization before queueing.
- Idempotency and duplicate-delivery handling.
- Delivery and processing logs with request and trace IDs.
- Safe failure responses.
- Secret rotation procedure.
- Provider setup documentation.

It excludes:

- General outbound customer webhooks.
- User-created webhook endpoints.
- Subscription-management UI.
- Retry dashboards for external customers.
- Marketplace webhook extensions.
- Arbitrary transformation scripts.

## Rationale

This is the smallest secure base that supports real providers and future
expansion without pretending the full webhook product is complete.

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

- Verification occurs before trusted parsing or side effects.
- Raw secrets and full sensitive payloads are not logged.
- Normalized events enter the standard event envelope.
- Consumers are idempotent because providers retry deliveries.
- Failed deliveries have a defined retry or quarantine policy.
- Disconnecting an integration disables its webhook authority.

## Verification

- Invalid signatures, stale timestamps, oversized bodies, and replayed events
  are rejected.
- Duplicate provider deliveries produce one meaningful platform effect.
- Correlation tests connect receipt, normalization, queueing, handling, and
  audit.
- Rotation exercises prove old and new secrets can be transitioned safely.

## Implementation Status

Accepted. Implementation is release 0.6 work.

## Alternatives Considered

A full management UI was deferred because it is not necessary to prove secure provider ingress. An unsigned generic endpoint was rejected as unsafe.

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
