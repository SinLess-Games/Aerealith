# MVP Scope

Status: Target specification
Document Type: Target MVP Scope Gate
Implementation State: Delivery target; completion requires repository and release evidence recorded in [Current State](../CURRENT_STATE.md)
Authority: Target product behavior; [Project Overview](../Project-Overview.md) defines product identity and boundaries

Aerealith is the platform; Aerealith AI is its assistant/application layer.
The Aerealith MVP is the smallest useful, trustworthy, expandable version of the platform.

It should prove that Aerealith can help individuals and Discord communities manage digital complexity from one secure, intelligent, modular control center.

The MVP should not try to ship the entire long-term vision.

It should ship enough to prove:

- Aerealith has a real dashboard.
- Aerealith has a real assistant surface.
- Aerealith can connect Discord.
- Aerealith can manage first-party modules.
- Aerealith can perform basic community operations.
- Aerealith can log meaningful actions.
- Aerealith can suggest and prepare automation.
- Aerealith has clear trust boundaries.
- Aerealith is built on a platform foundation that can grow.

---

## Purpose

This document defines the MVP scope target for Aerealith.

It explains:

- what MVP means
- who MVP serves
- what must be included
- what should be included if practical
- what is intentionally not MVP
- what belongs in Private Beta
- what belongs in Production MVP
- what each product area must prove
- what must be technically ready
- what launch readiness means

This document is a scope gate.

When product ideas grow too large, this document should help decide whether they belong in MVP, post-MVP, future scope, or the parking lot.

---

## MVP Definition

The MVP is:

> The smallest useful, trustworthy, expandable version of Aerealith that proves the platform can manage Discord communities and personal digital complexity from one secure, intelligent control center.

The MVP is not:

- a prototype
- a toy demo
- the full long-term platform
- the marketplace launch
- the self-hosted release
- the full AI autonomy release
- the full Discord super-bot release

The MVP should be useful enough that early users can manage a Discord server and understand Aerealith from the dashboard without needing five disconnected tools.

---

## MVP Product Goal

The MVP product goal is:

> A user can create an account, open the dashboard, connect a Discord server, enable and configure core modules, perform basic moderation and ticket workflows, review audit logs, receive basic notifications, and use the assistant for explanations, suggestions, and approved actions.

The MVP should prove that Aerealith is:

- useful
- trustworthy
- modular
- expandable
- understandable
- permission-aware
- audit-friendly
- AI-assisted, not AI-dependent

---

## MVP Audience

The MVP should primarily target:

```text
Discord communities first, with individual dashboard and assistant foundations included.
```

Discord gives Aerealith the clearest first product proof.

The individual dashboard and assistant foundation keeps the long-term “digital life operating system” direction intact.

---

## MVP Audience Priority

| Priority  | Audience                   | Reason                                                                                        |
| --------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| Primary   | Discord Server Owners      | They need a clear control center for modules, moderation, tickets, roles, logs, and settings. |
| Primary   | Discord Admins / Managers  | They need safe configuration, staff management, module controls, and visibility.              |
| Primary   | Discord Moderators / Staff | They need moderation tools, tickets, notes, history, and audit trails.                        |
| Secondary | Individual Users           | They need account, dashboard, assistant, preferences, notifications, and workflow foundation. |
| Secondary | Creators / Streamers       | They benefit from Discord community operations and future engagement tools.                   |
| Tertiary  | Developers / Power Users   | They need early API conventions, docs, events, and integration foundations.                   |

---

## MVP Success Definition

The MVP succeeds when:

```text
A user can manage a Discord server from Aerealith without needing multiple bots for the core experience.
```

```text
A user can understand and control Aerealith from one dashboard.
```

```text
A user can trust Aerealith because important actions are permissioned, explainable, and logged.
```

The MVP must prove all three.

---

## MVP Experience Summary

A new user should be able to:

1. Create an account.
2. Log in.
3. Open the dashboard.
4. Configure basic profile and assistant settings.
5. Install the Aerealith AI Discord bot.
6. Link a Discord server.
7. Review required permissions.
8. Create or map common server roles.
9. Enable core Discord modules.
10. Configure moderation, automod, tickets, and logs.
11. Perform moderation actions.
12. Create and close support tickets.
13. View ticket transcripts.
14. Review audit logs.
15. Receive basic notifications.
16. Ask the assistant what is happening.
17. See workflow suggestions or basic workflow records.
18. Understand how to disable or change features.

---

## MVP Scope Summary

## MVP Must Prove

| Area                 | MVP Proof                                                          |
| -------------------- | ------------------------------------------------------------------ |
| Account              | Users can sign up, log in, and manage basic settings.              |
| Dashboard            | Users can understand and control Aerealith from one place.         |
| Discord              | Users can install the bot, link a server, and manage core modules. |
| Modules              | First-party modules can be enabled, disabled, and configured.      |
| Roles                | Common roles can be created or mapped safely.                      |
| Moderation           | Staff can perform core moderation actions with audit logs.         |
| Automod              | Basic safety rules can alert or act conservatively.                |
| Tickets              | Communities can create, manage, close, and log tickets.            |
| Assistant            | AI can explain, summarize, suggest, and ask before actions.        |
| Automation           | Workflow foundation exists with suggestions and approval concepts. |
| Integrations         | Core provider integrations exist and are visible.                  |
| Notifications        | Users receive important alerts and approval notifications.         |
| Audit Logs           | Meaningful actions are traceable.                                  |
| Trust                | Permissions, approvals, privacy, and revocation are visible.       |
| Developer Foundation | API, event, error, and webhook conventions are established.        |
| Operations           | Basic observability and deployment readiness exist.                |

---

## MVP Must-Haves

These are required for MVP.

If these are missing, Aerealith is not ready for MVP launch.

```text
Account creation and login
User profile and basic settings
Dashboard shell
Dashboard home
Assistant chat surface
Basic assistant settings
Discord bot install
Discord server linking
Discord server dashboard
Module registry foundation
Module enable/disable
Module settings foundation
Common role creation
Role and permission mapping
Moderation basics
Automod foundation
Tickets
Ticket transcripts
Audit logs
Basic notifications
Workflow foundation
Automation suggestions
Integration dashboard foundation
Discord integration health
Observability foundation
Terms, privacy, and trust pages
Admin/support workflow
```

---

## MVP Should-Haves

These should be included if practical.

They are valuable, but not all of them should block MVP if the core experience is stable.

```text
Basic welcome messages
Basic activity summaries
Command enable/disable basics
Ticket categories
Staff notes
Workflow suggestions
Assistant Discord staff summaries
Missing Discord permission alerts
Basic analytics cards
Webhook foundation
Developer docs foundation
API docs foundation
Basic entitlement awareness
```

---

## MVP Nice-to-Haves

These are useful, but should not delay MVP.

```text
Dice rolling
Basic leveling
Basic reaction roles
Basic announcements
Simple forms
Basic creator notifications
Basic memory review UI
Basic workflow templates
Simple API explorer preview
Simple event explorer preview
Simple billing dashboard
```

If any nice-to-have becomes risky, time-consuming, or distracting, move it post-MVP.

---

## Explicitly Not MVP

These are intentionally not MVP.

They may be important later, but should not block the first production launch.

```text
Marketplace
Third-party modules
Sandboxed plugin runtime
Mobile app
Desktop app
Browser extension
Full self-hosting support
Advanced billing
Full subscription management
Advanced organization governance
Full AI model routing
Local AI models
Fully autonomous AI actions
Automatic AI punishment
Advanced analytics
Economy system
Full music platform
Advanced music playlists
Cross-server community networks
Full developer SDKs
Public app ecosystem
Advanced workflow builder
Complex workflow branching
Private package registry
Enterprise compliance suite
```

---

## Private Beta Scope

Private Beta is allowed to be rougher than Production MVP.

Private Beta proves that the system works end-to-end.

Private Beta should include:

```text
Account login
Dashboard shell
Discord bot install
Discord server linking
Basic module registry
Module enable/disable
Basic role mapping
Moderation basics
Tickets
Ticket close
Basic transcripts
Audit logs
Assistant chat
Assistant explanations
Assistant suggestions
Workflow foundation
Basic notifications
Basic observability
```

Private Beta may have:

- rough UI
- limited settings
- incomplete analytics
- limited workflow behavior
- limited automation
- limited docs
- manual admin/support processes
- first-party-only modules
- test users only
- incomplete billing

Private Beta should not include:

- marketplace
- third-party modules
- full billing
- public self-hosting
- automatic AI punishment
- advanced AI autonomy

---

## Production MVP Scope

Production MVP should feel stable, understandable, and trustworthy.

Production MVP should include:

```text
Stable auth
Stable dashboard
Stable Discord setup
Stable server linking
Stable module settings
Stable common role creation
Stable role and permission mapping
Stable moderation basics
Stable tickets
Stable ticket transcripts
Stable audit logs
Basic notifications
Basic assistant behavior
Basic workflow foundation
Basic integration health
Terms and privacy pages
Trust/safety explanations
Support/admin workflow
Observability and error visibility
```

Production MVP does not need every planned Discord module.

It must deliver a coherent core experience.

---

## MVP Feature Areas

---

## Account & Identity MVP Scope

MVP account features should include:

```text
User registration
User login
User logout
Session handling
Basic profile
Basic account settings
Basic security settings
Connected Discord identity
Account deletion request path
Terms acceptance
Privacy policy access
```

Post-MVP:

```text
Advanced identity management
Organization membership
Advanced sessions
MFA
Passkeys
OAuth provider expansion
Account export
Full data deletion workflow
```

---

## Dashboard MVP Scope

The dashboard is required for MVP.

MVP dashboard should include:

```text
Dashboard home
Setup progress
Attention center foundation
Assistant chat surface
Connected Discord servers
Discord server overview
Discord module grid
Module enable/disable
Module settings foundation
Command enable/disable basics
Roles and permissions page
Common role creation
Moderation logs
Ticket overview
Ticket logs
Audit logs
Basic activity summaries
Workflow overview
Automation suggestions
Integration overview
Notification center foundation
Permission warnings
Missing Discord permission alerts
Basic settings pages
```

MVP dashboard should answer:

```text
What is connected?
What is enabled?
What needs attention?
What happened recently?
What can I configure?
What can I disable?
```

Post-MVP dashboard features:

```text
Advanced workflow builder
Advanced analytics
Advanced search
Custom widgets
Memory review UI
Developer dashboard
Billing dashboard
Organization dashboard
Self-hosted dashboard
Marketplace views
```

---

## Discord MVP Scope

Discord is the flagship MVP product surface.

MVP Discord should include:

```text
Official Aerealith AI Discord bot
Server install flow
Server linking flow
Server dashboard
Core Discord integration
Common role creation
Role and permission mapping
Module manager
Command manager foundation
Moderation basics
Automod foundation
Tickets
Ticket transcripts
Logging and audit events
Basic welcome messages
Basic activity summaries
Integration health
Missing permission warnings
```

---

## Discord MVP Modules

| Module ID                      | Module                     | MVP Requirement     |
| ------------------------------ | -------------------------- | ------------------- |
| mod.discord.core               | Core Discord Integration   | Required            |
| mod.discord.server-linking     | Server Linking             | Required            |
| mod.discord.permissions        | Permissions / Role Mapping | Required            |
| mod.discord.module-manager     | Module Manager             | Required            |
| mod.discord.command-manager    | Command Manager            | Required foundation |
| mod.discord.basic-roles        | Basic Roles                | Required            |
| mod.discord.moderation         | Moderation Basics          | Required            |
| mod.discord.automod            | Automod Foundation         | Required            |
| mod.discord.tickets            | Tickets                    | Required            |
| mod.discord.ticket-transcripts | Ticket Transcripts         | Required            |
| mod.discord.logging            | Logging / Audit Events     | Required            |
| mod.discord.basic-welcome      | Basic Welcome              | Should-have         |
| mod.discord.basic-analytics    | Basic Activity Summaries   | Should-have         |

---

## Discord Moderation MVP Scope

MVP moderation should include:

```text
Warn
Timeout
Kick
Ban
Unban
Delete message
Purge messages
Staff notes
Moderation history
View user context
View moderation case/detail
```

Purge messages is MVP, but it must be treated as high-risk.

Purge messages should require:

- permission check
- role hierarchy check
- explicit confirmation
- amount limit
- reason
- audit log
- optional Discord log channel post
- clear irreversible-action warning

---

## Discord Automod MVP Scope

MVP automod should include:

```text
Blocked words
Spam detection
Repeated message detection
Excessive mentions
Link filtering
Invite filtering
Staff alerts
Basic escalation rules
```

MVP automod should default to conservative behavior.

The safest MVP default is:

```text
Detect → Alert Staff → Log
```

Automatic punishments should be opt-in and clearly configured.

AI should not automatically punish users in MVP.

---

## Discord Tickets MVP Scope

MVP tickets should include:

```text
Ticket panels
Button/select-menu creation
Private ticket channels
Staff role access
Close ticket
Close reason
Ticket transcript creation
Log channel posting
Aerealith transcript storage
Ticket audit events
Basic ticket overview in dashboard
```

Post-MVP tickets:

```text
Ticket forms
Ticket categories
Ticket assignments
Ticket escalation
Ticket SLA/stale ticket rules
Appeals workflow
AI ticket helper
Ticket analytics
```

---

## Discord Roles MVP Scope

MVP roles should include built-in common role concepts.

Aerealith should offer to create common roles if they do not exist.

Common staff roles:

```text
Aerealith Admin
Manager
Moderator
Support Staff
Trial Staff
Read-Only Auditor
Event Manager
Music DJ
Community Helper
```

Common member roles:

```text
Member
New Member
Verified
Muted / Restricted
Subscriber / Supporter
VIP
Bot
Event Participant
Level Roles
```

Role creation must require owner/admin approval.

Aerealith should show a preview before creating roles.

---

## Discord Engagement MVP Scope

Community engagement is important, but it should not overwhelm MVP.

Recommended MVP engagement:

```text
Basic welcome messages
Basic activity summaries
Dice rolling if easy
```

Recommended post-MVP engagement:

```text
Leveling
Level roles
Leaderboards
Reaction roles
Giveaways
Polls
Events
Starboard
Music
Creator notifications
Forms
Custom commands
```

Recommended future engagement:

```text
Reputation
Economy
Challenges / quests
Persona / proxy-style tools
Roleplay campaign tools
Cross-server networks
```

---

## AI Assistant MVP Scope

MVP assistant should include:

```text
Web assistant chat
Basic assistant settings
Explainable responses
Action suggestions
Approval-based actions
Basic memory foundation
Discord staff summaries
Moderation suggestions
Ticket/context summaries
Workflow suggestions
Audit logs for assistant actions
AI availability fallback behavior
```

MVP assistant should not include:

```text
Fully autonomous actions
Automatic AI punishment
Advanced model routing
Local model support
Voice interface
Mobile assistant
Browser extension assistant
Marketplace assistant skills
```

---

## MVP AI Rules

MVP AI must:

- disclose AI involvement where relevant
- explain uncertainty
- ask before meaningful actions
- verify risky actions
- never silently punish Discord users
- never bypass permissions
- never store secrets as memory
- never train on private user data without explicit consent
- create audit logs for meaningful assistant actions
- work as an enhancement, not a hard dependency

---

## Memory MVP Scope

MVP should include a basic memory foundation.

MVP memory should support:

```text
Basic user preferences
Basic assistant preferences
Basic Discord/server context
Basic module preference context
Basic workflow suggestion context
Permission-aware memory use
Memory safety rules
```

Full memory controls can be post-MVP.

Post-MVP memory should include:

```text
Memory review UI
Edit memory
Delete memory
Export memory
Disable memory by scope
Organization memory
Project memory
Memory audit views
Advanced memory explanations
```

MVP memory should be conservative.

---

## Automation MVP Scope

MVP automation should include:

```text
Workflow foundation
Workflow records
Basic workflow status
Manual workflow concepts
Automation suggestions
Basic approval gates
Workflow history foundation
Audit logs
Discord workflow foundations
Ticket-related workflow concepts
Moderation-related workflow suggestions
Notification-related workflows
Assistant-suggested workflows
Basic dashboard visibility
```

MVP automation should not include:

```text
Full visual workflow builder
Complex branching
Loops
Advanced variables
Marketplace workflow packs
AI-orchestrated workflows
Self-hosted runners
Advanced cross-service automation
```

---

## Integrations MVP Scope

MVP integrations should be limited to core platform needs.

Required MVP integrations:

```text
Discord
Resend or email provider
Grafana Cloud / observability
Cloudflare platform bindings
Basic webhooks
```

MVP should include:

```text
Integration dashboard foundation
Integration health status
Permission review
Reconnect/disconnect controls where practical
Audit logs for integration actions
Missing permission warnings
Basic provider failure visibility
```

Post-MVP integrations:

```text
GitHub
Google
SMTP replacement
S3-compatible storage
Cloudinary
Twitch
YouTube
Reddit
Inbound/outbound webhooks expansion
AI provider configuration
```

---

## Developer Platform MVP Scope

MVP developer platform should be foundation-level.

MVP should include:

```text
Developer documentation foundation
API overview
API versioning rules
Authentication documentation
Basic API conventions
Event naming conventions
Error shape conventions
Request ID / trace ID behavior
Webhook foundation
Discord API foundations where needed
Module API foundations where needed
Integration API foundations
Audit log API foundations
API docs linked from dashboard
```

MVP should not include:

```text
Full public SDKs
API key management unless required
API explorer
Event explorer
Marketplace publisher portal
Third-party module publishing
Sandboxed plugin runtime
CLI tool
Full developer sandbox
```

---

## Notifications MVP Scope

MVP notifications should include basic attention and alert behavior.

MVP notifications should support:

```text
Dashboard attention items
Basic in-app notifications
Approval requests
Discord module alerts
Ticket alerts
Moderation alerts
Workflow failure alerts
Integration failure alerts
Missing permission alerts
Basic email notifications where needed
```

Post-MVP notifications:

```text
Notification preferences
Quiet hours
Digest summaries
Priority routing
Mobile push
Advanced notification rules
Notification analytics
```

---

## Audit Logs MVP Scope

Audit logs are required for MVP.

MVP audit logs should include:

```text
User login/security events where relevant
Discord server linked
Discord module enabled
Discord module disabled
Discord module config updated
Role created
Role mapped
Moderation action performed
Messages purged
Ticket created
Ticket closed
Transcript created
Automod rule triggered
Assistant action suggested
Assistant action approval requested
Assistant action executed
Workflow suggested
Workflow executed
Integration connected
Integration disconnected
Permission failure
```

Audit logs should show:

```text
Timestamp
Event
Actor
Target
Context
Module
Risk level
Result
Approval source
Details
```

---

## Observability MVP Scope

MVP should include observability foundations.

MVP observability should include:

```text
Application logs
Worker logs
Request IDs
Trace IDs where practical
Basic error tracking
Basic metrics
Basic uptime/health visibility
Cloudflare observability
Grafana Cloud integration
Important service failure visibility
```

Observability should help answer:

```text
What failed?
Where did it fail?
Who was affected?
Can we recover?
Is it safe to retry?
```

---

## Billing and Entitlements MVP Scope

Billing should not shape MVP too early.

Private Beta may have no billing.

Production MVP may include simple entitlement awareness.

MVP billing scope:

```text
Basic plan/entitlement model
Feature gates where necessary
Internal admin awareness
No marketplace billing
No complex subscription flows unless required
No dark patterns
```

Post-MVP billing:

```text
Subscription billing
Usage limits
Organization billing
Premium modules
Marketplace purchases
Invoices
Plan management dashboard
```

---

## Self-Hosting MVP Scope

Full self-hosting is not MVP.

However, MVP should not block future self-hosting.

MVP should include:

```text
Dockerfiles for deployable apps/services
Clean provider boundaries
Cloud-first but replaceable provider thinking
Environment-based configuration
Avoid hardcoding one provider forever
Document provider assumptions
```

Post-MVP / future:

```text
Docker Compose
Self-hosted installer
Provider replacement dashboard
SMTP setup
S3/MinIO setup
Grafana OSS setup
Local AI setup
Backup/restore
Self-hosted admin dashboard
```

---

## MVP Trust Requirements

Trust is not optional.

MVP must include visible trust behavior.

MVP trust requirements:

```text
Permission explanations
Approval prompts for risky actions
Audit logs for meaningful actions
AI disclosure where relevant
Memory safety rules
Discord role/permission checks
Integration scope explanations
Revocation/disconnect paths
Data ownership language
Terms of service
Privacy policy
Trust/safety page
Failure explanations
Manual controls without AI
```

---

## Risky Action Requirements

Risky actions must require confirmation.

Examples:

```text
Ban user
Kick user
Timeout user
Purge messages
Change role mappings
Create powerful staff roles
Enable automod punishment actions
Disconnect Discord server
Delete workflow
Delete memory
Disable all modules
```

Risky actions should explain:

- what will happen
- who or what is affected
- whether it can be undone
- what permissions are used
- what audit log will be created

---

## MVP Technical Readiness

MVP technical readiness means the platform is stable enough for real early users.

Technical readiness should include:

```text
Build passes
Typecheck passes
Lint passes
Unit tests for core logic
Basic integration tests
Basic Discord bot testing
Basic API testing
Basic dashboard smoke testing
Deployment pipeline
Preview environment
Production environment
Environment variable validation
Secrets handling
Logging
Observability
Error handling
Rate limit awareness
Rollback path
```

---

## MVP Engineering Foundations

MVP should have:

```text
Nx workspace foundation
pnpm workspace foundation
Frontend app foundation
Worker deployment foundation
Core library foundation
API/service foundation
Config/env foundation
Error handling foundation
Database/schema foundation
Discord service foundation
Module registry foundation
Audit logging foundation
Workflow foundation
Integration foundation
Observability foundation
```

---

## Launch Readiness Checklist

Before Production MVP launch, confirm:

## Product

```text
Users can sign up and log in.
Dashboard home works.
Assistant chat works.
Discord bot can be installed.
Discord server can be linked.
Core modules can be enabled/disabled.
Common roles can be created/mapped.
Moderation basics work.
Tickets work.
Ticket transcripts work.
Audit logs work.
Notifications work.
Basic workflow foundation works.
Trust pages exist.
Privacy/terms exist.
```

## Discord

```text
Bot permissions are documented.
Missing permissions are detected.
Role hierarchy issues are explained.
Moderation actions are audited.
Purge requires confirmation.
Tickets create private channels.
Tickets can be closed.
Transcripts are created.
Automod can alert staff.
Server dashboard shows module health.
```

## AI

```text
Assistant explains clearly.
Assistant asks before meaningful actions.
Assistant never auto-punishes Discord users.
Assistant action logs exist.
Assistant works with limited context.
Platform still works if AI is unavailable.
```

## Trust

```text
Risky actions require confirmation.
Permissions are visible.
Audit logs are visible.
Memory behavior is explained.
Integrations can be disconnected.
Data ownership language exists.
Users can disable key features.
```

## Engineering

```text
Production build passes.
Tests pass.
Lint passes.
Typecheck passes.
Deployment works.
Logs work.
Traces/metrics work where configured.
Errors are understandable.
Secrets are not exposed.
Rollback path exists.
```

---

## Post-MVP Parking Lot

These are important, but intentionally parked until after MVP.

```text
Marketplace
Third-party modules
Sandboxed plugin runtime
Advanced Discord engagement
Full leveling system
Music module
Reaction roles
Giveaways
Starboard
Polls
Forms
Advanced automod
Appeals system
Advanced ticket workflows
AI ticket helper
Advanced workflow builder
Workflow templates
Dry runs
GitHub integration
Google integration
Creator integrations
Developer API keys
Developer SDKs
API explorer
Event explorer
Billing dashboard
Organization dashboard
Mobile app
Desktop app
Browser extension
Full self-hosting
Local AI models
Advanced model routing
```

---

## Release Mapping

| Release                                          | Scope                                                                      |
| ------------------------------------------------ | -------------------------------------------------------------------------- |
| 0.1 — Foundation & Workspace                     | Repo, Nx, pnpm, lint, formatting, base structure.                          |
| 0.2 — Core Domain & Data Platform                | Core types, entities, schemas, errors, database foundation.                |
| 0.3 — Authentication & Identity                  | Account, auth, sessions, profile, identity foundation.                     |
| 0.4 — Frontend Platform                          | Dashboard shell, routing, UI foundation, assistant surface.                |
| 0.5 — API & Service Platform                     | API/service foundation, events, workflow records, integrations foundation. |
| 0.6 — Developer Portal & Integrations            | Docs, API conventions, webhooks, integration foundation.                   |
| 0.7 — Discord Platform Foundation                | Bot install, server linking, module registry, role mapping.                |
| 0.8 — Moderation, Tickets & Community Operations | Moderation, automod, tickets, transcripts, logs.                           |
| 0.9 — Observability & Reliability                | Logging, metrics, tracing, health, production readiness.                   |
| 1.0 — Private Beta                               | End-to-end testing with early users.                                       |
| 1.1 — MVP Production Launch                      | Stable MVP release.                                                        |

---

## MVP Review Questions

Before adding anything to MVP, ask:

- Does this prove the core product?
- Does this serve the primary MVP audience?
- Does this reduce digital complexity?
- Does this keep users in control?
- Is this required for Discord community management?
- Is this required for dashboard trust?
- Is this required for assistant usefulness?
- Is this required for safety or auditability?
- Can this wait until post-MVP?
- Will this delay the core launch?
- Can this be simpler first?
- Does this create new risk?
- Does this require more support than we can handle?
- Does this depend on marketplace, billing, or advanced AI?
- Can users understand it?
- Can users disable it?
- Can it fail safely?

If the feature is cool but not required, move it to post-MVP.

---

## Final MVP Standard

The MVP should make Aerealith feel real, useful, and trustworthy.

It should let users manage a Discord community from one dashboard, use the assistant for explanation and suggestions, configure first-party modules, perform basic moderation and ticket workflows, review audit logs, and receive important notifications.

It should not ship the entire dream.

It should ship the first trustworthy version of the dream.

The MVP standard is:

> Aerealith helps users and Discord communities manage digital complexity from one secure, intelligent, modular control center — without hiding control, permissions, or actions from the user.
