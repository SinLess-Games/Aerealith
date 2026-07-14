# Documentation Standards

Status: Draft
Owner: Tim Pierce / SinLess Games
Last Updated: 2026-07-13
Security Classification: Internal Engineering
Primary Documentation Format: Markdown
Documentation Model: Docs as Code
Primary Repository Location: `docs/`
Diagram Format: Mermaid where practical
Primary Language: English
Version Control: Git

Related Engineering Documentation:

- `docs/engineering/Code Style.md`
- `docs/engineering/Testing.md`
- `docs/engineering/TypeScript Standards.md`
- `docs/engineering/Package Management.md`
- `docs/engineering/Monorepo Rules.md`
- `docs/engineering/Dependency Rules.md`
- `docs/engineering/Environment Variables.md`
- `docs/engineering/Secrets.md`
- `docs/engineering/Docker.md`
- `docs/engineering/Cloudflare.md`
- `docs/engineering/Git Workflow.md`
- `docs/engineering/Security Practices.md`
- `docs/engineering/Release Process.md`

Related Architecture:

- `docs/architecture/Monorepo Architecture.md`
- `docs/architecture/Frontend Architecture.md`
- `docs/architecture/API Architecture.md`
- `docs/architecture/Service Architecture.md`
- `docs/architecture/Data Architecture.md`
- `docs/architecture/Auth Architecture.md`
- `docs/architecture/Security Architecture.md`
- `docs/architecture/Discord Architecture.md`
- `docs/architecture/Module Architecture.md`
- `docs/architecture/Workflow Architecture.md`
- `docs/architecture/AI Architecture.md`
- `docs/architecture/Integration Architecture.md`
- `docs/architecture/Notification Architecture.md`
- `docs/architecture/Audit Architecture.md`
- `docs/architecture/Observability Architecture.md`
- `docs/architecture/Local Development.md`

Related RFCs:

- `docs/rfcs/0001-project-identity-and-terminology.md`
- `docs/rfcs/0002-monorepo-library-boundaries.md`
- `docs/rfcs/0003-api-versioning-and-route-strategy.md`
- `docs/rfcs/0004-error-and-result-model.md`
- `docs/rfcs/0005-entity-schema-and-contract-strategy.md`
- `docs/rfcs/0008-configuration-and-secrets-model.md`
- `docs/rfcs/0010-api-envelope-request-and-trace-id-propagation.md`
- `docs/rfcs/0011-event-envelope-audit-model-and-idempotency.md`
- `docs/rfcs/0012-workflow-records-and-approval-primitive.md`
- `docs/rfcs/0013-provider-abstraction-and-integration-interface.md`
- `docs/rfcs/0014-module-registry-manifest-and-lifecycle.md`
- `docs/rfcs/0015-discord-permission-role-hierarchy-and-action-safety.md`
- `docs/rfcs/0016-ai-assistant-boundaries-and-mvp-memory-scope.md`
- `docs/rfcs/0017-observability-trace-propagation-and-alerting.md`

---

## Purpose

This document defines the documentation standards for Aerealith AI.

It governs how contributors create, organize, write, review, update, validate, publish, archive, and remove technical documentation throughout the repository.

The standard covers:

```text
architecture documentation
engineering standards
RFCs
ADRs
API documentation
runbooks
operations guides
security procedures
incident documentation
release documentation
project READMEs
module documentation
integration documentation
workflow documentation
configuration reference
environment-variable reference
database documentation
diagrams
code examples
generated documentation
user-facing technical guides
```

The objective is to make Aerealith documentation:

```text
accurate
discoverable
consistent
maintainable
searchable
versioned
secure
accessible
actionable
aligned with implementation
```

The guiding rule is:

> Documentation is part of the product and engineering system. It must be reviewed, versioned, tested, and maintained with the same care as source code.

Documentation that is inaccurate can be more dangerous than missing documentation because it creates false confidence.

---

## Core Principles

Aerealith documentation follows these principles:

```text
Documentation lives close to the code and decisions it describes.
Documentation changes with implementation changes.
Every significant document has an owner.
Every significant document declares its status.
Architecture describes boundaries and intent.
Engineering standards define enforceable rules.
RFCs record proposed and accepted decisions.
Runbooks describe actionable operational procedures.
Examples must be safe and executable where practical.
Secrets and private data never appear in documentation.
Diagrams must match the surrounding text.
Links must be valid.
Terminology must remain consistent.
Deprecated behavior must be labeled clearly.
Generated documentation must identify its source.
Documentation should answer why, what, how, and who owns it.
```

---

## Documentation as Code

Aerealith uses a docs-as-code model.

Documentation should be:

```text
stored in Git
reviewed through pull requests
validated in CI
linked to implementation
updated with related changes
searchable from the repository
renderable without proprietary tooling
```

Documentation is not considered complete merely because information exists in:

```text
Discord messages
issue comments
Slack messages
private notes
meeting recordings
developer memory
```

Important decisions and procedures must be captured in the repository.

---

## Documentation Scope

This standard applies to documentation stored in:

```text
docs/
README files
package documentation
code comments
configuration comments
generated references
release notes
runbooks
```

It also applies to externally published copies derived from repository documentation.

---

## Documentation Categories

Aerealith documentation is organized into categories based on purpose.

Primary categories:

```text
architecture
engineering
RFCs
operations
security
API
integrations
modules
workflows
runbooks
releases
reference
guides
```

---

## Repository Documentation Structure

Recommended structure:

```text
docs/
├── README.md
├── architecture/
├── engineering/
├── rfcs/
├── adr/
├── api/
├── integrations/
├── modules/
├── workflows/
├── operations/
├── runbooks/
├── security/
├── releases/
├── reference/
├── guides/
├── diagrams/
├── generated/
└── archive/
```

The exact structure may evolve.

The purpose of each directory must remain clear.

---

## Root Documentation Index

The file:

```text
docs/README.md
```

should serve as the primary documentation index.

It should include:

```text
documentation map
recommended reading order
architecture entry points
engineering standards
active RFCs
operational guides
security documentation
release documentation
ownership information
```

The index should help a new contributor answer:

```text
Where do I begin?
Which documents are authoritative?
Which documents are drafts?
Which documents are implementation plans?
Which documents are historical?
```

---

## Documentation Reading Map

The documentation index should define a reading path.

Recommended sequence:

```text
1. Project overview
2. Monorepo architecture
3. Security architecture
4. Authentication architecture
5. API architecture
6. Data architecture
7. Module and workflow architecture
8. Integration architecture
9. Engineering standards
10. Local development
11. Testing
12. Release and operations
```

Specialized contributors may follow narrower paths.

Example:

```text
Discord contributor
→ Integration Architecture
→ Discord Architecture
→ Dependency Rules
→ Testing
→ Environment Variables
→ Secrets
```

---

## Document Types

Each document should belong to one primary type.

Supported document types:

```text
architecture
engineering standard
RFC
ADR
runbook
reference
guide
project README
release note
incident report
generated reference
```

A document should not mix several unrelated types without a clear reason.

---

## Architecture Documents

Architecture documents describe:

```text
system boundaries
responsibilities
data ownership
trust boundaries
runtime relationships
provider isolation
failure behavior
portability
major design constraints
```

Architecture documents should answer:

```text
What exists?
Why does it exist?
Who owns it?
What may it depend on?
What data does it own?
What are its failure modes?
How is it secured?
How can it be replaced?
```

Architecture documents should not become low-level implementation tutorials.

Implementation examples may be included to clarify boundaries.

---

## Engineering Standards

Engineering standards define required behavior.

Examples:

```text
Code Style
Testing
TypeScript Standards
Package Management
Monorepo Rules
Dependency Rules
Environment Variables
Secrets
Docker
Cloudflare
Documentation Standards
```

Engineering standards should distinguish:

```text
required
recommended
optional
prohibited
future direction
```

Use explicit terms.

Avoid vague language such as:

```text
probably
usually maybe
should kind of
try to
```

---

## RFCs

RFCs describe proposed or accepted technical decisions.

RFCs should include:

```text
problem
context
goals
non-goals
proposal
alternatives
security impact
operational impact
migration
rollback
open questions
decision
```

RFCs should not be edited to erase historical reasoning after acceptance.

Later changes should use:

```text
new RFC
superseding RFC
amendment section
```

---

## ADRs

Architecture Decision Records capture narrower decisions than full RFCs.

Examples:

```text
choice of a parser
choice of a queue adapter
choice of package layout
choice of deployment naming
```

An ADR should contain:

```text
status
context
decision
consequences
alternatives
date
owner
```

RFCs may contain multiple ADR-level decisions.

Use an RFC when the change affects broad architecture or many teams.

Use an ADR when the decision is narrow and implementation-focused.

---

## Runbooks

Runbooks describe operational actions.

A runbook should answer:

```text
When should this procedure be used?
Who may perform it?
What access is required?
What are the risks?
What are the exact steps?
How is success verified?
How is rollback performed?
What should be audited?
```

Examples:

```text
rotate Discord bot token
rollback API deployment
restore PostgreSQL backup
retry dead-letter events
disable compromised integration
revoke sessions
recover Cloudflare access
```

Runbooks must be tested.

A runbook that has never been exercised is an unverified hypothesis.

---

## Reference Documentation

Reference documentation provides exact definitions.

Examples:

```text
environment-variable reference
error-code registry
permission registry
event registry
API endpoint reference
module manifest reference
configuration schema reference
```

Reference documentation should be:

```text
precise
complete
searchable
generated where practical
low in narrative ambiguity
```

---

## Guides

Guides explain how to accomplish a task.

Examples:

```text
create a module
add a provider adapter
run the platform locally
add a workflow action
add a database migration
create a Cloudflare Worker
```

A guide should define:

```text
prerequisites
steps
expected output
validation
troubleshooting
related documents
```

---

## Project READMEs

Every significant application or library should have a local README.

A project README should include:

```text
purpose
owner
runtime
public exports
allowed dependencies
configuration
development commands
test commands
build commands
deployment behavior
related architecture
```

A README should not duplicate an entire architecture document.

It should provide the local operational and development contract for the project.

---

## Required Metadata

Every significant Markdown document should begin with a title followed by metadata.

Recommended format:

```md
# Document Title

Status: Draft
Owner: Platform Engineering
Last Updated: 2026-07-13
Security Classification: Internal Engineering
```

Additional metadata may include:

```text
Primary Runtime
Primary Audience
Review Cadence
Supersedes
Superseded By
Decision Date
Applies To
```

---

## Status Values

Approved status values:

```text
Draft
Proposed
In Review
Accepted
Active
Deprecated
Superseded
Archived
Rejected
```

### Draft

Work is incomplete and not authoritative.

### Proposed

The document is ready for review but not yet accepted.

### In Review

The document is actively under review.

### Accepted

A decision has been accepted but may not be fully implemented.

### Active

The document describes current authoritative behavior.

### Deprecated

The document remains relevant temporarily but should no longer guide new work.

### Superseded

A newer document replaces it.

### Archived

The document is retained only for history.

### Rejected

The proposal was not accepted.

---

## Authority

Documents should make authority clear.

Recommended hierarchy:

```text
accepted RFC
→ active architecture document
→ active engineering standard
→ project README
→ guide
→ code comment
```

Implementation may temporarily differ during migration.

The difference must be documented.

An older guide must not silently override an accepted RFC.

---

## Ownership

Every significant document must have an owner.

The owner is responsible for:

```text
accuracy
review
updates
deprecation
link maintenance
security classification
terminology
```

Ownership may be assigned to:

```text
individual
team
functional domain
project area
```

Examples:

```text
Platform Architecture
Data Platform
Discord Integration
Security
Developer Experience
Observability
```

---

## Review Cadence

Documents should be reviewed based on risk.

| Document Type        | Suggested Review                          |
| -------------------- | ----------------------------------------- |
| Architecture         | Every six months or major change          |
| Security             | Every three months or major threat change |
| Runbook              | Every three months and after use          |
| Engineering standard | Every six months                          |
| API reference        | Every release or generated                |
| Project README       | With relevant project changes             |
| RFC                  | At decision and implementation milestones |
| Archived material    | No regular review                         |

Review cadence should be shorter for:

```text
authentication
authorization
secrets
credential rotation
incident response
data deletion
backup and recovery
```

---

## Last Updated

`Last Updated` should reflect a meaningful content review.

Do not change the date merely because:

```text
formatting changed
whitespace changed
a link was reordered
```

A meaningful update includes:

```text
technical review
behavior change
ownership change
security change
decision change
```

---

## Security Classification

Approved classifications:

```text
Public
Internal
Internal Engineering
Confidential
Restricted
```

### Public

Safe to publish externally.

### Internal

Safe for internal non-public access.

### Internal Engineering

Contains internal technical details but no sensitive credentials.

### Confidential

Contains sensitive business, architecture, or operational information.

### Restricted

Contains highly sensitive security or incident details.

Documentation must never contain raw secrets regardless of classification.

---

## Markdown Standard

Markdown is the primary documentation format.

Documents should use standard CommonMark-compatible syntax where practical.

GitHub-flavored Markdown features may be used for:

```text
tables
task lists
fenced code blocks
alerts where supported
```

Avoid renderer-specific extensions unless the documentation platform requires them.

---

## File Naming

Markdown filenames use human-readable title case with spaces for major documents.

Examples:

```text
Monorepo Architecture.md
TypeScript Standards.md
Environment Variables.md
Documentation Standards.md
```

RFC filenames use numeric prefixes and lowercase kebab-case.

Examples:

```text
0001-project-identity-and-terminology.md
0017-observability-trace-propagation-and-alerting.md
```

ADR filenames should use:

```text
ADR-0001-short-decision-title.md
```

or another consistent numeric pattern.

---

## Directory Naming

Documentation directories use lowercase kebab-case.

Examples:

```text
docs/architecture/
docs/engineering/
docs/runbooks/
docs/generated/
```

Avoid:

```text
Docs/
EngineeringDocs/
documentation_files/
```

---

## Heading Structure

Each document must contain exactly one level-one heading.

```md
# Document Title
```

Use headings in order.

```text
# Title
## Section
### Subsection
#### Detail
```

Avoid skipping levels.

Bad:

```text
# Title
#### Detail
```

---

## Heading Names

Headings should be:

```text
descriptive
short
stable
searchable
```

Good:

```text
## Secret Rotation
## Queue Retry Policy
## Database Ownership
```

Avoid:

```text
## More Stuff
## Other Notes
## Miscellaneous
```

---

## Heading Depth

Avoid excessive heading depth.

Most documents should remain within:

```text
H1 through H4
```

If content requires H5 or H6 repeatedly, consider:

```text
splitting the document
restructuring sections
using tables
using definition lists
```

---

## Paragraph Style

Paragraphs should be short enough to scan.

Preferred:

```text
one idea per paragraph
active voice
clear subject
explicit responsibility
```

Avoid large walls of text.

Technical detail should remain complete without becoming needlessly dense.

---

## Sentence Style

Use direct language.

Good:

```text
The API validates every request body before invoking an application service.
```

Avoid:

```text
It should be noted that request bodies are generally expected to be validated before they might be passed onward.
```

---

## Modal Terms

Use modal words consistently.

| Term       | Meaning                                |
| ---------- | -------------------------------------- |
| Must       | Required                               |
| Must not   | Prohibited                             |
| Should     | Recommended unless justified otherwise |
| Should not | Discouraged                            |
| May        | Optional                               |
| Can        | Describes capability                   |
| Will       | Describes planned or certain behavior  |

Avoid using `should` when the rule is mandatory.

---

## Voice

Use active voice where practical.

Good:

```text
The Discord adapter verifies role hierarchy.
```

Less clear:

```text
Role hierarchy is verified by the Discord adapter.
```

Passive voice may be used when the actor is unimportant.

---

## Tense

Use present tense for current standards.

```text
Aerealith uses pnpm.
```

Use future tense only for planned behavior.

```text
Aerealith will add image signing before public production release.
```

Future direction should be labeled clearly.

---

## Terminology

Aerealith terminology must remain consistent.

Canonical terms include:

```text
Aerealith AI
SinLess Games
SinLess Industries
module
workflow
integration
provider
adapter
capability
approval
audit record
request ID
trace ID
community
organization
account
```

Historic terminology such as:

```text
Helix
```

may appear only when describing project history or migration.

---

## Product Naming

Use:

```text
Aerealith AI
```

on first reference in major documents.

Use:

```text
Aerealith
```

afterward.

Do not write inconsistent variations such as:

```text
AerealithAI
Aerealith.AI
Aerialith
Aerolith
```

unless referencing an external identifier that requires exact spelling.

---

## Acronyms

Spell out uncommon acronyms on first use.

Example:

```text
Software Bill of Materials (SBOM)
```

Common technical acronyms may remain abbreviated when the audience is clearly engineering-focused.

Examples:

```text
API
HTTP
JSON
SQL
CI
CD
```

---

## Inclusive Language

Use neutral and respectful terminology.

Prefer:

```text
allowlist
denylist
primary
replica
leader
follower
```

Avoid unnecessarily loaded or outdated terminology.

Provider documentation may require exact external terms.

---

## Lists

Use lists for:

```text
requirements
steps
options
examples
checklists
```

Keep list entries grammatically consistent.

Example:

```text
validate input
authorize the actor
verify approval
execute the capability
record the outcome
```

Avoid mixing sentence fragments and full sentences without reason.

---

## Ordered Lists

Use numbered lists when order matters.

Example:

```text
1. Validate configuration.
2. Connect to the database.
3. Start queue consumers.
4. Mark the service ready.
```

Use unordered lists when order does not matter.

---

## Checklists

Use task-list syntax only for actionable tracked work.

```md
- [ ] Add queue dead-letter handling.
- [ ] Add CockroachDB compatibility tests.
```

Do not use unchecked boxes merely as decorative bullets.

---

## Tables

Use tables for compact comparison.

Good table uses:

```text
configuration reference
support matrix
status comparison
ownership matrix
risk classification
```

Avoid tables for long narrative content.

Tables should remain readable in raw Markdown.

---

## Table Rules

Tables should:

```text
have a header
use concise cells
avoid huge paragraphs
avoid excessive columns
```

When a table becomes too wide, split it into sections.

---

## Code Blocks

Use fenced code blocks with a language identifier.

Good:

````md
```ts
export interface ModuleManifest {
  readonly id: string;
}
```
````
