# 0.1 — Breaking Changes

Release `0.1 — Foundation & Workspace` is the first formal Aerealith AI release.

Because this is the first structured release, there are no product-facing breaking changes.

However, this release may introduce repository, tooling, folder, and workflow expectations that can affect existing local development setup or earlier informal project files.

---

## Purpose

This document records breaking changes, migration notes, and compatibility changes introduced by release `0.1`.

Breaking changes may include:

- folder path changes
- package manager changes
- Node version requirements
- workspace structure changes
- script changes
- tooling changes
- documentation path changes
- configuration changes

Release `0.1` is mostly foundational, so breaking changes are expected to be limited.

---

# Breaking Change Summary

| Area                | Breaking? | Notes                                                              |
| ------------------- | --------: | ------------------------------------------------------------------ |
| Product Features    |        No | No user-facing product features exist yet.                         |
| Public API          |        No | No public API contract exists yet.                                 |
| Database            |        No | No production database schema exists yet.                          |
| Authentication      |        No | Auth is not implemented in this release.                           |
| Discord Bot         |        No | Discord bot features are not implemented in this release.          |
| Documentation Paths |  Possible | Folder casing should normalize to `docs/releases/`.                |
| Package Manager     |  Possible | `pnpm` becomes the required package manager.                       |
| Node Version        |  Possible | Node `24.x` becomes the expected runtime.                          |
| Workspace Structure |  Possible | Repo should follow `apps/`, `libs/`, `docs/`.                      |
| Scripts             |  Possible | Standard scripts are introduced.                                   |
| Tooling             |  Possible | Nx, ESLint, Prettier, Commitlint, Vitest standards are introduced. |

---

# Product Breaking Changes

There are no product-facing breaking changes in release `0.1`.

Release `0.1` does not include:

```text
Authentication
Dashboard product features
Discord moderation
Tickets
AI assistant behavior
Workflow automation
Billing
Marketplace
Mobile app
Desktop app
Public API
```

Because these systems do not exist yet, there are no user-facing migrations.

---

# API Breaking Changes

There are no API breaking changes in release `0.1`.

No stable public API is introduced in this release.

Future API versioning will be defined in later releases.

Expected future API direction:

```text
/api/V1/...
```

But release `0.1` does not lock a production API contract.

---

# Database Breaking Changes

There are no database breaking changes in release `0.1`.

No production database schema is finalized in this release.

Database schema, entities, migrations, and data foundations belong to:

```text
0.2 — Core Domain & Data Platform
```

---

# Documentation Path Changes

## BC-0.1-001 — Normalize Release Docs Folder Casing

### Status

```text
Potential Breaking Change
```

### Change

Release documentation should use lowercase folder paths.

Preferred:

```text
docs/releases/
```

Avoid:

```text
docs/Releases/
```

### Reason

Some operating systems are case-sensitive.

Mixing folder casing can cause:

- broken links
- duplicate folders
- Git confusion
- CI path issues
- inconsistent documentation references

### Migration

If `docs/Releases/` exists, move its contents to:

```text
docs/releases/
```

Update links from:

```text
docs/Releases/0.1/README.md
```

to:

```text
docs/releases/0.1/README.md
```

### Required Check

Before release `0.1` is complete:

```text
Only docs/releases/ should exist.
No duplicate docs/Releases/ folder should remain.
All relative links should use docs/releases/ casing.
```

---

# Package Manager Changes

## BC-0.1-002 — pnpm Becomes Required Package Manager

### Status

```text
Breaking Change for existing npm/yarn workflows
```

### Change

Aerealith standardizes on:

```text
pnpm
```

### Reason

pnpm provides:

- strict dependency behavior
- faster installs
- workspace linking
- cleaner monorepo dependency management
- reproducible lockfile behavior

### Migration

Use:

```bash
pnpm install
```

Do not use:

```bash
npm install
yarn install
```

### Lockfile Rule

The committed lockfile should be:

```text
pnpm-lock.yaml
```

Avoid committing:

```text
package-lock.json
yarn.lock
```

### Required Check

```text
pnpm install works.
pnpm-lock.yaml exists.
No npm/yarn lockfile is committed.
```

---

# Runtime Changes

## BC-0.1-003 — Node 24.x Becomes Expected Runtime

### Status

```text
Breaking Change for older local Node versions
```

### Change

Aerealith standardizes around:

```text
Node 24.x
```

### Reason

A consistent Node version prevents mismatch between:

- local development
- CI
- scripts
- builds
- test runs
- future deployment environments

### Migration

Install or activate Node `24.x`.

Possible methods:

```bash
nvm install 24
nvm use 24
```

or, if using a version manager that supports `.node-version`:

```bash
node --version
```

Confirm the version reports Node `24.x`.

### Required Check

```text
Node 24.x expectation is documented.
Local development uses Node 24.x.
Future CI uses Node 24.x.
```

---

# Workspace Structure Changes

## BC-0.1-004 — Standard Workspace Folders Introduced

### Status

```text
Potential Breaking Change for existing informal folders
```

### Change

Release `0.1` introduces the standard repo structure:

```text
apps/
libs/
docs/
```

Recommended structure:

```text
apps/
├── frontend/
└── api/

libs/
├── api/
├── content/
├── contracts/
├── core/
├── db/
├── flags/
├── observability/
└── ui/

docs/
├── vision/
├── product/
├── releases/
├── architecture/
├── engineering/
├── services/
├── modules/
├── integrations/
├── api/
├── operations/
└── rfcs/
```

### Reason

A clear structure prevents the repo from becoming messy as the platform grows.

### Migration

Move existing files into the appropriate folder.

Examples:

```text
frontend code -> apps/frontend/
API/service entrypoints -> apps/api/
shared utilities -> libs/core/
shared UI components -> libs/ui/
release docs -> docs/releases/
product docs -> docs/product/
```

### Required Check

```text
Apps location is clear.
Libraries location is clear.
Docs location is clear.
Future code has obvious homes.
```

---

# Library Dependency Changes

## BC-0.1-005 — Initial Library Dependency Rule Introduced

### Status

```text
Potential Breaking Change for existing shared code
```

### Change

The default library dependency rule is:

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

### Reason

This prevents dependency spaghetti early.

### Migration

If shared code depends across libraries, review whether:

```text
The dependency should move to libs/core.
The dependency should become a contract.
The dependency should be inverted.
The dependency should be documented as an exception.
```

### Required Check

```text
Library dependency rule is documented.
Cross-library exceptions are documented.
No circular dependency patterns are introduced.
```

---

# Script Changes

## BC-0.1-006 — Standard Root Scripts Introduced

### Status

```text
Potential Breaking Change for existing local workflows
```

### Change

Release `0.1` introduces standard root scripts:

```bash
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
```

Recommended additional scripts:

```bash
pnpm format:check
pnpm lint:fix
pnpm clean
pnpm graph
pnpm affected
pnpm dev
```

### Reason

Developers should not have to guess how to work with the repo.

### Migration

Use the root scripts instead of ad-hoc commands.

Old informal commands should be replaced or documented.

### Required Check

```text
Required scripts exist.
Scripts work or known limitations are documented.
CI can use the same commands.
```

---

# Testing and Coverage Changes

## BC-0.1-007 — 80% Coverage Minimum Introduced

### Status

```text
Breaking Change for untested runtime logic
```

### Change

Release `0.1` establishes a minimum test coverage threshold:

```text
80%
```

Required thresholds:

| Coverage Type | Minimum |
| ------------- | ------: |
| Statements    |     80% |
| Branches      |     80% |
| Functions     |     80% |
| Lines         |     80% |

### Reason

Aerealith should build quality gates early.

Testing should not be bolted on after the platform becomes large.

### Migration

Add tests for real runtime logic.

Run:

```bash
pnpm test:coverage
```

Do not exclude real code just to pass coverage.

### Acceptable Exclusions

```text
Generated files
Build output
Declaration files
Config files where appropriate
Barrel-only index files if justified
Test setup files
```

### Required Check

```text
pnpm test:coverage passes.
Coverage is at least 80%.
Coverage thresholds are configured.
Coverage report is generated.
```

---

# Tooling Changes

## BC-0.1-008 — Workspace Tooling Standards Introduced

### Status

```text
Potential Breaking Change for existing local setup
```

### Change

Release `0.1` introduces these expected tools:

```text
Nx
pnpm
TypeScript
ESLint
Prettier
Commitlint
Vitest
```

### Reason

These tools define the development foundation.

### Migration

Install dependencies with pnpm and use root scripts.

```bash
pnpm install
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
```

### Required Check

```text
Tooling is installed.
Tooling config exists.
Required commands pass or limitations are documented.
```

---

# Environment and Secret Handling Changes

## BC-0.1-009 — Secret Handling Expectations Introduced

### Status

```text
Breaking Change for unsafe local config practices
```

### Change

Secrets must not be committed.

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

### Reason

Secret safety must be part of the foundation.

### Migration

Move secrets into approved local or provider secret storage.

Use:

```text
.env
```

for local secrets where appropriate, but ensure it is ignored.

Provide safe examples through:

```text
.env.example
```

### Required Check

```text
.env is ignored where appropriate.
.env.example exists or is planned.
No committed files contain secrets.
Secret handling expectations are documented.
```

---

# Cloudflare Configuration Notes

## BC-0.1-010 — Cloudflare Config May Become Structured

### Status

```text
Potential Breaking Change if informal Cloudflare config already existed
```

### Change

If Cloudflare Worker configuration exists, it should be valid, documented, and free of secrets.

Possible config file:

```text
wrangler.toml
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

### Reason

Aerealith is Cloudflare-first early, but should remain Docker-aware and provider-replaceable later.

### Migration

Validate Cloudflare config.

Document bindings.

Keep secrets out of committed config.

### Required Check

```text
Wrangler config parses if present.
Worker entrypoint exists if configured.
Bindings are documented.
No secrets are committed.
```

---

# Docker and Self-Hosting Notes

## BC-0.1-011 — Docker Expectations Introduced

### Status

```text
Not a breaking change
```

### Change

Release `0.1` establishes this expectation:

```text
Every deployable app/service should eventually have a Dockerfile.
```

### Reason

Aerealith is cloud-first but should not block future self-hosting.

### Impact

Full Docker support is not required in `0.1`.

This release only documents the expectation.

### Future Scope

Full self-hosting belongs to later releases.

Expected future work:

```text
Dockerfiles
Docker Compose
Provider replacement docs
Self-hosted setup guide
Backup/restore
Local AI provider path
```

---

# Migration Checklist

Use this checklist if upgrading from informal pre-`0.1` project structure.

```text
Move release docs to docs/releases/.
Remove duplicate docs/Releases/ folder if it exists.
Update relative links to lowercase docs/releases paths.
Use pnpm instead of npm/yarn.
Commit pnpm-lock.yaml.
Remove package-lock.json or yarn.lock if present.
Use Node 24.x.
Confirm nx.json exists.
Confirm tsconfig.base.json exists.
Confirm ESLint config exists.
Confirm Prettier config exists.
Confirm Vitest config or test command exists.
Confirm required root scripts exist.
Confirm test:coverage exists.
Confirm 80% coverage threshold is configured.
Confirm apps/, libs/, and docs/ are clear.
Confirm secrets are not committed.
Confirm .env is ignored where appropriate.
Document any intentional deviations.
```

---

# Compatibility Expectations

Release `0.1` should remain compatible with:

```text
Linux development environments
GitHub repository workflows
Node 24.x
pnpm
Nx
TypeScript
Cloudflare Worker direction
future CI
future Docker builds
```

Avoid assumptions that only work on one local machine.

---

# Known Breaking Changes

Known breaking changes for release `0.1`:

```text
pnpm is the required package manager.
Node 24.x is the expected runtime.
docs/releases/ is the preferred release docs path.
Standard root scripts are introduced.
80% coverage minimum is introduced.
apps/, libs/, and docs/ become the expected repo structure.
```

---

# No Product Migration Required

No user/product migration is required.

There are no existing production users, stable APIs, billing records, Discord bot installations, or product data that need migration in release `0.1`.

---

# Future Breaking Change Policy

Future releases should document breaking changes clearly.

Every breaking change should include:

```text
ID
Status
Change
Reason
Impact
Migration steps
Required checks
```

Example:

```text
BC-0.2-001 — Rename database entity folder
BC-0.3-001 — Change auth session format
BC-0.7-001 — Rename Discord guild config key
```

Breaking changes should be avoided when possible, but documented when necessary.

---

# Final Breaking Change Statement

Release `0.1` introduces no user-facing product breaking changes.

It does introduce foundational expectations for the repository:

```text
Use pnpm.
Use Node 24.x.
Use docs/releases/.
Use standard root scripts.
Use 80% coverage minimum.
Use clear apps/libs/docs structure.
Keep secrets out of the repo.
```

The standard is:

> Release `0.1` may break informal local habits, but it should not break users — because its purpose is to create the clean foundation Aerealith needs before real product releases begin.
