---
description: Apply Aerealith documentation standards when creating, editing, reviewing, auditing, reorganizing, or answering questions about project documentation. Use the Project Documenter plugin for repository-aware documentation analysis whenever it is available.
applyTo: '**/*.md,docs/**,.github/**/*.md,README.md,CONTRIBUTING.md,SECURITY.md,CHANGELOG.md'
---

# Aerealith Documentation Instructions

These instructions apply to documentation work throughout the Aerealith
repository.

Use them when:

- Creating new documentation
- Rewriting or expanding existing documentation
- Reviewing Markdown changes
- Auditing documentation
- Updating README files
- Creating contributor or onboarding guides
- Documenting architecture or engineering behavior
- Recording product requirements
- Writing decision records
- Updating roadmaps or release documentation
- Reviewing claims about current functionality
- Adding links or navigation
- Answering questions about project terminology or documentation structure

Treat documentation as part of the product.

Documentation changes must be accurate, maintainable, properly scoped, and
understandable without access to private project context.

---

# Project Documenter Plugin

Use the **Project Documenter** plugin whenever it is installed and available.

Use it to:

- Inspect repository structure
- Inventory documentation
- Identify relevant source files
- Discover existing documentation
- Detect duplicated documentation
- Detect stale or contradictory claims
- Identify missing documentation
- Find undocumented public interfaces
- Analyze source code before documenting current behavior
- Generate initial documentation structure
- Verify documentation coverage
- Find broken or outdated references
- Compare documentation against implementation

Do not rely on the plugin blindly.

Treat plugin output as evidence to review, not unquestionable truth.

Before accepting generated documentation:

1. Verify findings against repository files.
2. Confirm current implementation status.
3. Check terminology against authoritative documentation.
4. Remove speculative claims.
5. Separate current capabilities from planned work.
6. Review all generated links.
7. Ensure generated text follows Aerealith documentation standards.
8. Review the final Git diff.

When the Project Documenter plugin is unavailable:

- Continue using repository search, source inspection, Git history, configuration
  files, tests, and existing documentation.
- Do not claim the plugin was used.
- State any validation limitations that remain.

---

# Canonical Product Distinction

Always preserve the distinction between the platform and its assistant.

## Aerealith

**Aerealith** is the platform.

Aerealith is a modular digital orchestration platform intended to connect
applications, services, communities, workflows, infrastructure, knowledge,
automation, and intelligent capabilities through a trusted control layer.

## Aerealith AI

**Aerealith AI** is the intelligent assistant within Aerealith.

It provides conversational interaction, contextual assistance, recommendations,
explanations, summaries, and workflow support within explicit permissions and
approved boundaries.

Use this canonical rule:

> **Aerealith is the platform.**
>
> **Aerealith AI is the assistant within the platform.**

Do not use **Aerealith AI** as the authoritative name of the entire platform.

The Discord application may use the public name **Aerealith AI**, but Discord is
only one integration within the larger Aerealith platform.

---

# Canonical Positioning

Preserve the primary positioning:

> **Aerealith is the operating system for your digital life.**

Preserve the project North Star:

> **Reduce digital complexity without reducing user control.**

Preserve the project tagline:

> **One Platform. Infinite Possibilities.**

The tagline expresses platform potential.

It must not be used as evidence that every envisioned capability is already
implemented.

---

# Project Relationships

Use company and project names consistently.

Unless an authoritative company-structure document states otherwise:

```text
SinLess Industries
└── SinLess Games LLC
    └── Aerealith
        └── Aerealith AI
```

Use:

- **SinLess Industries** for the broader parent or umbrella identity only where
  that relationship has been formally documented.
- **SinLess Games LLC** for the legal project owner, development entity,
  copyright holder, or contractual entity where verified.
- **Aerealith** for the product, platform, repository, and project.
- **Aerealith AI** for the intelligent assistant and branded assistant
  applications.

Do not invent legal relationships, ownership claims, trademarks, corporate
structures, or contractual authority.

When the relationship is not verified, identify the uncertainty instead of
guessing.

---

# Documentation Source of Truth

Before creating or modifying documentation:

1. Search for existing documentation on the subject.
2. Identify the authoritative source.
3. Inspect related source code and configuration when documenting current
   behavior.
4. Review related architecture and decision records.
5. Check the roadmap and release documentation.
6. Look for duplicate or contradictory descriptions.
7. Preserve accepted terminology and decisions.
8. Decide whether the target document should be updated or whether a new
   document is justified.

Prefer improving an existing authoritative document over creating another
competing source of truth.

Supporting documents should link to the authoritative source rather than repeat
large sections of canonical content.

---

# Documentation Hierarchy

Use the following documentation hierarchy.

```text
Vision
├── explains why Aerealith exists
├── establishes long-term direction
└── constrains lower-level decisions

Product
├── defines users and needs
├── defines product behavior
├── defines capability boundaries
└── translates vision into requirements

Architecture
├── defines structural design
├── defines system boundaries
├── defines major relationships
└── explains technical direction

Decision Records
├── preserve binding choices
├── explain alternatives
├── record consequences
└── preserve historical context

Engineering
├── defines development standards
├── defines repository workflows
├── defines testing expectations
└── explains implementation practices

Security
├── defines protection requirements
├── defines trust boundaries
├── defines threat handling
└── defines security review expectations

Operations
├── defines deployment
├── defines maintenance
├── defines observability
├── defines incident handling
└── defines backup and recovery

Current State
├── records what exists now
├── identifies incomplete work
└── separates implementation from aspiration

Roadmaps and Releases
├── define planned sequence
├── record delivered scope
├── define release gates
└── distinguish planned work from shipped work
```

Do not place detailed implementation procedures in vision documents.

Do not treat roadmap entries as shipped capabilities.

Do not use architecture documentation as marketing copy.

Do not use historical planning material as proof of current behavior.

---

# Capability Status

Use the following status language consistently:

- **Current** — implemented, verified, and available now
- **In Progress** — actively being developed
- **Planned** — approved but not yet complete
- **Future** — expected beyond the immediate roadmap
- **Vision** — long-term direction without a committed release
- **Blocked** — unable to proceed because a dependency or decision is unresolved
- **Deferred** — intentionally postponed
- **Complete** — all stated exit criteria have been satisfied
- **Deprecated** — still present but scheduled for removal or replacement
- **Historical** — retained as a record and not authoritative for current behavior

Never present planned, future, or vision-level capabilities as current.

Do not infer implementation merely because:

- A dependency is listed
- A package exists
- A roadmap mentions it
- A design document describes it
- A mockup shows it
- An old presentation promises it
- A partial interface exists
- A feature branch contains unfinished work

When current status cannot be verified, state that explicitly.

---

# Current-State Verification

When documenting current functionality, inspect relevant evidence.

Evidence may include:

- Source code
- Tests
- Package manifests
- Workspace configuration
- Environment examples
- Database migrations
- API definitions
- Dockerfiles
- Deployment configuration
- CI workflows
- Release notes
- Current-state documentation
- Active pull requests
- Active issues
- Project boards
- Operational configuration

Use the Project Documenter plugin to help locate this evidence when available.

Do not document a capability as complete unless its meaningful behavior can be
verified.

Use wording such as:

> This capability is planned but has not been verified as currently implemented.

or:

> The repository contains an initial implementation, but production readiness has
> not been established.

---

# Known Technology Direction

The intended or active technology direction may include:

## Repository and Tooling

- TypeScript
- Nx
- pnpm

## Frontend

- Vite
- React
- React Router
- Tailwind CSS
- TanStack tools

## Backend

- Hono

## Data

- PostgreSQL
- CockroachDB
- Drizzle ORM

## Infrastructure

- Docker
- GitHub Actions
- Cloudflare
- Nx Cloud

## Observability and Quality

- Datadog
- Grafana-compatible observability
- Codecov
- Meticulous AI

## Security and Dependency Management

- Snyk
- Semgrep
- Dependabot
- Renovate

## External Services

- Resend
- Cloudinary

Verify whether each tool is current, planned, experimental, or future before
describing it as actively used.

Prefer the canonical stack documentation for detailed technology claims.

---

# Core Product Principles

Documentation must remain consistent with the following principles.

## User Control

Users, communities, and organizations must retain meaningful control over their
data, permissions, integrations, workflows, and automations.

## Progressive Trust

Trust is earned rather than assumed.

Automation authority should grow through deliberate approval and demonstrated
reliability.

## Transparency

Meaningful behavior should be understandable, explainable, and auditable.

## Integration Before Replacement

Connect capable existing systems before rebuilding their functionality.

Build native functionality when it provides meaningful value beyond an
integration.

## Modularity

Capabilities should be independently configurable and should not require users
to adopt unrelated functionality.

## Extensibility

Major platform capabilities should expose governed interfaces where appropriate.

These may include:

- APIs
- Events
- Commands
- Webhooks
- SDKs
- Modules
- Workflows

## Security

Security is part of product behavior and must not be treated as a final
implementation phase.

## Provider Independence

Critical providers should remain replaceable where practical.

Avoid unnecessary vendor lock-in.

## Self-Hosting

Self-hosting is an important long-term direction.

Do not claim it is currently supported unless installation, upgrade, security,
backup, recovery, and operational procedures have been verified.

## Documentation

A capability is incomplete when its intended users, developers, operators, or
maintainers cannot understand it.

---

# Trust and AI Requirements

Preserve these rules in all documentation:

- AI output is not authorization.
- Model confidence is not proof.
- AI recommendations cannot bypass platform policy.
- Meaningful actions require explicit authority.
- Permissions should follow least privilege.
- Sensitive actions require stronger verification.
- Actions should be explainable and auditable.
- Automation should be bounded, reviewable, and revocable.
- Failures should be visible, safe, and recoverable.
- Human authority must remain clear.
- Cross-tenant trust must never be assumed.
- Discord permissions alone are not proof of user intent.

Do not describe Aerealith AI as an unrestricted autonomous agent.

Do not imply that a model can authorize its own actions.

---

# Discord Documentation

Discord is the first flagship integration.

It may be described as:

- A major platform integration
- A first-class integration
- An initial community-management surface
- A proving ground for modular platform capabilities
- The first major real-world integration

Discord capabilities may include:

- Moderation
- Tickets
- Onboarding
- Verification
- Roles
- Community analytics
- Notifications
- Automation
- Audit logging
- AI-assisted operations

Verify implementation status before describing any capability as current.

Do not describe Aerealith as only a Discord bot.

Discord is part of a larger modular platform.

---

# Document Metadata

Use a metadata block for major canonical documents where appropriate.

```md
# Document Title

Status: Draft
Owner: SinLess Games LLC
Last Updated: YYYY-MM-DD
Document Type: Appropriate Type
```

Common status values include:

- Draft
- Active
- Planned
- Proposed
- Accepted
- Deprecated
- Superseded
- Historical
- Archived

Only update `Last Updated` when meaningful content changes.

Do not update dates for formatting-only changes unless repository policy requires
it.

---

# Writing Style

Use a professional, direct, durable documentation style.

Write for readers who do not possess private project context.

Documentation should be:

- Clear
- Accurate
- Structured
- Complete
- Searchable
- Accessible
- Internally consistent
- Honest about uncertainty
- Appropriate for long-term maintenance

Prefer full sentences.

Prefer explicit statements.

Prefer concrete nouns over vague references.

Prefer:

> Aerealith validates authorization before executing a meaningful action.

Avoid:

> The system probably checks access when needed.

Avoid unnecessary filler, marketing exaggeration, vague promises, and repetitive
restatement.

Use strong requirements language only for approved requirements or established
principles.

---

# Heading and Structure Rules

Use one level-one heading for the document title.

Follow a logical heading hierarchy:

```text
# Document Title
## Major Section
### Subsection
#### Detail
```

Do not skip heading levels without a clear structural reason.

Use sections that help the document rather than mechanically adding a fixed
template.

Possible sections include:

- Purpose
- Scope
- Audience
- Definitions
- Context
- Problem
- Goals
- Non-Goals
- Principles
- Requirements
- Current State
- Planned Direction
- Architecture
- Security Considerations
- Operational Considerations
- Dependencies
- Risks
- Testing
- Validation
- Related Documentation
- Success Criteria
- Exit Criteria
- Final Standard

---

# Markdown Rules

Use standard GitHub-flavored Markdown.

- Use fenced code blocks with a language identifier when known.
- Use tables only when they improve comparison or scanning.
- Keep tables readable and avoid long prose inside cells.
- Use lists for collections, not as a substitute for all prose.
- Use blockquotes for canonical statements or important principles.
- Use Mermaid diagrams when they clarify relationships or flow.
- Add descriptive text around diagrams.
- Do not depend on diagrams alone to communicate critical meaning.
- Avoid raw HTML unless Markdown cannot express the required structure.
- Keep line wrapping consistent with nearby repository documentation.
- Preserve valid anchors when practical.

---

# Links and Navigation

Use relative repository links for internal documentation.

Before adding a link:

1. Confirm the target exists.
2. Confirm exact capitalization.
3. Confirm the path relative to the current file.
4. Encode spaces when required.
5. Confirm the target is authoritative.
6. Run available link validation.

Major overview documents should provide paths to:

- Vision
- Product
- Architecture
- Engineering
- Security
- Operations
- Current State
- Roadmap
- Releases
- Contributor onboarding
- Decision records

Add backlinks when they improve navigation.

Do not add placeholder links to nonexistent files without clearly marking them as
planned.

---

# Canonical Rewrite Behavior

When asked to expand or rewrite an existing document:

1. Read the complete document.
2. Inspect related documentation.
3. Use the Project Documenter plugin to identify related files when available.
4. Preserve valid intent.
5. Preserve accepted decisions.
6. Correct inconsistent terminology.
7. Remove or clarify unsupported claims.
8. Separate current state from future direction.
9. Improve navigation.
10. Add missing context.
11. Preserve useful historical information.
12. Return a coherent complete document unless a patch is explicitly requested.

Do not merely append new sections to an incoherent document when a complete
rewrite would produce a better authoritative source.

Avoid changing the meaning of accepted decisions without an approved decision
process.

---

# Documentation Audit Procedure

When auditing documentation:

1. Define the audit scope.
2. Inventory relevant files.
3. Run the Project Documenter plugin when available.
4. Identify authoritative documents.
5. Locate duplicate content.
6. Locate contradictory claims.
7. Locate outdated terminology.
8. Locate stale status metadata.
9. Locate broken links.
10. Locate missing reading paths.
11. Locate future capabilities presented as current.
12. Locate active references to historical project names.
13. Locate missing ownership or maintenance information.
14. Locate undocumented public interfaces.
15. Record findings and required actions.

Use a table such as:

| Location | Finding | Severity | Required Action | Status |
| -------- | ------- | -------- | --------------- | ------ |

Useful classifications include:

- Correct
- Missing
- Broken link
- Outdated
- Contradictory
- Duplicate
- Needs clarification
- Needs terminology update
- Historical
- Future claim presented as current
- Unverified implementation claim

Do not claim an audit is complete unless the stated scope was actually reviewed.

---

# Decision Records

Create or recommend a decision record when documentation introduces, changes, or
reverses a binding choice involving:

- Product identity
- Product boundaries
- Architecture
- Authentication
- Authorization
- Data ownership
- Privacy
- Trust
- Security
- Multi-tenancy
- Deployment
- Self-hosting
- Provider selection
- Major technology
- Public API contracts
- Compatibility
- Long-term platform direction

A decision record should normally include:

- Title
- Status
- Context
- Decision
- Alternatives
- Consequences
- Security implications
- Operational implications
- Related documentation
- Supersession information

Do not rewrite an accepted historical decision to conceal that the decision
changed.

Create a new superseding record where appropriate.

---

# API and Code Documentation

When documenting code or public interfaces:

- Inspect the implementation.
- Inspect tests.
- Inspect type definitions.
- Inspect validation rules.
- Inspect error handling.
- Inspect authorization behavior.
- Inspect configuration.
- Inspect examples.
- Inspect versioning behavior.

Document:

- Purpose
- Inputs
- Outputs
- Errors
- Permissions
- Side effects
- Idempotency expectations
- Security considerations
- Examples
- Limitations
- Stability

Do not document internal implementation details as stable public contracts unless
they are intentionally exposed.

Use Project Documenter to identify undocumented exports, APIs, modules, or
configuration when available.

---

# README Requirements

A README should quickly answer:

- What is this?
- Why does it exist?
- Who is it for?
- What is its current status?
- How do I use or develop it?
- Where is the detailed documentation?
- Who owns or maintains it?

Avoid turning every package README into a copy of the full project overview.

Package and service READMEs should focus on local responsibility and link to
canonical project-level documentation.

---

# Contributor Documentation

Contributor documentation should include or link to:

- Prerequisites
- Supported runtime versions
- Package manager
- Installation
- Environment setup
- Local development
- Validation commands
- Testing
- Linting
- Formatting
- Commit conventions
- Pull-request expectations
- Security reporting
- Documentation expectations
- Troubleshooting

Commands must be verified before publication.

Do not invent scripts that do not exist in the repository.

---

# Security Documentation

Security-sensitive documentation must clearly distinguish:

- Public information
- Internal operational information
- Confidential configuration
- Secrets

Never place real secrets, credentials, private keys, access tokens, recovery
codes, or sensitive internal addresses in documentation.

Use placeholders in examples:

```env
API_TOKEN=<replace-with-secure-token>
DATABASE_URL=<replace-with-database-url>
```

Do not provide examples that disable essential security protections without a
clear, limited, and justified development-only context.

---

# Repository Editing Workflow

Before editing:

1. Inspect the target document.
2. Inspect the nearest README or index.
3. Search for references to the target.
4. Identify naming and casing conventions.
5. Review related decisions.
6. Review the current Git diff.
7. Run Project Documenter analysis when useful.

During editing:

- Keep changes focused.
- Preserve valid content.
- Avoid unrelated code changes.
- Maintain repository formatting.
- Use canonical terms.
- Add verified links.
- Avoid generated filler.
- Mark uncertainty honestly.

After editing:

1. Review the complete diff.
2. Validate Markdown.
3. Validate internal links.
4. Search for terminology conflicts.
5. Recheck implementation claims.
6. Confirm indexes and navigation are updated.
7. Confirm no unrelated files changed.
8. Summarize remaining concerns.

---

# Review Checklist

Before considering documentation complete, verify:

## Accuracy

- Claims match available evidence.
- Current and future capabilities are separated.
- Technology claims are verified.
- Legal relationships are not invented.
- Commands and paths exist.

## Consistency

- Aerealith and Aerealith AI are distinguished.
- Company names are used correctly.
- Terminology matches authoritative documentation.
- The document does not contradict accepted decisions.

## Structure

- The purpose is clear.
- Headings are logical.
- The intended audience is identifiable.
- Important context appears before detail.
- Repetition is controlled.

## Navigation

- Links resolve.
- Indexes are updated.
- Related documents are linked.
- New readers have a clear next step.

## Trust and Security

- AI authority is not overstated.
- Permission requirements are represented.
- Sensitive information is excluded.
- Security consequences are documented where relevant.

## Maintenance

- Owner and status are accurate where applicable.
- The update date is appropriate.
- Historical content is labeled.
- The document has an identifiable source of truth.

---

# AAPE Completion Reviews

When reviewing an AAPE documentation task:

1. Read the objective.
2. Read the scope.
3. Read the expected outputs.
4. Read dependencies.
5. Read the completion standard.
6. Inspect repository evidence.
7. Use Project Documenter to locate supporting documentation when available.
8. Compare the evidence against every required output.
9. Identify partial or missing work.
10. Classify the task accurately.

Use these classifications:

- **Complete**
- **Substantially Complete**
- **In Progress**
- **Blocked**
- **Not Started**

Do not close a task because a related document exists.

Close it only when its specific completion standard is met.

Provide:

- Evidence
- Missing work
- Exact files requiring changes
- Validation required before closure

---

# Prohibited Behavior

Do not:

- Invent current functionality.
- Present roadmap work as shipped.
- Invent legal or corporate relationships.
- Describe Aerealith as only a Discord bot.
- Use Aerealith AI as the canonical platform name.
- Treat AI output as authorization.
- Treat model confidence as proof.
- Claim self-hosting is available without evidence.
- Create duplicate sources of truth without justification.
- Remove historical decisions without preserving their record.
- Add unverified links.
- Add commands that have not been checked.
- Hide contradictions.
- Claim an audit is complete without reviewing its scope.
- Accept plugin-generated content without verification.
- Rewrite unrelated code during a documentation-only task.
- Use private project context as a substitute for written explanation.

---

# Completion Standard

Documentation work is complete when:

- The intended audience can understand the subject without private context.
- The document has a clear purpose.
- Terminology is consistent.
- Current and future capabilities are separated.
- Major claims are supported by authoritative sources.
- Links resolve.
- Relevant indexes are updated.
- Contradictions are resolved or recorded.
- Security and trust implications are represented.
- The content matches repository evidence.
- Project Documenter output has been reviewed rather than copied blindly.
- The final diff contains no unrelated changes.
- Remaining uncertainty is stated honestly.

At the end of a documentation task, report:

- What changed
- Files changed
- Authoritative sources used
- Project Documenter checks performed
- Validation performed
- Unresolved questions
- Recommended follow-up work
