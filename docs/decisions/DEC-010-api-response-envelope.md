# DEC-010 — Mandatory API Response Envelope

Status: Accepted
Owner: SinLess Games LLC
Decision Date: 2026-07-15
Last Updated: 2026-07-15
Document Type: Decision Record
Blocks: 0.5 — API & Service Platform
Supersedes: Conflicting undocumented guidance and deleted RFC references
Superseded By: None

## Summary

Every stable public JSON API response uses one mandatory success or error envelope carrying request and trace correlation.

## Context

A “recommended” envelope becomes multiple incompatible response shapes. Clients,
logs, support tools, SDKs, and observability need one predictable contract for
success, validation failure, authorization failure, provider failure, and
unexpected errors.

## Decision

Successful responses use:

```json
{
  "success": true,
  "data": {},
  "requestId": "req_...",
  "traceId": "trace_..."
}
```

Failed responses use:

```json
{
  "success": false,
  "error": {
    "code": "domain.specific_condition",
    "message": "Safe public message",
    "details": {}
  },
  "requestId": "req_...",
  "traceId": "trace_..."
}
```

`details` is optional and must be safe for the caller. Stack traces, secrets,
provider credentials, raw database errors, and internal topology are never
included.

## Rationale

One shape makes clients simpler, correlation reliable, documentation clearer,
and error handling consistent across REST services.

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

- Every request has a request ID; generate one when absent.
- Trace IDs propagate when tracing is active.
- HTTP status still communicates protocol-level outcome.
- The body error code communicates stable platform meaning.
- Validation issues use a documented safe details schema.
- Empty successes still use the success envelope.
- Binary, streaming, redirect, and health responses may use documented protocol-
  appropriate exceptions.

## Verification

- Contract tests cover every public endpoint.
- Schema validation rejects mixed `data` and `error` bodies.
- Correlation tests trace one request across services and event handling.
- Security tests prove internal causes are redacted.
- Generated API documentation displays the envelope and endpoint error codes.

## Implementation Status

Accepted. Existing public handlers must converge before release 0.5 exits.

## Alternatives Considered

Endpoint-specific bodies and optional envelopes were rejected because they guarantee client inconsistency. HTTP-status-only errors were rejected because they lack stable domain meaning.

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
