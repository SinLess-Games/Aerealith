# DEC-002 — Discord MVP Module Scope

Status: Accepted
Owner: SinLess Games LLC
Decision Date: 2026-07-15
Last Updated: 2026-07-15
Document Type: Decision Record
Blocks: 0.7 — Discord Platform Foundation
Supersedes: Conflicting undocumented guidance and deleted RFC references
Superseded By: None

## Summary

The Discord MVP contains eleven required user-facing modules, two should-have modules, and a mandatory module-registry foundation that is not counted as a user-facing module.

## Context

Product documents described different Discord MVP totals. Without a frozen list,
teams could build different definitions of “Discord complete,” and the module
system could expand until the release became unshippable.

## Decision

The following eleven modules are required for MVP:

| Module ID                        | Module                       |
| -------------------------------- | ---------------------------- |
| `mod.discord.core`               | Core Discord Integration     |
| `mod.discord.server-linking`     | Server Linking               |
| `mod.discord.permissions`        | Permissions and Role Mapping |
| `mod.discord.moderation`         | Moderation Basics            |
| `mod.discord.automod`            | Automod Foundation           |
| `mod.discord.tickets`            | Tickets                      |
| `mod.discord.ticket-transcripts` | Ticket Transcripts           |
| `mod.discord.logging`            | Logging and Audit Events     |
| `mod.discord.basic-welcome`      | Basic Welcome                |
| `mod.discord.basic-roles`        | Basic Roles                  |
| `mod.discord.basic-analytics`    | Basic Activity Summaries     |

The following two modules are should-have scope:

| Module ID                     | Module                                           |
| ----------------------------- | ------------------------------------------------ |
| `mod.discord.command-manager` | Command enable and disable controls              |
| `mod.discord.health`          | Missing-permission and Discord health visibility |

The module registry, manifest format, lifecycle, configuration validation, and
enable/disable engine are mandatory platform foundations and are not counted as
one of the eleven user-facing modules.

## Rationale

The required list proves installation, ownership, permissions, moderation,
support, auditability, onboarding, and basic operational awareness. The two
should-have modules improve control and diagnosability without blocking launch
when the core experience is stable.

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

- Every module has a stable ID, version, status, required permissions,
  configuration schema, actions, events, dependencies, risk level, audit
  behavior, and disable behavior.
- Every module supports the lifecycle `Available → Enabled → Configured →
Active → Disabled`.
- Settings survive disable and re-enable unless the user explicitly deletes
  them.
- Discord-native permissions and Aerealith module permissions must both pass.
- No module calls Discord through an unmanaged client.
- Every Discord write action follows risk, approval, and audit rules.

## Verification

- An automated registry test asserts the eleven required IDs exist.
- Lifecycle tests cover enable, configure, disable, and re-enable.
- Permission tests prove missing permission and role hierarchy are detected
  before execution.
- Burst tests prove the shared Discord client respects rate limits.
- Audit tests assert actor, target, module, risk, result, and approval source.

## Implementation Status

The product documentation names the eleven required modules. The registry and runtime implementations remain release work.

## Alternatives Considered

Eight-module and thirteen-module interpretations were rejected because they either omitted required trust and support capabilities or allowed optional scope to become mandatory.

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
