---
title: 'Error and Result Model'
rfc: '0004'
status: 'Implemented'
created: '2026-07-09'
updated: '2026-07-09'
owner: 'Tim Pierce / SinLess Games'
reviewers:
  - 'Timothy Pierce'
reviewed_by: 'Timothy Pierce'
reviewed_on: '2026-07-09'
implemented_by: 'Timothy Pierce'
implemented_on: '2026-07-09'
related_release: '0.2 — Core Domain & Data Platform'
future_releases:
  - '0.5 — API & Service Platform'
  - '0.9 — Observability & Reliability'
  - '1.1 — MVP Production Launch'
related_docs:
  - 'docs/rfcs/README.md'
  - 'docs/rfcs/RFC Template.md'
  - 'docs/rfcs/0001-rfc-process.md'
  - 'docs/rfcs/0002-monorepo-library-boundaries.md'
  - 'docs/rfcs/0003-api-versioning-and-route-strategy.md'
  - 'docs/releases/0.1/README.md'
  - 'docs/releases/0.1/Release.md'
supersedes: []
superseded_by: []
tags:
  - rfc
  - errors
  - results
  - api
  - contracts
  - observability
  - architecture
---

# 0004 — Error and Result Model

Status: Implemented
Created: 2026-07-09
Updated: 2026-07-09
Owner: Tim Pierce / SinLess Games
Reviewed By: Timothy Pierce
Reviewed On: 2026-07-09
Implemented By: Timothy Pierce
Implemented On: 2026-07-09
Related Release: `0.2 — Core Domain & Data Platform`

---

## Summary

This RFC defines the error and result model for Aerealith AI.

Aerealith should use a consistent error system across libraries, services, integrations, APIs, tools, and future user-facing surfaces.

The core model should include:

```text
AerealithError
BaseError
domain-specific error classes
stable error codes
safe public messages
private diagnostic details
request IDs
trace IDs
structured API error responses
Result<T, E> for expected recoverable outcomes
exceptions for unexpected or invalid execution states
```

This RFC is marked as implemented because the initial error and result decision has been reviewed and accepted by Timothy Pierce.

---

## Context

Aerealith is a platform that will eventually include many runtime surfaces:

```text
services
integrations
modules
workflows
APIs
dashboard UI
developer APIs
internal tools
background jobs
future self-hosted deployments
```

Each surface needs to handle failure consistently.

Without a shared model, errors can become inconsistent, hard to debug, unsafe to expose, and difficult to document.

Aerealith needs an error system that works for:

- developers
- users
- API clients
- support/admin workflows
- logs
- audit events
- observability
- future SDKs
- future self-hosting

---

## Problem

Aerealith needs one standard way to represent errors and expected operation outcomes.

Without a standard model, the project risks:

```text
random thrown strings
inconsistent Error subclasses
unstable API error shapes
unsafe messages leaking private details
logs missing request context
UI showing confusing messages
public APIs changing error behavior randomly
hard-to-test failure paths
inconsistent validation errors
unclear retry behavior
bad observability
```

The platform needs to separate:

```text
What users can safely see.
What developers need for debugging.
What API clients can depend on.
What logs and traces should capture.
What failures are expected.
What failures are exceptional.
```

---

## Goals

This RFC should define:

```text
The base Aerealith error model.
The difference between expected results and thrown errors.
The public API error shape.
The internal error shape.
The error code strategy.
The domain error class strategy.
The safe message strategy.
The diagnostic details strategy.
The request ID and trace ID relationship.
The validation error strategy.
The retryable error strategy.
The logging and observability expectations.
The migration path for future implementation.
```

---

## Non-Goals

This RFC does not define:

```text
Every final error code.
The complete HTTP API implementation.
The final logging provider.
The final tracing provider.
The complete validation schema system.
The complete database error mapping.
The final user notification strategy.
The final SDK error model.
```

Those should be expanded in later implementation docs, API docs, and architecture docs.

---

## Proposed Decision

Aerealith should use a structured error model built around:

```text
AerealithError
stable error codes
domain-specific error classes
safe public messages
private diagnostic details
structured API error responses
Result<T, E> for expected recoverable outcomes
exceptions for unexpected or invalid execution states
```

Core error classes should live in:

```text
libs/core/
```

Shared error codes should live in:

```text
libs/core/src/error-codes/
```

API-safe error contracts should live in:

```text
libs/contracts/
```

API helpers and response mappers should live in:

```text
libs/api/
```

Applications should not invent their own unrelated error shape.

---

## Error Model Overview

Aerealith should distinguish four major failure concepts.

| Concept            | Purpose                                     | Example                                  |
| ------------------ | ------------------------------------------- | ---------------------------------------- |
| Error Code         | Stable machine-readable failure identifier. | `COMMON_NOT_FOUND`                       |
| Error Class        | Runtime error object with typed metadata.   | `AerealithError`                         |
| Result             | Expected recoverable success/failure value. | `Result<User, AerealithError>`           |
| API Error Response | Safe serialized response for clients.       | `{ "success": false, "error": { ... } }` |

---

## Core Error Class

The base platform error should be:

```text
AerealithError
```

`AerealithError` should extend the native `Error` class.

It should include:

```text
code
message
safeMessage
statusCode
severity
category
details
cause
requestId
traceId
retryable
timestamp
```

The class should support both developer diagnostics and safe user-facing output.

---

## Suggested AerealithError Shape

```ts
export type AerealithErrorSeverity =
  'debug' | 'info' | 'warn' | 'error' | 'critical'

export type AerealithErrorCategory =
  | 'common'
  | 'auth'
  | 'validation'
  | 'database'
  | 'api'
  | 'integration'
  | 'service'
  | 'workflow'
  | 'module'
  | 'system'

export interface AerealithErrorOptions {
  readonly code: string
  readonly message: string
  readonly safeMessage?: string
  readonly statusCode?: number
  readonly severity?: AerealithErrorSeverity
  readonly category?: AerealithErrorCategory
  readonly details?: unknown
  readonly cause?: unknown
  readonly requestId?: string
  readonly traceId?: string
  readonly retryable?: boolean
}

export class AerealithError extends Error {
  readonly code: string
  readonly safeMessage: string
  readonly statusCode: number
  readonly severity: AerealithErrorSeverity
  readonly category: AerealithErrorCategory
  readonly details?: unknown
  readonly requestId?: string
  readonly traceId?: string
  readonly retryable: boolean
  readonly timestamp: string

  constructor(options: AerealithErrorOptions) {
    super(options.message, { cause: options.cause })

    this.name = 'AerealithError'
    this.code = options.code
    this.safeMessage = options.safeMessage ?? 'Something went wrong.'
    this.statusCode = options.statusCode ?? 500
    this.severity = options.severity ?? 'error'
    this.category = options.category ?? 'system'
    this.details = options.details
    this.requestId = options.requestId
    this.traceId = options.traceId
    this.retryable = options.retryable ?? false
    this.timestamp = new Date().toISOString()
  }
}
```

This is the intended model shape.

Implementation details may evolve as long as the contract remains consistent.

---

## Error Code Strategy

Error codes should be stable, readable, and machine-friendly.

Recommended format:

```text
DOMAIN_ERROR_NAME
```

Examples:

```text
COMMON_BAD_REQUEST
COMMON_NOT_FOUND
AUTH_INVALID_TOKEN
VALIDATION_INVALID_INPUT
DATABASE_RECORD_NOT_FOUND
API_UNSUPPORTED_VERSION
INTEGRATION_CONNECTION_FAILED
WORKFLOW_APPROVAL_REQUIRED
MODULE_NOT_ENABLED
SYSTEM_INTERNAL_ERROR
```

Error codes should be stable once exposed through public APIs.

Do not casually rename error codes after they become part of API behavior.

---

## Error Code Categories

Recommended initial categories:

| Category      | Purpose                                                                   |
| ------------- | ------------------------------------------------------------------------- |
| `common`      | Shared platform errors such as bad request, not found, conflict, timeout. |
| `auth`        | Authentication and authorization failures.                                |
| `validation`  | Input, schema, and request validation failures.                           |
| `database`    | Database, migration, transaction, and persistence failures.               |
| `api`         | API routing, versioning, content type, and request handling failures.     |
| `integration` | Provider connection, callback, sync, and external API failures.           |
| `service`     | Platform service-level failures.                                          |
| `workflow`    | Workflow, automation, approval, and execution failures.                   |
| `module`      | Module registry, config, enablement, and lifecycle failures.              |
| `system`      | Internal system and unexpected platform failures.                         |

---

## Initial Common Error Codes

The common error category should include:

```text
COMMON_BAD_REQUEST
COMMON_UNAUTHORIZED
COMMON_FORBIDDEN
COMMON_NOT_FOUND
COMMON_METHOD_NOT_ALLOWED
COMMON_CONFLICT
COMMON_VALIDATION_ERROR
COMMON_INVALID_CONTENT_TYPE
COMMON_INVALID_ORIGIN
COMMON_RATE_LIMITED
COMMON_REQUEST_TIMEOUT
COMMON_PAYLOAD_TOO_LARGE
COMMON_UNSUPPORTED_MEDIA_TYPE
COMMON_INTERNAL_ERROR
COMMON_SERVICE_UNAVAILABLE
COMMON_GATEWAY_TIMEOUT
```

These codes should map cleanly to common HTTP statuses.

---

## HTTP Status Mapping

| Error Code                      | HTTP Status |
| ------------------------------- | ----------: |
| `COMMON_BAD_REQUEST`            |         400 |
| `COMMON_UNAUTHORIZED`           |         401 |
| `COMMON_FORBIDDEN`              |         403 |
| `COMMON_NOT_FOUND`              |         404 |
| `COMMON_METHOD_NOT_ALLOWED`     |         405 |
| `COMMON_CONFLICT`               |         409 |
| `COMMON_VALIDATION_ERROR`       |         422 |
| `COMMON_INVALID_CONTENT_TYPE`   |         415 |
| `COMMON_INVALID_ORIGIN`         |         403 |
| `COMMON_RATE_LIMITED`           |         429 |
| `COMMON_REQUEST_TIMEOUT`        |         408 |
| `COMMON_PAYLOAD_TOO_LARGE`      |         413 |
| `COMMON_UNSUPPORTED_MEDIA_TYPE` |         415 |
| `COMMON_INTERNAL_ERROR`         |         500 |
| `COMMON_SERVICE_UNAVAILABLE`    |         503 |
| `COMMON_GATEWAY_TIMEOUT`        |         504 |

---

## Domain-Specific Error Classes

Domain-specific errors may extend `AerealithError`.

Examples:

```text
AuthError
ValidationError
DatabaseError
ApiError
IntegrationError
ServiceError
WorkflowError
ModuleError
SystemError
```

These classes should:

```text
set category defaults
set status defaults where useful
use stable error codes
use safe public messages
preserve cause where available
avoid leaking secrets
```

Example:

```ts
export class ValidationError extends AerealithError {
  constructor(options: Omit<AerealithErrorOptions, 'category' | 'statusCode'>) {
    super({
      ...options,
      category: 'validation',
      statusCode: 422,
      safeMessage: options.safeMessage ?? 'The provided input is invalid.',
    })
  }
}
```

---

## throwError Helper

Aerealith may include a helper for consistently throwing platform errors.

Recommended helper:

```ts
export function throwError(options: AerealithErrorOptions): never {
  throw new AerealithError(options)
}
```

Domain-specific helpers may be added later.

Examples:

```ts
throwError({
  code: 'COMMON_NOT_FOUND',
  message: 'User record was not found for id usr_123.',
  safeMessage: 'The requested resource was not found.',
  statusCode: 404,
  category: 'common',
})
```

The helper should not hide too much behavior.

Errors should stay readable and explicit.

---

## Safe Message Strategy

Every platform error should separate:

```text
developer message
safe public message
diagnostic details
```

### Developer Message

Used for logs and debugging.

May include internal context, but must not include secrets.

Example:

```text
User lookup failed because user id usr_123 was not found.
```

### Safe Public Message

Used for UI and API clients.

Should be understandable and safe.

Example:

```text
The requested user could not be found.
```

### Diagnostic Details

Used for structured logs and debugging.

May include context, but must be scrubbed before public exposure.

---

## Sensitive Data Rule

Errors must never expose sensitive values in public messages.

Never expose:

```text
API keys
OAuth secrets
provider tokens
session secrets
database passwords
private keys
raw authorization headers
full cookies
passwords
security answers
private user content unless explicitly safe
```

Diagnostic details should be scrubbed before logging if they may contain sensitive values.

---

## Result Model

Aerealith should use a `Result<T, E>` model for expected recoverable outcomes.

Example:

```ts
export type Result<T, E = AerealithError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }
```

Use `Result` when failure is expected and part of normal control flow.

Examples:

```text
validation attempts
optional lookups
provider health checks
permission checks
feature availability checks
workflow preflight checks
config parsing
```

Use thrown errors when execution cannot safely continue or the state is invalid.

Examples:

```text
unexpected invariant failure
missing required runtime config
unhandled provider failure
database transaction failure
programmer error
unrecoverable system state
```

---

## Result Helper Examples

```ts
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}
```

Example usage:

```ts
const result = validateConfig(config)

if (!result.ok) {
  return result
}

return ok(result.value)
```

---

## Throw vs Result Rules

| Situation                                         | Use                                                         |
| ------------------------------------------------- | ----------------------------------------------------------- |
| Expected validation failure                       | `Result`                                                    |
| Permission preflight failure                      | `Result`                                                    |
| Optional lookup miss                              | `Result`                                                    |
| User-correctable config issue                     | `Result`                                                    |
| Unexpected invariant failure                      | Throw `AerealithError`                                      |
| Missing required environment variable at boot     | Throw `AerealithError`                                      |
| Database transaction failed unexpectedly          | Throw `AerealithError`                                      |
| Provider returned malformed response unexpectedly | Throw `AerealithError`                                      |
| Programmer mistake                                | Throw native error or `AerealithError` depending on context |

---

## API Error Response Shape

API routes should serialize errors into a stable shape.

Recommended error response:

```json
{
  "success": false,
  "error": {
    "code": "COMMON_NOT_FOUND",
    "message": "The requested resource was not found.",
    "category": "common",
    "retryable": false,
    "requestId": "req_123",
    "traceId": "trace_456",
    "details": null
  }
}
```

API responses should use `safeMessage`, not internal developer messages.

Internal details should only be exposed when explicitly safe and appropriate.

---

## API Success Response Shape

API success responses should use a stable shape.

Recommended success response:

```json
{
  "success": true,
  "data": {
    "id": "example"
  },
  "requestId": "req_123",
  "traceId": "trace_456"
}
```

The final response contract may be expanded later in API docs.

This RFC establishes that success and error responses should be consistent.

---

## Validation Error Shape

Validation errors should provide structured field-level information where safe.

Recommended shape:

```json
{
  "success": false,
  "error": {
    "code": "COMMON_VALIDATION_ERROR",
    "message": "The provided input is invalid.",
    "category": "validation",
    "retryable": false,
    "requestId": "req_123",
    "details": {
      "fields": [
        {
          "path": "email",
          "message": "Email is required.",
          "code": "required"
        }
      ]
    }
  }
}
```

Validation details should not expose private or unsafe data.

---

## Retryable Errors

Errors should identify whether retrying may help.

Examples of retryable errors:

```text
temporary provider outage
network timeout
rate limit with retry-after
service unavailable
gateway timeout
queue processing failure
```

Examples of non-retryable errors:

```text
bad request
validation error
unauthorized
forbidden
not found
conflict requiring user change
unsupported content type
```

Retry metadata may be added later.

Potential future fields:

```text
retryAfter
retryReason
retryStrategy
```

---

## Error Severity

Errors should support severity.

Recommended severities:

| Severity   | Meaning                                                          |
| ---------- | ---------------------------------------------------------------- |
| `debug`    | Useful only for development or low-level diagnostics.            |
| `info`     | Notable but not harmful.                                         |
| `warn`     | Something failed or degraded but may not be critical.            |
| `error`    | A meaningful operation failed.                                   |
| `critical` | System reliability, security, or data integrity may be affected. |

Severity should guide logging and alerting.

Severity should not replace error code.

---

## Request ID and Trace ID

Errors should support:

```text
requestId
traceId
```

### Request ID

A request ID identifies one external or internal request.

Example:

```text
req_123
```

### Trace ID

A trace ID links a request across services, workers, queues, integrations, and background jobs.

Example:

```text
trace_456
```

Request IDs and trace IDs should help connect:

```text
API responses
logs
traces
audit events
support diagnostics
```

---

## Logging Expectations

When an error is logged, logs should include:

```text
code
message
safeMessage
category
severity
statusCode
requestId
traceId
retryable
cause
details when safe
timestamp
```

Logs should not include secrets.

Logs should preserve enough context to debug failures.

---

## Observability Expectations

The error model should support observability.

Future observability should be able to group failures by:

```text
error code
category
severity
service
route
integration
module
workflow
request ID
trace ID
environment
release version
```

This RFC does not require a specific observability provider.

---

## Audit Log Relationship

Errors are not the same thing as audit events.

However, some errors should create audit-relevant records.

Examples:

```text
permission denied on sensitive action
approval required but missing
destructive action failed
integration disconnected
workflow execution failed
security-sensitive validation failure
```

Audit log rules should be defined separately.

This RFC only requires that errors preserve enough context to support future audit behavior.

---

## File and Package Placement

Recommended placement:

```text
libs/core/src/errors/
libs/core/src/error-codes/
libs/core/src/results/
libs/contracts/src/api/
libs/api/src/errors/
```

Example files:

```text
libs/core/src/errors/aerealith.error.ts
libs/core/src/errors/base.error.ts
libs/core/src/errors/validation.error.ts
libs/core/src/error-codes/common-error.enum.ts
libs/core/src/error-codes/auth-error.enum.ts
libs/core/src/error-codes/database-error.enum.ts
libs/core/src/results/result.ts
libs/contracts/src/api/api-error.contract.ts
libs/contracts/src/api/api-response.contract.ts
libs/api/src/errors/to-api-error-response.ts
```

Exact paths may evolve, but shared runtime error logic should not live inside one application.

---

## Relationship to Monorepo Boundaries

This RFC builds on:

```text
RFC 0002 — Monorepo Library Boundaries
```

The error model should respect monorepo boundaries:

```text
core error classes -> libs/core
shared API contracts -> libs/contracts
API response mappers -> libs/api
runtime usage -> apps/services and apps/integrations
tooling usage -> tools where useful
```

Libraries should avoid circular dependencies.

---

## Relationship to API Versioning

This RFC builds on:

```text
RFC 0003 — API Versioning and Route Strategy
```

API routes under:

```text
/api/V#/
```

should return consistent error responses.

The route version should not change the meaning of an error code within the same major API version.

Future major API versions may change error response shape only with documented migration notes.

---

## Examples

### Not Found Error

```ts
throw new AerealithError({
  code: 'COMMON_NOT_FOUND',
  message: 'Account acct_123 was not found.',
  safeMessage: 'The requested account was not found.',
  statusCode: 404,
  category: 'common',
  retryable: false,
})
```

### Validation Result

```ts
const result = validateEmail(input.email)

if (!result.ok) {
  return err(
    new AerealithError({
      code: 'COMMON_VALIDATION_ERROR',
      message: 'Email validation failed.',
      safeMessage: 'Please enter a valid email address.',
      statusCode: 422,
      category: 'validation',
      details: {
        fields: [
          {
            path: 'email',
            message: 'Email must be valid.',
            code: 'invalid_email',
          },
        ],
      },
    }),
  )
}
```

### API Error Response

```json
{
  "success": false,
  "error": {
    "code": "COMMON_VALIDATION_ERROR",
    "message": "Please enter a valid email address.",
    "category": "validation",
    "retryable": false,
    "requestId": "req_123",
    "traceId": "trace_456",
    "details": {
      "fields": [
        {
          "path": "email",
          "message": "Email must be valid.",
          "code": "invalid_email"
        }
      ]
    }
  }
}
```

---

## Alternatives Considered

| Option                                  | Summary                                | Why Not                                                |
| --------------------------------------- | -------------------------------------- | ------------------------------------------------------ |
| Throw native `Error` everywhere         | Use plain JavaScript errors only.      | Too inconsistent and lacks stable metadata.            |
| Return `null` or `undefined` on failure | Use missing values as failure signals. | Hides failure causes and creates unsafe ambiguity.     |
| Use strings as errors                   | Return or throw string messages.       | No structure, no codes, no observability.              |
| Result-only model                       | Never throw, always return results.    | Too noisy for unrecoverable or unexpected failures.    |
| Exception-only model                    | Throw for every failure.               | Poor fit for expected validation and preflight checks. |
| HTTP-only error model                   | Model errors only at API boundary.     | Leaves libraries and internal jobs inconsistent.       |

---

## Tradeoffs

| Benefit                   | Cost                                            |
| ------------------------- | ----------------------------------------------- |
| Consistent error handling | Requires discipline across packages.            |
| Stable API error shape    | Must avoid casual changes later.                |
| Better observability      | Requires structured metadata.                   |
| Safer public messages     | Requires separating safe and internal messages. |
| Better testability        | Requires writing failure-path tests.            |
| Cleaner expected failures | Requires using `Result` where appropriate.      |

---

## Risks

```text
Developers may throw plain Error instead of AerealithError.
Error codes may grow inconsistently.
Safe messages may become too vague.
Internal details may accidentally leak into public responses.
Result usage may become overused and noisy.
Exception usage may become overused and unpredictable.
Validation errors may expose unsafe input details.
API error shape may drift between services.
```

---

## Mitigations

```text
Create shared error classes in libs/core.
Create shared error code enums.
Create API error response helpers.
Document throw vs Result rules.
Add tests for error serialization.
Review new error codes before adding them.
Keep public messages safe.
Scrub diagnostic details before public exposure.
Use lint rules or conventions to discourage thrown strings.
```

---

## Security and Trust Impact

This RFC has direct security and trust impact.

The error model must prevent accidental exposure of sensitive data.

Security expectations:

```text
Do not expose secrets in safe messages.
Do not expose raw provider tokens.
Do not expose passwords or private keys.
Do not expose session secrets.
Do not expose internal stack traces in public API responses.
Do not expose private diagnostic details unless explicitly safe.
```

Trust expectations:

```text
Users should receive understandable errors.
API clients should receive stable error codes.
Support should be able to trace failures with request IDs.
Operators should be able to diagnose failures from logs.
Risky failures should be auditable when relevant.
```

---

## Privacy Impact

This RFC has privacy impact because errors can accidentally expose private data.

Privacy requirements:

```text
Public error messages must be safe.
Validation errors should avoid echoing sensitive inputs.
Diagnostic details must be scrubbed when needed.
Logs should not contain secrets or unnecessary private data.
Private data should not be included in error codes.
```

Future privacy docs should define deeper rules for logs, retention, and exports.

---

## AI Impact

This RFC has indirect AI impact.

Future AI-facing systems should use the same error model.

AI-related errors should clearly distinguish:

```text
AI unavailable
model provider failed
context unavailable
approval required
action denied
memory unavailable
unsafe request rejected
rate limited
```

AI errors should not expose private prompt context, hidden system details, provider secrets, or unsafe internal diagnostics.

---

## Self-Hosting and Provider Impact

This RFC supports future self-hosting by avoiding provider-specific error shapes as the core model.

Provider-specific details may exist internally, but public and shared platform errors should use Aerealith error codes.

Provider-specific errors should be mapped into platform errors.

Example:

```text
provider timeout -> INTEGRATION_PROVIDER_TIMEOUT
SMTP unavailable -> INTEGRATION_EMAIL_UNAVAILABLE
storage object missing -> INTEGRATION_STORAGE_OBJECT_NOT_FOUND
```

This keeps provider replacement easier later.

---

## Migration Plan

Because this is an early foundational RFC, no production migration is required.

Implementation migration should include:

```text
Create AerealithError.
Create Result<T, E>.
Create ok and err helpers.
Create common error code enums.
Create domain-specific error classes where useful.
Create API error response contract.
Create API error serialization helper.
Replace thrown strings with AerealithError.
Avoid plain Error for expected platform failures.
Add tests for error shape and serialization.
```

---

## Rollout Plan

```text
Accept this RFC.
Mark this RFC as implemented.
Create core error files in libs/core.
Create result helper files in libs/core.
Create API response contracts in libs/contracts.
Create API error mappers in libs/api.
Use the model during 0.2 core implementation.
Use the API response shape during 0.5 API implementation.
Add observability mapping during 0.9.
```

---

## Acceptance Criteria

This RFC is accepted when:

```text
AerealithError is defined as the base platform error.
Stable error codes are required.
Domain error categories are defined.
Safe public messages are required.
Diagnostic details are separated from public messages.
Result<T, E> is defined for expected recoverable failures.
Throw vs Result rules are documented.
API error response shape is documented.
Validation error shape is documented.
Retryable error behavior is documented.
Request ID and trace ID support is documented.
Logging and observability expectations are documented.
Security and privacy expectations are documented.
```

---

## Implementation Checklist

```text
Mark RFC as reviewed by Timothy Pierce.
Mark RFC as implemented by Timothy Pierce.
Create libs/core/src/errors/aerealith.error.ts.
Create libs/core/src/results/result.ts.
Create libs/core/src/error-codes/.
Create common error code enum.
Create domain error classes as needed.
Create shared API response contracts.
Create API error serialization helper.
Add tests for AerealithError.
Add tests for Result helpers.
Add tests for API error serialization.
Document error code naming rules.
Document public vs internal message rules.
```

---

## Testing Requirements

Testing should verify:

```text
AerealithError sets expected fields.
AerealithError preserves cause where supported.
AerealithError uses safe default messages.
Result ok helper returns expected shape.
Result err helper returns expected shape.
API error serializer uses safeMessage.
API error serializer includes requestId and traceId.
Validation errors serialize field details safely.
Retryable errors serialize retryable status.
Error code mappings return expected HTTP status.
```

Documentation-only testing requires:

```text
Markdownlint passes.
Only one H1 exists.
Tables follow markdownlint spacing.
Frontmatter is valid YAML.
Examples are internally consistent.
```

---

## Documentation Updates

If this RFC changes, update or verify:

```text
docs/rfcs/README.md
docs/rfcs/RFC Template.md
docs/releases/0.1/README.md
docs/releases/0.1/Release.md
docs/releases/0.1/Architecture Changes.md
docs/releases/0.1/Checklist.md
docs/architecture/System Architecture.md
docs/engineering/README.md
docs/api/Errors.md
docs/api/Responses.md
```

---

## Open Questions

```text
Should error codes use enum values, const objects, or string literal unions?
Should API responses always use success/data/error wrappers?
Should Result<T, E> live in libs/core or libs/contracts?
Should validation details follow Zod issue shape or a custom simplified shape?
Should stack traces ever be available in development API responses?
Should retry metadata include retryAfter in the initial implementation?
Should error severity affect alerting in 0.9?
```

---

## Decision

```text
Accepted and implemented.
```

---

## Decision Notes

```text
Reviewed by Timothy Pierce on 2026-07-09.
Implemented by Timothy Pierce on 2026-07-09.
The approved model uses AerealithError, stable error codes, safe public messages, structured API error responses, and Result<T, E> for expected recoverable failures.
```

---

## References

```text
docs/rfcs/README.md
docs/rfcs/RFC Template.md
docs/rfcs/0001-rfc-process.md
docs/rfcs/0002-monorepo-library-boundaries.md
docs/rfcs/0003-api-versioning-and-route-strategy.md
docs/releases/0.1/README.md
docs/releases/0.1/Release.md
```

---

## Final Standard

Aerealith errors should be safe, structured, stable, and useful.

The standard is:

> Expected failures return typed results, unexpected failures throw structured Aerealith errors, public responses expose safe messages, and diagnostics remain useful without leaking private details.
