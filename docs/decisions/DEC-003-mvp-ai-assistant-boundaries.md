# DEC-003 — MVP AI Assistant Boundaries

Status: Accepted
Owner: SinLess Games LLC
Decision Date: 2026-07-15
Last Updated: 2026-07-15
Document Type: Decision Record
Blocks: 0.4 — Frontend Platform and 0.8 — Community Operations
Supersedes: Conflicting undocumented guidance and deleted RFC references
Superseded By: None

## Summary

MVP includes a suggest-and-explain assistant surface, but excludes autonomous execution, durable memory, advanced model routing, and automatic punishment.

## Context

The product name and MVP scope require a credible assistant experience, while
the roadmap defers the full assistant and memory platform to release 1.3.
Shipping no assistant would undermine the product promise. Shipping advanced
autonomy before approvals, permissions, audit, and revocation are proven would
undermine user trust.

## Decision

The MVP assistant may:

- Explain platform state and configuration.
- Summarize information the user is authorized to access.
- Suggest actions.
- Prepare an action proposal.
- Explain risk, permissions, and expected effects.
- Ask for the approval required by the action.
- Report the outcome after the platform executes an approved action.

The MVP assistant may not:

- Execute a meaningful action without platform approval.
- Automatically punish or moderate a user.
- Create silent long-running automation.
- Escalate permissions.
- Use durable personal or community memory beyond conservative,
  user-visible context needed for the current experience.
- Depend on advanced model routing.
- Make core platform behavior unavailable when an AI provider is disabled.

The execution path is:

```text
understand
→ summarize or suggest
→ prepare proposal
→ authorize
→ evaluate risk
→ obtain approval
→ platform executes
→ audit
→ explain outcome
```

## Rationale

This preserves a visible AI product surface while keeping authority in
deterministic platform services. It also creates a clean upgrade path for
release 1.3 without making MVP depend on autonomy or broad memory.

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

- Assistant output is untrusted input and must be validated.
- Tool access is capability-scoped.
- The assistant cannot bypass authorization, provider permissions, risk,
  approval, idempotency, or audit controls.
- AI involvement is disclosed.
- Suggestions and approvals are independently auditable.
- Disabling the AI provider leaves all non-assistant features operational.
- Community data is not used for model training without explicit consent.

## Verification

- Adversarial tests attempt to trigger an unapproved moderation action.
- The full non-assistant suite passes with AI disabled.
- High-risk assistant proposals cannot execute without an approval record.
- Audit records distinguish suggestion, approval, execution, and outcome.
- Memory and model-routing dependencies are absent from MVP-required paths.

## Implementation Status

The product scope supports an assistant surface. Enforcement primitives remain release work.

## Alternatives Considered

No assistant in MVP was rejected because it weakened the product promise. Autonomous MVP behavior was rejected because trust infrastructure is not yet proven.

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
