# Aerealith Decision Register

Status: Active
Owner: SinLess Games LLC
Last Updated: 2026-07-15
Document Type: Decision Index
Authority: Canonical index for accepted Aerealith project decisions

## Project Context

- [Project Overview](../Project-Overview.md)
- [Company and Project Structure](../Company-and-Project-Structure.md)
- [Current State](../CURRENT_STATE.md)
- [Documentation Index](../README.md)

## Purpose

This directory records decisions that resolve conflicts across product,
architecture, engineering, release, and implementation documentation.

A decision record explains what was decided, why it was decided, what it
changes, and how compliance is verified. Decision records do not replace the
canonical technology inventory in [`docs/STACK.md`](../STACK.md).

## Authority

Accepted decisions are binding even when implementation is incomplete. Active
architecture and engineering documents must align with them. Release plans may
sequence implementation but must not redefine a permanent decision.

A material reversal requires a new decision that supersedes the previous record.
Accepted records are not silently rewritten to erase historical reasoning.

## Decision Index

| ID                                                            | Decision                                       | Status   | Blocks   |
| ------------------------------------------------------------- | ---------------------------------------------- | -------- | -------- |
| [DEC-001](./DEC-001-api-route-prefix.md)                      | Canonical public API route prefix              | Accepted | 0.5      |
| [DEC-002](./DEC-002-discord-mvp-module-scope.md)              | Discord MVP module scope                       | Accepted | 0.7      |
| [DEC-003](./DEC-003-mvp-ai-assistant-boundaries.md)           | MVP AI assistant boundaries                    | Accepted | 0.4, 0.8 |
| [DEC-004](./DEC-004-relational-database-and-orm.md)           | Relational database and ORM                    | Accepted | 0.2      |
| [DEC-005](./DEC-005-shared-library-set.md)                    | Canonical shared-library set                   | Accepted | 0.2      |
| [DEC-006](./DEC-006-domain-persistence-mapping.md)            | Domain and persistence mapping ownership       | Accepted | 0.2      |
| [DEC-007](./DEC-007-error-code-representation.md)             | Error-code representation                      | Accepted | 0.2      |
| [DEC-008](./DEC-008-result-primitive-location.md)             | Result primitive ownership                     | Accepted | 0.2      |
| [DEC-009](./DEC-009-persistence-entity-form.md)               | Persistence entity form                        | Accepted | 0.2      |
| [DEC-010](./DEC-010-api-response-envelope.md)                 | Mandatory API response envelope                | Accepted | 0.5      |
| [DEC-011](./DEC-011-platform-providers-vs-integrations.md)    | Platform providers versus product integrations | Accepted | 0.6      |
| [DEC-012](./DEC-012-webhook-foundation-scope.md)              | Webhook foundation scope                       | Accepted | 0.6      |
| [DEC-013](./DEC-013-notification-and-ticket-summary-scope.md) | Notification preferences and ticket summaries  | Accepted | 0.8      |
| [DEC-014](./DEC-014-mvp-persona-priority.md)                  | MVP persona priority                           | Accepted | 0.4      |
| [DEC-015](./DEC-015-scope-classification-language.md)         | Unambiguous scope classification               | Accepted | 0.4+     |

## Required Record Sections

Every record contains:

- Metadata and authority.
- Context and conflict.
- Binding decision.
- Rationale.
- Consequences.
- Implementation requirements.
- Verification criteria.
- Implementation status.
- Alternatives considered.
- Related documentation and supersession data.
