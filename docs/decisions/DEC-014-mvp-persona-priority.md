# DEC-014 — MVP Persona Priority

Status: Accepted
Owner: SinLess Games LLC
Decision Date: 2026-07-15
Last Updated: 2026-07-15
Document Type: Decision Record
Blocks: 0.4 — Frontend Platform
Supersedes: Conflicting undocumented guidance and deleted RFC references
Superseded By: None

## Summary

Discord community operators are the primary MVP personas; individual users remain a secondary foundation for the broader digital-life direction.

## Context

Vision documentation positioned individuals and Discord communities as equal
anchors, while the MVP needs one dominant workflow to optimize. Equal priority
would spread design and engineering across two incomplete products.

## Decision

MVP UX and delivery priority is:

1. Discord server owners.
2. Discord admins and managers.
3. Discord moderators, support staff, and operational staff.
4. Discord community members affected by onboarding, moderation, and tickets.
5. Individual users as a secondary foundation.
6. Developers and power users as an enabling audience.

The frontend still includes account, profile, preferences, settings, consent,
assistant surface, notifications, and audit visibility needed for the long-term
individual product. Those foundations do not outrank the end-to-end Discord
community workflow for MVP investment.

## Rationale

Discord provides the clearest real-world proof of modules, permissions,
approvals, workflows, auditability, dashboards, and integrations. Success there
validates the platform model while preserving the broader vision.

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

- Dashboard information architecture prioritizes connected communities,
  enabled modules, attention, recent actions, configuration, and disable paths.
- Release acceptance uses community-operator jobs to be done.
- Individual features that do not support the MVP trust and account foundation
  are deferred explicitly.
- Public positioning still describes the larger platform and clearly states
  that Discord is the first flagship integration.

## Verification

- Usability testing includes owners, admins, moderators, and support staff.
- MVP analytics measure Discord onboarding and first-value completion.
- Scope reviews identify which primary persona each blocking feature serves.
- Individual-only expansion does not enter MVP without an explicit scope change.

## Implementation Status

Accepted and already reflected by the current MVP-scope document.

## Alternatives Considered

Equal MVP investment was rejected as too broad. Removing individual foundations entirely was rejected because account, consent, assistant, notification, and audit surfaces are platform requirements.

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
