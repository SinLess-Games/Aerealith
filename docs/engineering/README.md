# Engineering Documentation

Status: Active
Owner: Tim Pierce / SinLess Games
Last Updated: 2026-07-13
Security Classification: Internal Engineering
Primary Audience: Aerealith contributors, maintainers, reviewers, operators, and technical leadership
Documentation Root: `docs/engineering/`

---

## Purpose

This directory contains the engineering standards that govern how Aerealith AI is developed, tested, secured, packaged, documented, deployed, and maintained.

These documents translate the platform architecture into enforceable engineering rules.

They define:

```text
how code is written
how TypeScript is configured
how projects are organized
how dependencies are controlled
how packages are managed
how configuration is loaded
how secrets are handled
how local development works
how tests are designed
how containers are built
how Cloudflare is used
how documentation is maintained
```

The guiding rule is:

> Architecture defines the intended system. Engineering standards define the rules contributors must follow to keep the implementation aligned with that architecture.

---

## Table of Contents

- [Documentation Levels](#documentation-levels)
- [Recommended Reading Order](#recommended-reading-order)
- [Engineering Standards Index](#engineering-standards-index)
- [Reading Paths by Role](#reading-paths-by-role)
- [Required Reading by Change Type](#required-reading-by-change-type)
- [Authority and Conflict Resolution](#authority-and-conflict-resolution)
- [Standard Terminology](#standard-terminology)
- [Contribution Requirements](#contribution-requirements)
- [Adding an Engineering Standard](#adding-an-engineering-standard)
- [Review and Maintenance](#review-and-maintenance)
- [Validation and CI](#validation-and-ci)
- [Documentation Status](#documentation-status)
- [Related Documentation](#related-documentation)
- [Success Criteria](#success-criteria)
- [Final Standard](#final-standard)

---

## Documentation Levels

Aerealith documentation is organized into levels.

The level indicates the document’s role and authority.

| Level | Category                                | Purpose                                                                                      |
| ----: | --------------------------------------- | -------------------------------------------------------------------------------------------- |
|     0 | Project identity and accepted decisions | Defines foundational identity, terminology, and accepted architectural decisions             |
|     1 | Architecture                            | Defines system boundaries, ownership, trust, data authority, and runtime relationships       |
|     2 | Engineering standards                   | Defines implementation rules, required practices, prohibitions, and validation               |
|     3 | Project documentation                   | Defines the local contract for an application, library, integration, or tool                 |
|     4 | Guides and runbooks                     | Defines task-specific procedures and operational actions                                     |
|     5 | Generated reference                     | Defines exact schemas, registries, APIs, environment variables, and other generated material |

This directory primarily contains:

```text
Level 2 engineering standards
```

Engineering standards must remain consistent with:

```text
Level 0 accepted RFCs
Level 1 architecture documents
```

---

## Recommended Reading Order

New contributors should read the engineering standards in this order.

### Level 2.1: Development Foundations

1. [Local Development](./Local%20Development.md)
2. [Code Style](./Code%20Style.md)
3. [TypeScript Standards](./TypeScript%20Standards.md)
4. [Testing](./Testing.md)

These documents explain:

```text
how to set up the repository
how source code should be written
how TypeScript is configured
how behavior must be tested
```

### Level 2.2: Repository and Dependency Boundaries

1. [Monorepo Rules](./Monorepo%20Rules.md)
2. [Dependency Rules](./Dependency%20Rules.md)
3. [Package Management](./Package%20Management.md)

These documents explain:

```text
where code belongs
which projects may depend on one another
how external packages are owned and managed
```

### Level 2.3: Configuration and Security

1. [Environment Variables](./Environment%20Variables.md)
2. [Secrets](./Secrets.md)

These documents explain:

```text
how configuration enters the application
how sensitive values are stored, injected, rotated, and protected
```

### Level 2.4: Runtime and Deployment

1. [Docker](./Docker.md)
2. [Cloudflare](./Cloudflare.md)

These documents explain:

```text
how services are containerized
how Cloudflare is used without making the platform Cloudflare-dependent
```

### Level 2.5: Documentation

1. [Documentation Standards](./Documentation%20Standards.md)

This document explains:

```text
how all technical documentation is written, reviewed, validated, published, and maintained
```

---

## Engineering Standards Index

### [Cloudflare](./Cloudflare.md)

**Level:** 2
**Primary Area:** Edge runtime and managed infrastructure
**Applies To:** Cloudflare Workers, Wrangler, Hyperdrive, Queues, R2, KV, Durable Objects, service bindings, deployment, and observability

Defines:

```text
Cloudflare’s role in Aerealith
Worker runtime boundaries
Wrangler configuration
compatibility-date policy
binding ownership
Cloudflare secret handling
Hyperdrive and Drizzle usage
Queue semantics
R2 object storage
KV cache restrictions
Durable Object coordination
Worker testing
versioned deployment
gradual rollout
rollback
Docker and Kubernetes portability
```

Key rule:

> Cloudflare is Aerealith’s preferred managed edge platform, but core platform behavior must remain portable to Docker, Kubernetes, and self-hosted infrastructure.

---

### [Code Style](./Code%20Style.md)

**Level:** 2
**Primary Area:** Source-code readability and implementation consistency
**Applies To:** TypeScript, React, Hono, NestJS, Drizzle, scripts, tests, configuration, and documentation examples

Defines:

```text
formatting
naming
imports
exports
function structure
error handling
structured logging
comments
JSDoc
API handlers
React components
database mapping
provider adapters
security-sensitive code
test style
review expectations
```

Key rule:

> Code should make ownership, intent, side effects, failure behavior, and trust boundaries obvious to the reader.

---

### [Dependency Rules](./Dependency%20Rules.md)

**Level:** 2
**Primary Area:** Allowed architectural dependency direction
**Applies To:** Applications, libraries, providers, modules, workflows, frontend, data, AI, audit, notifications, observability, and testing

Defines:

```text
allowed project dependencies
runtime compatibility
layer direction
dependency inversion
provider isolation
database isolation
frontend isolation
module capability boundaries
workflow capability boundaries
AI credential restrictions
audit isolation
notification isolation
cycle prevention
dependency exceptions
```

Key rule:

> A dependency is valid only when it points in the correct architectural direction and crosses an intentional public boundary.

---

### [Docker](./Docker.md)

**Level:** 2
**Primary Area:** Container builds and portable deployment
**Applies To:** Dockerfiles, Docker Compose, runtime images, CI container builds, Kubernetes-compatible images, and self-hosting

Defines:

```text
multi-stage builds
Node.js 24.x images
Corepack and pnpm
frozen lockfiles
non-root execution
read-only filesystems
runtime configuration
secret injection
health checks
graceful shutdown
image labels
image tagging
scanning
SBOM generation
provenance
Compose profiles
Kubernetes compatibility
self-hosting
```

Key rule:

> Every deployable service must produce a minimal, non-root, immutable, observable, and environment-neutral container image.

---

### [Documentation Standards](./Documentation%20Standards.md)

**Level:** 2
**Primary Area:** Technical documentation quality and governance
**Applies To:** Architecture, engineering standards, RFCs, ADRs, runbooks, references, READMEs, release notes, diagrams, and generated documentation

Defines:

```text
document types
metadata
statuses
ownership
security classifications
Markdown rules
headings
links
code examples
Mermaid diagrams
runbooks
RFCs
ADRs
generated documentation
review cadence
CI validation
archiving
supersession
```

Key rule:

> Documentation is part of the engineering system and must evolve through the same reviewed version-control process as source code.

---

### [Environment Variables](./Environment%20Variables.md)

**Level:** 2
**Primary Area:** Runtime configuration
**Applies To:** Node.js, Cloudflare Workers, Docker, Kubernetes, CI, local development, frontend configuration, and self-hosting

Defines:

```text
AEREALITH_ naming
environment names
configuration categories
runtime validation
boolean parsing
numeric parsing
URL parsing
secret variables
frontend-public variables
environment files
Cloudflare bindings
Docker injection
Kubernetes ConfigMaps and Secrets
unknown-variable handling
deprecation
configuration drift
testing
```

Key rule:

> Environment variables are untrusted external input and must be parsed once into immutable typed configuration.

---

### [Local Development](./Local%20Development.md)

**Level:** 2
**Primary Area:** Contributor workstation and local runtime workflow
**Applies To:** Local setup, development profiles, Docker Compose, PostgreSQL, CockroachDB, providers, observability, and contributor onboarding

Defines:

```text
required tools
Node.js and pnpm setup
Nx workflows
local profiles
PostgreSQL setup
CockroachDB compatibility
Drizzle migrations
fake providers
Discord development
AI provider opt-in
mail sink
local observability
test databases
failure simulation
debugging
reset and cleanup
CI parity
```

Key rule:

> A contributor must be able to run the core platform locally without production credentials, paid providers, or optional integrations.

---

### [Monorepo Rules](./Monorepo%20Rules.md)

**Level:** 2
**Primary Area:** Repository structure and project ownership
**Applies To:** Nx projects, pnpm workspaces, applications, libraries, tools, test support, imports, tags, public APIs, and project generators

Defines:

```text
project categories
project naming
package naming
directory structure
Nx project tags
scope tags
runtime tags
visibility tags
project ownership
public entry points
path aliases
barrel files
project creation
project removal
target naming
task caching
affected commands
project graph health
```

Key rule:

> Every project must have one clear responsibility, one owner, one runtime, and one intentional public boundary.

---

### [Package Management](./Package%20Management.md)

**Level:** 2
**Primary Area:** External package and workspace dependency lifecycle
**Applies To:** pnpm, lockfiles, package manifests, dependency updates, registry configuration, security scanning, package publication, and container dependency installation

Defines:

```text
pnpm ownership
Corepack
workspace protocol
dependency categories
version ranges
lockfile review
Renovate
Dependabot
security overrides
patching
registry credentials
package publication
SBOMs
license review
supply-chain security
dependency incidents
```

Key rule:

> Every dependency must have a clear owner, purpose, version policy, architectural location, update path, and removal path.

---

### [Secrets](./Secrets.md)

**Level:** 2
**Primary Area:** Sensitive configuration and credential protection
**Applies To:** Application secrets, provider credentials, signing keys, encryption keys, session secrets, CI credentials, Cloudflare secrets, Docker secrets, Kubernetes Secrets, and local development

Defines:

```text
secret classification
secret ownership
storage locations
least privilege
secret injection
secret references
local secret handling
rotation
revocation
redaction
logging protection
testing
incident response
secret scanning
build-time restrictions
runtime access
```

Key rule:

> Secrets must be available only to the smallest runtime boundary that requires them and must never enter source control, logs, telemetry, browser bundles, audit records, or build artifacts.

---

### [Testing](./Testing.md)

**Level:** 2
**Primary Area:** Verification and quality assurance
**Applies To:** Unit, integration, contract, database, provider, security, end-to-end, container, Cloudflare, accessibility, and release testing

Defines:

```text
test categories
test ownership
test naming
test isolation
fixtures
fakes
provider contracts
database tests
CockroachDB compatibility
API tests
workflow tests
module tests
AI tests
Discord tests
security tests
E2E tests
coverage
CI test stages
failure simulation
determinism
```

Required coverage:

```text
80% statements
80% branches
80% functions
80% lines
```

Key rule:

> Tests must prove behavior, boundaries, failure handling, and security invariants rather than merely exercise lines of code.

---

### [TypeScript Standards](./TypeScript%20Standards.md)

**Level:** 2
**Primary Area:** TypeScript language and compiler behavior
**Applies To:** Node.js, Workers, browser code, shared libraries, React, Hono, NestJS, Drizzle, events, workflows, modules, AI, and tests

Defines:

```text
strict compiler settings
ES modules
NodeNext
bundler resolution
project references
type inference
runtime schemas
unknown input
interfaces
type aliases
discriminated unions
readonly contracts
branded identifiers
Result types
async behavior
provider type isolation
database type isolation
declaration output
compile-time tests
```

Key rule:

> TypeScript describes trusted program state, while runtime schemas determine whether external data may enter that trusted state.

---

## Reading Paths by Role

### New Contributor

Read:

1. [Local Development](./Local%20Development.md)
2. [Code Style](./Code%20Style.md)
3. [TypeScript Standards](./TypeScript%20Standards.md)
4. [Testing](./Testing.md)
5. [Monorepo Rules](./Monorepo%20Rules.md)
6. [Dependency Rules](./Dependency%20Rules.md)

---

### Frontend Contributor

Read:

1. [Code Style](./Code%20Style.md)
2. [TypeScript Standards](./TypeScript%20Standards.md)
3. [Testing](./Testing.md)
4. [Monorepo Rules](./Monorepo%20Rules.md)
5. [Dependency Rules](./Dependency%20Rules.md)
6. [Environment Variables](./Environment%20Variables.md)

Focus on:

```text
React standards
Server and Client Component boundaries
frontend-safe contracts
browser runtime restrictions
public environment variables
accessibility
frontend secret leakage
```

---

### API Contributor

Read:

1. [Code Style](./Code%20Style.md)
2. [TypeScript Standards](./TypeScript%20Standards.md)
3. [Dependency Rules](./Dependency%20Rules.md)
4. [Environment Variables](./Environment%20Variables.md)
5. [Testing](./Testing.md)
6. [Cloudflare](./Cloudflare.md)
7. [Docker](./Docker.md)

Focus on:

```text
Hono handlers
request validation
request context
authorization
database boundaries
provider-neutral application services
Worker runtime compatibility
container fallback
```

---

### Data Contributor

Read:

1. [TypeScript Standards](./TypeScript%20Standards.md)
2. [Dependency Rules](./Dependency%20Rules.md)
3. [Testing](./Testing.md)
4. [Environment Variables](./Environment%20Variables.md)
5. [Docker](./Docker.md)
6. [Cloudflare](./Cloudflare.md)

Focus on:

```text
Drizzle ownership
database row isolation
repository contracts
PostgreSQL
CockroachDB compatibility
migration testing
Hyperdrive
transaction retries
```

---

### Discord Integration Contributor

Read:

1. [Dependency Rules](./Dependency%20Rules.md)
2. [TypeScript Standards](./TypeScript%20Standards.md)
3. [Testing](./Testing.md)
4. [Environment Variables](./Environment%20Variables.md)
5. [Secrets](./Secrets.md)
6. [Docker](./Docker.md)
7. [Cloudflare](./Cloudflare.md)

Focus on:

```text
Discord.js isolation
persistent gateway runtime
provider permissions
role hierarchy
rate limits
interaction intake
bot-token ownership
provider contract tests
```

---

### Workflow or Module Contributor

Read:

1. [Monorepo Rules](./Monorepo%20Rules.md)
2. [Dependency Rules](./Dependency%20Rules.md)
3. [TypeScript Standards](./TypeScript%20Standards.md)
4. [Testing](./Testing.md)
5. [Code Style](./Code%20Style.md)

Focus on:

```text
capability interfaces
provider neutrality
approval
idempotency
serializable definitions
event contracts
module isolation
```

---

### AI Contributor

Read:

1. [Dependency Rules](./Dependency%20Rules.md)
2. [Secrets](./Secrets.md)
3. [Environment Variables](./Environment%20Variables.md)
4. [TypeScript Standards](./TypeScript%20Standards.md)
5. [Testing](./Testing.md)
6. [Cloudflare](./Cloudflare.md)

Focus on:

```text
optional AI behavior
provider adapter isolation
runtime validation of model output
tool authorization
approval
usage limits
cost controls
credential isolation
```

---

### Platform or DevOps Contributor

Read:

1. [Package Management](./Package%20Management.md)
2. [Monorepo Rules](./Monorepo%20Rules.md)
3. [Environment Variables](./Environment%20Variables.md)
4. [Secrets](./Secrets.md)
5. [Docker](./Docker.md)
6. [Cloudflare](./Cloudflare.md)
7. [Testing](./Testing.md)

Focus on:

```text
build reproducibility
runtime configuration
secret injection
container security
Cloudflare resources
deployment
rollback
SBOM
provenance
CI validation
```

---

### Documentation Contributor

Read:

1. [Documentation Standards](./Documentation%20Standards.md)
2. [Code Style](./Code%20Style.md)
3. The governing architecture document
4. The engineering standard being modified

Focus on:

```text
metadata
status
ownership
links
terminology
examples
security classification
diagrams
generated documentation
```

---

## Required Reading by Change Type

| Change                             | Required Standards                                           |
| ---------------------------------- | ------------------------------------------------------------ |
| New TypeScript source              | Code Style, TypeScript Standards                             |
| New test suite                     | Testing, TypeScript Standards                                |
| New library                        | Monorepo Rules, Dependency Rules, Package Management         |
| New application                    | Monorepo Rules, Dependency Rules, Docker                     |
| New npm dependency                 | Package Management, Dependency Rules                         |
| New environment variable           | Environment Variables, Secrets when sensitive                |
| New secret                         | Secrets, Environment Variables                               |
| New Dockerfile                     | Docker, Package Management, Secrets                          |
| New Cloudflare Worker              | Cloudflare, Dependency Rules, Environment Variables, Secrets |
| New Cloudflare binding             | Cloudflare, Secrets when sensitive                           |
| New provider adapter               | Dependency Rules, Testing, Secrets                           |
| New database repository            | TypeScript Standards, Dependency Rules, Testing              |
| New module                         | Monorepo Rules, Dependency Rules, Testing                    |
| New workflow action                | Dependency Rules, Testing, TypeScript Standards              |
| New public API endpoint            | Code Style, TypeScript Standards, Testing                    |
| New engineering document           | Documentation Standards                                      |
| Breaking configuration change      | Environment Variables, Documentation Standards               |
| Release-affecting container change | Docker, Testing, Documentation Standards                     |

---

## Authority and Conflict Resolution

Engineering standards derive authority from accepted architecture and RFC decisions.

Recommended authority order:

```text
Accepted RFC
→ Active architecture document
→ Active engineering standard
→ Project README
→ Guide or runbook
→ Code comment
```

When two engineering documents conflict:

1. Determine whether one rule is more specific.
2. Check the governing architecture document.
3. Check accepted RFCs.
4. Open an issue or RFC when the conflict affects architecture.
5. Do not silently choose whichever rule is easier.

Examples:

```text
TypeScript Standards overrides general Code Style for TypeScript-specific behavior.

Secrets overrides Environment Variables for secret-handling requirements.

Cloudflare overrides Docker only for Cloudflare-specific runtime behavior.

Dependency Rules determines whether an import is architecturally permitted even when Code Style permits its syntax.
```

---

## Standard Terminology

These terms have distinct meanings.

### Must

Required.

### Must Not

Prohibited.

### Should

Recommended unless a documented reason justifies an exception.

### Should Not

Discouraged unless a documented reason justifies it.

### May

Optional.

### Application

An independently executable or deployable project.

### Library

A reusable, independently testable project.

### Provider

An external service or system.

Examples:

```text
Discord
Resend
Cloudinary
OpenAI
Cloudflare
```

### Adapter

An implementation that maps an external provider or runtime into an Aerealith-owned interface.

### Capability

A controlled operation exposed by the platform.

### Integration

A product-facing connection to an external provider.

Cloudflare and Datadog are infrastructure unless explicitly exposed as product integrations.

### Module

A bounded product capability installed or enabled through the Aerealith module system.

### Workflow

A versioned, serializable, authorized, approval-aware sequence of platform actions.

### Secret

A value that grants access, signs data, encrypts data, or authenticates a system.

### Configuration

A validated value that controls runtime behavior but does not necessarily grant authority.

---

## Contribution Requirements

Every contributor must follow the standards relevant to the code or documentation they change.

A pull request should not introduce:

```text
an undeclared dependency
a new public API without documentation
a new environment variable without validation
a new secret without ownership and rotation
a new provider import outside its adapter
a new database type outside the data boundary
a new container running as root
a Cloudflare resource shared across protected environments
an untested security-sensitive change
```

---

## Standard Pull Request Expectations

Relevant pull requests should include:

```text
implementation
tests
documentation
configuration changes
migration guidance
rollback considerations
security impact
```

The exact requirements depend on the change.

Examples:

### New Dependency

Include:

```text
owner
purpose
version
runtime
license
security review
transitive impact
```

### New Environment Variable

Include:

```text
name
owner
type
default
classification
validation
documentation
deployment updates
tests
```

### New Secret

Include:

```text
owner
consumer
storage
injection method
rotation
redaction
incident response
tests
```

### New Deployable

Include:

```text
Nx project
package manifest
runtime tag
Dockerfile
health
shutdown
configuration schema
tests
ownership
documentation
```

### New Cloudflare Worker

Include:

```text
Wrangler configuration
compatibility date
bindings
resource isolation
secrets
Worker runtime tests
preview deployment
portable adapter
rollback
```

---

## Exceptions

An exception to an engineering standard must be:

```text
specific
narrow
documented
reviewed
owned
tested
time-bounded where temporary
```

An exception should identify:

```text
rule
affected project
reason
risk
mitigation
owner
issue
review or expiration date
```

Broad exceptions such as:

```text
disable lint for the project
skip all type checking
allow every dependency
run every container as root
```

are prohibited.

---

## Adding an Engineering Standard

A new engineering standard should be added only when it governs a meaningful cross-project concern.

Before adding a new file:

1. Confirm the rule does not belong in an existing standard.
2. Define the document owner.
3. Define its relationship to architecture and RFCs.
4. Define mandatory, recommended, and prohibited behavior.
5. Define validation and CI enforcement.
6. Define exceptions.
7. Add safe examples.
8. Add the document to this README.
9. Add it to `docs/README.md`.
10. Update contributor reading paths.

Recommended structure:

```text
Title
Metadata
Purpose
Scope
Core principles
Standards
Examples
Validation
Testing
Exceptions
Implementation sequence
Required decisions
Related documentation
Success criteria
Final standard
```

---

## Review and Maintenance

Engineering standards should be reviewed:

```text
every six months
after major architecture changes
after significant incidents
after major framework or runtime upgrades
when repeated exceptions appear
```

Security-sensitive standards should be reviewed more frequently.

These include:

```text
Secrets
Environment Variables
Docker security
Cloudflare deployment security
Dependency Rules
Testing security requirements
```

---

## Ownership Responsibilities

The document owner is responsible for:

```text
technical accuracy
alignment with architecture
review cadence
status
security classification
examples
tooling references
deprecation
supersession
```

Ownership does not mean only the owner may edit the document.

It means the owner is accountable for keeping it authoritative.

---

## Stale Documentation

A standard may be stale when:

```text
its referenced files no longer exist
its commands no longer work
its examples use unsupported versions
its architecture conflicts with implementation
its status no longer reflects reality
its required decisions have already been resolved elsewhere
```

Stale standards should be:

```text
updated
deprecated
superseded
or archived
```

They should not remain silently authoritative.

---

## Validation and CI

Engineering documentation should be validated through:

```text
Markdown linting
internal-link checks
heading validation
metadata validation
spell checking
terminology validation
Mermaid validation
code-block validation
secret scanning
generated-document drift checks
```

Recommended command:

```bash
pnpm docs:validate
```

---

## Engineering Validation

The repository should also validate that implementation follows these standards.

Recommended validation areas:

```text
formatting
lint
type checking
test coverage
Nx dependency boundaries
package ownership
environment-variable registry
secret scanning
Docker policy
Cloudflare binding policy
documentation links
```

Recommended full command:

```bash
pnpm validate
```

Deeper release validation may use:

```bash
pnpm validate:full
```

---

## Documentation Status

The current engineering documentation set includes:

| Document                | Expected Status |
| ----------------------- | --------------- |
| Cloudflare              | Draft           |
| Code Style              | Draft           |
| Dependency Rules        | Draft           |
| Docker                  | Draft           |
| Documentation Standards | Draft           |
| Environment Variables   | Draft           |
| Local Development       | Draft           |
| Monorepo Rules          | Draft           |
| Package Management      | Draft           |
| Secrets                 | Draft           |
| Testing                 | Draft           |
| TypeScript Standards    | Draft           |
| Engineering README      | Active          |

A document may become `Active` after:

```text
required decisions are resolved
tooling is implemented
existing projects are migrated
CI enforcement exists
owners approve the standard
```

A draft standard may still describe the intended direction.

It should not be misrepresented as fully enforced when enforcement is incomplete.

---

## Missing or Planned Standards

Future engineering standards may include:

```text
Git Workflow
Security Practices
Release Process
Dependency Exceptions
Package Publishing
Database Migrations
CI and Automation
Accessibility
Performance
Incident Response
```

A planned document should not be linked as authoritative until it exists.

---

## Related Documentation

### Architecture

```text
docs/architecture/
```

Architecture documents define:

```text
system boundaries
runtime ownership
data authority
provider relationships
security model
failure behavior
```

### RFCs

```text
docs/rfcs/
```

RFCs define:

```text
proposed decisions
accepted decisions
alternatives
migration
rollback
```

### Runbooks

```text
docs/runbooks/
```

Runbooks define:

```text
operational actions
incident procedures
credential rotation
deployment rollback
recovery
```

### Project Documentation

Application and library READMEs define:

```text
local purpose
public exports
configuration
commands
ownership
```

---

## Quick Navigation

### Development

- [Local Development](./Local%20Development.md)
- [Code Style](./Code%20Style.md)
- [TypeScript Standards](./TypeScript%20Standards.md)
- [Testing](./Testing.md)

### Repository Structure

- [Monorepo Rules](./Monorepo%20Rules.md)
- [Dependency Rules](./Dependency%20Rules.md)
- [Package Management](./Package%20Management.md)

### Configuration and Security

- [Environment Variables](./Environment%20Variables.md)
- [Secrets](./Secrets.md)

### Deployment

- [Docker](./Docker.md)
- [Cloudflare](./Cloudflare.md)

### Documentation

- [Documentation Standards](./Documentation%20Standards.md)

---

## New Contributor Checklist

Before making the first substantial contribution:

```text
read Local Development
install the pinned Node.js and pnpm versions
run the repository locally
read Code Style
read TypeScript Standards
read Testing
understand Monorepo Rules
understand Dependency Rules
run pnpm validate
identify the owning project and documentation
```

Before opening a pull request:

```text
format passes
lint passes
type checking passes
tests pass
coverage passes
dependency boundaries pass
documentation is updated
secrets are absent
configuration is documented
```

---

## Maintainer Checklist

Maintainers should periodically verify:

```text
links work
owners are current
statuses are accurate
commands still run
tool versions are current
examples follow current standards
required decisions are tracked
exceptions have not expired
implementation matches documentation
CI enforces mandatory rules
```

---

## Success Criteria

This engineering index is successful when:

```text
new contributors know where to begin
each engineering standard is discoverable
reading order is clear
document levels are clear
roles have targeted reading paths
required documents are linked
conflicting rules can be resolved
contributors know which standards apply to their changes
new standards follow a consistent structure
stale standards are detectable
engineering documentation evolves with implementation
```

---

## Final Standard

The Aerealith engineering documentation set should provide one clear, navigable, enforceable source of truth for how the platform is built.

The standard is:

> Every Aerealith contributor must be able to determine which engineering rules apply to a change, where the authoritative rule is documented, how the rule is validated, who owns it, and how it relates to the platform architecture. Engineering standards must remain linked, reviewed, testable, secure, and aligned with implementation. No critical development, dependency, configuration, secret, testing, container, Cloudflare, or documentation practice should depend on tribal knowledge or ephemeral conversation.
