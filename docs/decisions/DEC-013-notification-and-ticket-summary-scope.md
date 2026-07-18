# DEC-013 — Notification Preferences and Ticket Summaries in MVP

Status: Accepted
Owner: SinLess Games LLC
Decision Date: 2026-07-15
Last Updated: 2026-07-15
Document Type: Decision Record
Blocks: 0.8 — Moderation, Tickets & Community Operations
Supersedes: Conflicting undocumented guidance and deleted RFC references
Superseded By: None

## Summary

Basic notification preferences and staff-facing ticket summaries are MVP scope, with deterministic fallback when AI is unavailable.

## Context

Product scope was inconsistent about whether notification preferences and ticket
summaries were required for MVP. Tickets without controlled notifications are
operationally noisy. Summaries are valuable for staff handoff, but AI
availability cannot become a requirement for ticket operation.

## Decision

MVP includes basic notification preferences for:

- Approval requests.
- Security and permission changes.
- Integration health.
- Ticket creation, assignment, escalation, and closure.
- Moderation and automod alerts.
- Workflow failures.
- Operational incidents visible to authorized users.

MVP also includes staff-facing ticket summaries.

A deterministic summary must remain available using ticket metadata, status,
participants, timestamps, category, assignment, and recent activity. AI may
produce an enhanced natural-language summary, but the enhanced summary follows
DEC-003 and degrades safely when AI is disabled.

## Rationale

Preferences prevent alert fatigue and make revocation visible. Ticket summaries
reduce staff handoff cost while retaining AI independence.

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

- Security-critical notices cannot be silently disabled when policy requires
  delivery.
- Preferences are scoped by user, organization, community, and notification
  type as appropriate.
- Delivery channels and failures are auditable.
- Ticket summaries respect ticket access controls.
- Summary generation never exposes ticket content to an unapproved provider.
- AI-generated summaries disclose AI involvement and may not execute actions.

## Verification

- Preference tests prove one context does not change another.
- Disabled AI still produces a deterministic ticket summary.
- Unauthorized users cannot request or view summaries.
- Notification delivery and suppression decisions are traceable.
- Critical notification rules cannot be bypassed by ordinary preference edits.

## Implementation Status

Accepted for MVP. Detailed channel support and advanced notification routing remain later scope.

## Alternatives Considered

Deferring both was rejected because tickets and approvals need usable operational communication. Making ticket summaries AI-only was rejected because the platform must work without AI.

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
