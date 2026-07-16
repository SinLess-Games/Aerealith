# Operations

Status: Active
Owner: SinLess Games LLC
Last Updated: 2026-07-15
Document Type: Operations Index

## Purpose

This directory contains the procedures required to deploy, observe, support,
recover, and safely roll back Aerealith.

Operations documentation describes actions, not aspirations. A procedure is not
considered verified until it has been exercised in a non-production environment
or during a controlled production event.

## Required Operational Areas

| Area                | Required Documentation                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Environments        | Environment names, ownership, access, data classification, and promotion rules.          |
| Deployment          | Build, validation, release, promotion, and rollback procedures.                          |
| Monitoring          | Logs, metrics, traces, dashboards, alerts, and ownership.                                |
| Incident response   | Severity, triage, communication, containment, recovery, and review.                      |
| Backup and recovery | Backup scope, retention, restoration, verification, and recovery objectives.             |
| Secrets             | Rotation, revocation, emergency replacement, and audit expectations.                     |
| Database            | Migration, rollback, restore, consistency checks, and CockroachDB compatibility testing. |
| Discord             | Token rotation, bot disconnects, permission loss, rate limits, and guild unlinking.      |
| Cloudflare          | Deployment recovery, access recovery, Worker rollback, and binding verification.         |

## Runbook Standard

Every runbook must state:

1. When the procedure should be used.
2. Who owns it and who may execute it.
3. Required access and tools.
4. Risks and user impact.
5. Preconditions.
6. Exact ordered steps.
7. Expected output.
8. Success verification.
9. Rollback or abort behavior.
10. Audit and communication requirements.
11. Last exercise date.

## Operational Gate

A release does not pass the Operations Gate until:

- Deployable units have documented build and release paths.
- Health and readiness checks reflect real dependencies.
- Logs contain no secrets or unnecessary personal data.
- Alerts have an owner and an actionable response.
- Rollback has been rehearsed.
- Backup restoration has been verified where state is introduced.
- Incident and support ownership is explicit.

## Initial Runbook Backlog

- Deploy and roll back the frontend Worker.
- Deploy and roll back an independently deployed service.
- Rotate the Discord bot token.
- Recover from Discord permission loss.
- Disconnect a compromised integration.
- Revoke all sessions for an account.
- Restore PostgreSQL from backup.
- Validate CockroachDB migration compatibility.
- Recover Cloudflare access.
- Retry or quarantine failed event deliveries.
- Disable a dangerous workflow or module.
