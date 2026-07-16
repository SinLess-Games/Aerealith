# DEC-011 — Platform Providers Versus Product Integrations

Status: Accepted
Owner: SinLess Games LLC
Decision Date: 2026-07-15
Last Updated: 2026-07-15
Document Type: Decision Record
Blocks: 0.6 — Developer Portal & Integrations
Supersedes: Conflicting undocumented guidance and deleted RFC references
Superseded By: None

## Summary

Cloudflare and observability vendors are platform providers, not user-facing product integrations; Discord, email, media, and connected external accounts use explicit provider adapters according to their product role.

## Context

Documentation called Cloudflare and Grafana “integrations” in some places. That
word also describes user-connected services exposed in the integration
dashboard. Mixing infrastructure bindings with product connections confuses
ownership, consent, health, disconnection, and marketplace scope.

## Decision

A **platform provider** supplies infrastructure used to run Aerealith. Examples
include:

- Cloudflare deployment and edge services.
- Datadog managed logs, metrics, traces, and alerts.
- Grafana Faro and Grafana-compatible telemetry.
- PostgreSQL hosting.
- CI, security, and coverage providers.

A **product integration** connects a user, community, or organization to an
external service and has a visible lifecycle such as connect, configure, health,
disconnect, revoke, and delete.

Discord is a first-class product platform integration even though it also
requires persistent runtime infrastructure. Resend and Cloudinary are provider
adapters whose user-facing exposure depends on the capability using them.

## Rationale

The distinction keeps infrastructure credentials and operational health out of
user integration semantics while preserving replaceable provider boundaries.

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

- Platform providers are configured by operators through environment and secret
  management.
- Product integrations have scoped consent, ownership, health, disconnect, and
  audit behavior.
- Provider SDKs remain behind adapters.
- Disconnecting a product integration actually revokes or invalidates access.
- The integration dashboard does not present internal infrastructure bindings
  as user-connectable accounts.
- Provider-neutral telemetry remains available when one observability vendor is
  replaced.

## Verification

- Integration registry entries declare `product` or `platform-provider`.
- UI tests show only user-manageable connections.
- Secret ownership tests prevent infrastructure credentials from entering user
  records.
- Adapter contract tests cover connect, health, disconnect, and error mapping
  where those lifecycle operations apply.

## Implementation Status

Accepted. `docs/STACK.md` already distinguishes technology roles; product and architecture documents must align terminology.

## Alternatives Considered

Treating every external vendor as an integration was rejected because it collapses operational dependencies and user consent into one misleading model.

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
