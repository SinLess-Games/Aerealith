# Engineering

The `docs/engineering/` folder defines how Aerealith AI is built, maintained, reviewed, tested, and improved.

Engineering docs are the practical rules for working inside the Aerealith codebase.

They should help developers answer:

```text
How do I work on this repo?
How should code be written?
How should libraries be structured?
How should tests be written?
How do we handle secrets?
How do we review changes?
How do we keep the project simple?
```

---

## Purpose

Aerealith AI is expected to become a large modular platform with:

- a web dashboard
- API/service layers
- Discord platform features
- AI assistant capabilities
- workflow automation
- integrations
- modules
- developer APIs
- observability
- future marketplace support
- future self-hosting support

That means engineering standards need to be clear early.

This folder exists to keep the codebase:

- predictable
- maintainable
- testable
- documented
- secure
- simple
- scalable without overengineering

---

## Engineering Philosophy

Aerealith engineering should follow one main rule:

> Build the simplest thing that can safely grow.

The codebase should avoid both extremes:

```text
Too messy to scale.
Too abstract to ship.
```

Good engineering for Aerealith means:

- clear folders
- clear names
- clear boundaries
- clear types
- clear tests
- clear docs
- clear ownership
- boring foundations
- intentional complexity only when needed

---

## Core Engineering Principles

## Keep It Simple

Prefer simple code over clever code.

```text
Readable beats magical.
Explicit beats hidden.
Boring beats fragile.
```

If a feature needs heavy abstraction before it has real users, it is probably too early.

---

## Strong Types First

Aerealith should use TypeScript seriously.

Types should make the system easier to understand, safer to change, and harder to misuse.

Prefer:

```text
typed inputs
typed outputs
typed configs
typed errors
typed contracts
typed entities
typed events
```

Avoid:

```text
any
unknown without narrowing
untyped config
stringly typed logic
silent type escapes
```

---

## Minimal Dependencies

Do not add dependencies casually.

Before adding a dependency, ask:

```text
Can we do this simply ourselves?
Is this dependency actively maintained?
Does it work in our runtime?
Does it increase bundle size?
Does it create security risk?
Does it lock us into a bad pattern?
Will we still want this in a year?
```

Dependencies are allowed when they clearly reduce risk or complexity.

They should not be used to avoid writing simple project-specific code.

---

## Clear Boundaries

Apps, services, libraries, modules, integrations, and providers should have clear boundaries.

Shared logic should live in the right place.

Avoid dumping everything into one giant utility folder.

Avoid spreading one feature across ten unrelated places.

---

## Docs Are Part of the Product

Documentation is not cleanup work.

If a decision affects how the project is built, deployed, tested, or maintained, it should be documented.

Docs should be updated when behavior changes.

---

## Trust Is an Engineering Requirement

Aerealith is not just a feature platform.

It is a trust platform.

Engineering decisions should support:

- auditability
- permissions
- user control
- safe defaults
- explainable failures
- secret safety
- privacy boundaries
- recoverability

---

## Technology Standards

## Package Manager

Aerealith uses:

```text
pnpm
```

Required install command:

```bash
pnpm install
```

Do not use:

```bash
npm install
yarn install
```

The committed lockfile should be:

```text
pnpm-lock.yaml
```

---

## Monorepo Tooling

Aerealith uses:

```text
Nx
```

Nx is responsible for:

- workspace structure
- project discovery
- task orchestration
- dependency graph visibility
- affected commands later
- CI optimization later

---

## Runtime

Aerealith standardizes around:

```text
Node 24.x
```

The expected Node version should be documented through one or more of:

```text
.node-version
.nvmrc
package.json engines
CI config
Docker images later
```

---

## Language

Aerealith primarily uses:

```text
TypeScript
```

TypeScript should be used with strict expectations.

---

## Testing

Aerealith uses:

```text
Vitest
```

Minimum coverage threshold:

```text
80%
```

Coverage should apply to:

```text
Statements
Branches
Functions
Lines
```

---

## Formatting

Aerealith uses:

```text
Prettier
```

Formatting should be automated.

Do not waste review time on formatting opinions.

---

## Linting

Aerealith uses:

```text
ESLint
```

Linting should catch avoidable mistakes, unsafe patterns, and boundary violations where practical.

---

## Commit Style

Aerealith should use:

```text
Conventional Commits
```

Examples:

```text
feat(core): add base error class
fix(frontend): correct dashboard route
docs(releases): add 0.1 testing checklist
chore(workspace): configure nx
test(core): add error utility tests
```

---

## Repository Structure

Recommended root structure:

```text
apps/
libs/
docs/
```

---

## Apps

Apps are deployable or user-facing entrypoints.

Recommended apps:

```text
apps/
├── frontend/
└── api/
```

| App             | Purpose                                                  |
| --------------- | -------------------------------------------------------- |
| `apps/frontend` | Main Aerealith web/dashboard frontend.                   |
| `apps/api`      | API or service entrypoint foundation if used separately. |

The exact deployment model may evolve as Cloudflare Worker architecture becomes clearer.

---

## Libraries

Libraries contain shared code.

Recommended libraries:

```text
libs/
├── api/
├── content/
├── contracts/
├── core/
├── db/
├── flags/
├── observability/
└── ui/
```

| Library              | Purpose                                                                       |
| -------------------- | ----------------------------------------------------------------------------- |
| `libs/core`          | Shared constants, errors, primitive types, utilities, and foundational logic. |
| `libs/contracts`     | API contracts, DTOs, schemas, and shared interface boundaries.                |
| `libs/api`           | API helpers, middleware foundations, routing helpers, service utilities.      |
| `libs/db`            | Database entities, schemas, migrations, and data access foundations.          |
| `libs/ui`            | Shared frontend UI components and design system foundations.                  |
| `libs/content`       | Shared copy, structured content, and content helpers.                         |
| `libs/flags`         | Feature flag helpers and configuration boundaries.                            |
| `libs/observability` | Logging, metrics, tracing, diagnostics, and monitoring helpers.               |

---

## Library Dependency Rule

The default dependency rule is:

```text
libs/* may depend on libs/core only.
```

Allowed by default:

```text
libs/api -> libs/core
libs/db -> libs/core
libs/ui -> libs/core
libs/contracts -> libs/core
libs/content -> libs/core
libs/flags -> libs/core
libs/observability -> libs/core
```

Avoid by default:

```text
libs/api -> libs/db
libs/ui -> libs/api
libs/contracts -> libs/db
libs/content -> libs/ui
libs/observability -> libs/api
```

---

## Why This Rule Exists

This rule prevents dependency spaghetti.

Aerealith is expected to grow into a large platform.

If libraries depend on each other randomly, the codebase becomes hard to test, build, refactor, package, and self-host later.

---

## Dependency Exceptions

Exceptions may be allowed, but they must be intentional.

Before allowing a cross-library dependency, ask:

```text
Why is this dependency needed?
Can the shared piece move to libs/core?
Should the boundary live in libs/contracts?
Can the dependency be inverted?
Will this create circular dependency risk?
Will this make testing harder?
Will this make deployment harder?
```

Exceptions should be documented in architecture or engineering docs.

---

## Required Commands

The repo should support these commands from the root:

```bash
pnpm install
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
```

Recommended additional commands:

```bash
pnpm format:check
pnpm lint:fix
pnpm clean
pnpm graph
pnpm affected
pnpm dev
```

---

## Standard Local Workflow

Recommended local workflow:

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm test:coverage
pnpm build
```

Before committing, run:

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
```

Before release review, run:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
```

---

## Testing Standard

Testing should verify real behavior.

Do not write fake tests just to inflate coverage.

## Minimum Coverage

```text
80%
```

Required coverage types:

| Coverage Type | Minimum |
| ------------- | ------: |
| Statements    |     80% |
| Branches      |     80% |
| Functions     |     80% |
| Lines         |     80% |

---

## Test File Naming

Recommended patterns:

```text
*.test.ts
*.spec.ts
```

Examples:

```text
base-error.test.ts
string-utils.test.ts
env.test.ts
```

Tests should usually live near the code they verify unless a package has a better reason to separate them.

---

## What Should Be Tested

Test:

```text
core utilities
errors
config helpers
environment validation
contracts
schemas
pure functions
module logic
workflow logic
permission logic
audit logic
integration adapters
```

Avoid testing implementation details that make refactors painful.

Prefer behavior-based tests.

---

## Code Style

## Prefer Explicit Code

Good:

```ts
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
```

Avoid:

```ts
export const normalizeEmail = (x: any) => x?.trim?.().toLowerCase?.()
```

---

## Prefer Small Functions

Functions should generally do one clear thing.

If a function needs a paragraph to explain what it does, consider splitting it.

---

## Prefer Named Types

Good:

```ts
export interface CreateWaitlistEntryInput {
  email: string
}
```

Avoid relying on anonymous object shapes everywhere.

---

## Avoid `any`

Avoid:

```ts
const value: any = input
```

Prefer narrowing:

```ts
if (typeof input !== 'string') {
  throw new Error('Expected string input.')
}
```

---

## Use TSDoc Where It Helps

Use TSDoc for exported APIs, shared utilities, non-obvious behavior, and public contracts.

Example:

```ts
/**
 * Normalizes an email address before storage or comparison.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
```

Do not document obvious private implementation noise.

---

## Error Handling

Errors should be typed, consistent, and understandable.

Aerealith should prefer project-specific errors over random thrown strings.

Avoid:

```ts
throw 'bad request'
```

Prefer:

```ts
throw new Error('Bad request.')
```

Eventually prefer:

```ts
throw new AerealithError({
  code: CommonErrorCode.BAD_REQUEST,
  message: 'Bad request.',
})
```

Error handling should support:

- readable messages
- stable error codes
- debugging context
- safe public responses
- auditability where needed

---

## Environment and Secrets

Secrets must never be committed.

Never commit:

```text
API keys
OAuth secrets
provider tokens
webhook secrets
database passwords
private keys
session secrets
production credentials
```

Use local environment files for local development where appropriate.

Recommended:

```text
.env
.env.local
.env.example
```

`.env` and local secret files should be ignored.

`.env.example` should contain safe placeholders only.

---

## Configuration

Configuration should be explicit.

Avoid hidden magic.

Prefer:

```text
documented environment variables
typed config loading
safe defaults
clear errors when required config is missing
```

Configuration should explain:

```text
what the variable does
whether it is required
where it is used
whether it is secret
what safe local value can be used
```

---

## Cloudflare Direction

Aerealith is Cloudflare-first early.

Possible Cloudflare resources include:

```text
Workers
KV
R2
Queues
Analytics Engine
Observability
Preview URLs
```

Known binding names may include:

```text
ASSETS
AEREALITH_KV
AEREALITH_AI
FLAGSHIP_FLAGS
AEREALITH_ANALYTICS
EVENTBUS
```

Cloudflare config should not contain secrets.

Aerealith should remain Docker-aware and provider-replaceable later.

---

## Docker Direction

Full self-hosting is not early MVP scope.

However:

```text
Every deployable app/service should eventually have a Dockerfile.
```

Docker expectations support future:

- local production-like testing
- self-hosting
- provider replacement
- backup/restore planning
- cloud independence

Do not block early development on full Docker Compose unless it is immediately useful.

---

## CI Expectations

The expected CI flow is:

```bash
pnpm install
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test:coverage
pnpm build
```

CI should use:

```text
Node 24.x
pnpm
80% coverage minimum
```

CI should fail on:

```text
install failure
lint errors
format errors
type errors
test failures
coverage below 80%
build failure
committed secrets if secret scanning exists
```

---

## Documentation Standards

Docs should be written in Markdown.

Folder names should be lowercase.

Preferred:

```text
docs/releases/
docs/engineering/
docs/architecture/
```

Avoid:

```text
docs/releases/
docs/Engineering/
docs/Architecture/
```

Readable Markdown filenames are acceptable for planning docs:

```text
MVP Scope.md
Architecture Changes.md
Breaking Changes.md
```

Code files should use predictable lowercase naming patterns:

```text
base.error.ts
auth-error.enum.ts
domain.constants.ts
```

---

## Recommended Engineering Docs

This folder should eventually include:

```text
docs/engineering/README.md
docs/engineering/Local Development.md
docs/engineering/Code Style.md
docs/engineering/Testing.md
docs/engineering/TypeScript Standards.md
docs/engineering/Package Management.md
docs/engineering/Monorepo Rules.md
docs/engineering/Dependency Rules.md
docs/engineering/Environment Variables.md
docs/engineering/Secrets.md
docs/engineering/Git Workflow.md
docs/engineering/CI.md
docs/engineering/Docker.md
docs/engineering/Cloudflare.md
docs/engineering/Documentation Standards.md
```

---

## Recommended Reading Order

Start with:

1. [Local Development](./Local%20Development.md)
2. [Package Management](./Package%20Management.md)
3. [Monorepo Rules](./Monorepo%20Rules.md)
4. [TypeScript Standards](./TypeScript%20Standards.md)
5. [Code Style](./Code%20Style.md)
6. [Testing](./Testing.md)
7. [Environment Variables](./Environment%20Variables.md)
8. [Secrets](./Secrets.md)
9. [Git Workflow](./Git%20Workflow.md)
10. [CI](./CI.md)
11. [Docker](./Docker.md)
12. [Cloudflare](./Cloudflare.md)
13. [Documentation Standards](./Documentation%20Standards.md)

Some of these files may be created in later releases.

---

## Engineering Review Questions

Before merging a change, ask:

```text
Does this keep the code simple?
Are types clear?
Are dependencies justified?
Are boundaries respected?
Are tests included?
Does coverage stay at or above 80%?
Are errors understandable?
Are secrets protected?
Are docs updated?
Does this belong in this release?
Can this fail safely?
Can future developers understand this quickly?
```

---

## Relationship to Release Docs

Engineering docs define how work should be done.

Release docs define when work should be done.

Relevant release docs:

```text
docs/releases/README.md
docs/releases/0.1/README.md
docs/releases/0.1/Release.md
docs/releases/0.1/Testing.md
docs/releases/0.1/Checklist.md
```

Release `0.1` establishes the engineering foundation.

Later releases should expand these docs as real systems are built.

---

## Relationship to Architecture Docs

Architecture docs explain the system design.

Engineering docs explain how to work inside that system.

Architecture answers:

```text
What are the parts?
How do they connect?
Why are boundaries shaped this way?
```

Engineering answers:

```text
How do we code it?
How do we test it?
How do we review it?
How do we keep it maintainable?
```

---

## Final Engineering Standard

Aerealith engineering should be boring where it matters and flexible where it helps.

The codebase should be simple enough to understand, typed enough to trust, tested enough to change, documented enough to maintain, and structured enough to grow.

The standard is:

> A developer can clone Aerealith, install it, understand the workspace, make a safe change, test it, document it, and ship it without guessing how the project works.
