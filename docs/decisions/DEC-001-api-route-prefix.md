# DEC-001 — Canonical Public API Route Prefix

Status: Accepted
Owner: SinLess Games LLC
Decision Date: 2026-07-15
Last Updated: 2026-07-15
Document Type: Decision Record
Blocks: 0.5 — API & Service Platform
Supersedes: Conflicting undocumented guidance and deleted RFC references
Superseded By: None

## Summary

The stable public REST API uses `/api/V1/`, with an uppercase `V` and a numeric major version.

## Context

API documentation used inconsistent route forms, including uppercase and
lowercase version markers. A public route prefix becomes part of SDKs,
documentation, webhooks, logs, metrics, access policies, and external client
code. Allowing both variants would create two public contracts and make route
migration unnecessarily dangerous.

## Decision

The canonical stable public REST prefix is:

```text
/api/V1/
```

The uppercase `V` is intentional. The first stable major version is `V1`.

Canonical route groups are:

```text
/api/V1/services/
/api/V1/integrations/
/api/V1/modules/
/api/V1/workflows/
/api/V1/webhooks/
/api/V1/internal/
/api/V1/health/
```

Documentation, tests, OpenAPI output, examples, dashboards, access policies,
metrics, and client libraries must use the canonical form.

tRPC may support internal TypeScript-owned application flows. GraphQL may be
used where graph-shaped access is justified. Neither replaces the stable REST
boundary.

## Rationale

Versioning from the first public release prevents unversioned behavior from
becoming permanent. One exact casing avoids duplicate route handling, ambiguous
examples, and inconsistent telemetry.

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

- Route registration must expose the canonical prefix.
- Requests using `/api/v1/`, `/v1/api/`, `/api/1/`, or `/api/version1/` must
  not be documented as supported public APIs.
- A redirect may exist only as an explicitly temporary migration aid.
- Provider webhook routes remain under `/api/V1/webhooks/<provider>`.
- Health endpoints must expose no secrets.
- Version changes require a new decision and migration plan.

## Verification

- Route tests assert every public route begins with `/api/V1/`.
- OpenAPI output contains no lowercase `/api/v1/` paths.
- Documentation link checks and repository search find no active conflicting
  public-prefix examples.
- Request and trace IDs remain visible across the versioned boundary.

## Implementation Status

The architecture documents contain the chosen prefix. Runtime route enforcement and generated API-reference validation remain implementation work.

## Alternatives Considered

Lowercase `/api/v1/`, unversioned `/api/`, and header-only versioning were rejected because they conflicted with the adopted public contract or reduced discoverability.

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
