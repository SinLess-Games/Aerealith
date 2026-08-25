# 0.1 — Testing

Release `0.1 — Foundation & Workspace` must prove that the Aerealith workspace can be installed, checked, formatted, typechecked, tested, and built reliably.

This release does not require deep product test coverage because it does not ship major product features.

However, it must establish the testing standard that future releases will follow.

---

## Purpose

This document defines how release `0.1` should be tested.

It explains:

- what commands must run
- what each command proves
- what coverage threshold is required
- what counts as a passing release
- what can be deferred
- how testing should work in local development and CI

Release `0.1` testing is focused on workspace readiness.

---

## Testing Goal

The testing goal for release `0.1` is:

> A developer can clone the repo, install dependencies, run core checks, run tests, generate coverage, and verify that the workspace is ready for future development.

This release should prove:

```text
Install works.
Linting works.
Formatting works.
Typechecking works.
Tests run.
Coverage reports work.
Build works.
Docs exist.
Release scope is testable.
```

---

## Required Test Commands

Release `0.1` should support these commands from the repository root:

```bash
pnpm install
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
```

Optional but recommended:

```bash
pnpm format:check
pnpm lint:fix
pnpm clean
pnpm graph
```

---

## Coverage Requirement

Release `0.1` establishes the minimum coverage standard for Aerealith.

## Minimum Coverage

The minimum test coverage threshold is:

```text
80%
```

Coverage should be measured across:

```text
Statements
Branches
Functions
Lines
```

Recommended Vitest threshold:

```text
statements: 80
branches: 80
functions: 80
lines: 80
```

---

## Coverage Standard

Coverage should be treated as a release gate.

Release `0.1` should not be marked complete unless:

```text
pnpm test:coverage passes.
Coverage is at least 80%.
Coverage thresholds are configured.
Coverage output is visible locally.
Coverage can run in CI.
```

If a package has no meaningful runtime code yet, it may be excluded intentionally, but the exclusion must be documented.

---

## Coverage Exclusions

Coverage should avoid counting files that do not represent testable product or library logic.

Acceptable exclusions may include:

```text
Generated files
Build output
dist/
coverage/
node_modules/
Type-only files where appropriate
Config files where appropriate
Declaration files
Test setup files
Barrel-only index files if justified
```

Do not use exclusions to hide untested real logic.

---

## Suggested Vitest Coverage Configuration

Example coverage threshold:

```ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  thresholds: {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80,
  },
  exclude: [
    'coverage/**',
    'dist/**',
    'node_modules/**',
    '**/*.d.ts',
    '**/*.config.*',
    '**/index.ts',
  ],
}
```

If `index.ts` files contain real logic, they should not be excluded.

---

## Test Areas

Release `0.1` should test the foundation.

| Area          | Required | Purpose                                        |
| ------------- | -------: | ---------------------------------------------- |
| Install       |      Yes | Verifies dependencies and lockfile.            |
| Lint          |      Yes | Verifies code quality rules.                   |
| Format        |      Yes | Verifies formatting consistency.               |
| Typecheck     |      Yes | Verifies TypeScript configuration.             |
| Unit Tests    |      Yes | Verifies test runner and basic logic.          |
| Coverage      |      Yes | Verifies coverage reporting and 80% threshold. |
| Build         |      Yes | Verifies workspace build path.                 |
| Docs Review   |      Yes | Verifies required docs exist.                  |
| CI Readiness  |      Yes | Verifies commands are CI-friendly.             |
| Product Flows |       No | Product features are later releases.           |

---

## Local Testing Flow

A developer should run the following commands before marking release `0.1` complete:

```bash
pnpm install
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
```

If `format` mutates files, commit the resulting formatting changes.

If `format:check` exists, use it for CI:

```bash
pnpm format:check
```

---

## CI Testing Flow

The CI flow should eventually run:

```bash
pnpm install
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test:coverage
pnpm build
```

If `format:check` is not available yet, CI may temporarily skip it, but release `0.1` should document that limitation.

---

## Command Verification

---

## Install Verification

### Command

```bash
pnpm install
```

### Proves

```text
Dependencies can be installed.
pnpm workspace is valid.
Lockfile is usable.
No unexpected package manager is required.
```

### Pass Criteria

```text
Command completes successfully.
pnpm-lock.yaml is up to date.
No npm/yarn lockfile is generated.
Workspace packages resolve correctly.
```

---

## Lint Verification

### Command

```bash
pnpm lint
```

### Proves

```text
ESLint is configured.
Workspace lint rules work.
Code quality checks can run.
```

### Pass Criteria

```text
Command completes successfully.
No lint errors remain.
Known limitations are documented.
```

---

## Format Verification

### Command

```bash
pnpm format
```

Optional CI command:

```bash
pnpm format:check
```

### Proves

```text
Prettier is configured.
Formatting is consistent.
Docs, config, and code can be formatted predictably.
```

### Pass Criteria

```text
Formatting completes successfully.
No unexpected files are damaged.
Formatting changes are committed.
```

If `format:check` exists:

```text
format:check passes without modifying files.
```

---

## Typecheck Verification

### Command

```bash
pnpm typecheck
```

### Proves

```text
TypeScript is configured.
Workspace projects can be typechecked.
Type errors are visible.
```

### Pass Criteria

```text
Command completes successfully.
No TypeScript errors remain.
Known placeholder limitations are documented.
```

---

## Unit Test Verification

### Command

```bash
pnpm test
```

### Proves

```text
Vitest is configured.
Tests can run from the repo root.
Future libraries can add tests cleanly.
```

### Pass Criteria

```text
Command completes successfully.
All tests pass.
Test output is understandable.
```

Release `0.1` may have limited tests, but the test foundation must work.

---

## Coverage Verification

### Command

```bash
pnpm test:coverage
```

### Proves

```text
Coverage reporting works.
Coverage thresholds are enforced.
The repo has a minimum quality gate.
```

### Pass Criteria

```text
Command completes successfully.
Statements coverage is at least 80%.
Branches coverage is at least 80%.
Functions coverage is at least 80%.
Lines coverage is at least 80%.
Coverage report is generated.
```

Coverage report output should include at least one readable format:

```text
text
html
json
```

Recommended:

```text
coverage/
```

The `coverage/` directory should not be committed.

---

## Build Verification

### Command

```bash
pnpm build
```

### Proves

```text
Workspace build command exists.
Apps/libs can be built or build limitations are documented.
Future CI can verify build health.
```

### Pass Criteria

```text
Command completes successfully.
Build output is generated where expected.
Placeholder limitations are documented.
```

---

## Documentation Verification

Release `0.1` includes docs as part of the release.

## Required Documentation Paths

```text
docs/README.md
docs/vision/
docs/product/
docs/releases/
docs/releases/README.md
docs/releases/0.1/
docs/releases/0.1/README.md
docs/releases/0.1/Release.md
docs/releases/0.1/Features.md
docs/releases/0.1/Architecture Changes.md
docs/releases/0.1/Tasks.md
docs/releases/0.1/Testing.md
docs/releases/0.1/Checklist.md
docs/releases/0.1/Breaking Changes.md
```

## Documentation Pass Criteria

```text
Required docs exist.
Release docs link to each other.
Docs use consistent folder casing.
Markdown is readable.
No obvious broken relative links.
No duplicate docs/releases and docs/releases folders.
```

Preferred path casing:

```text
docs/releases/
```

Avoid:

```text
docs/releases/
```

---

## Workspace Structure Verification

Expected structure:

```text
apps/
libs/
docs/
```

Expected or planned apps:

```text
apps/frontend/
apps/api/
```

Expected or planned libraries:

```text
libs/core/
libs/contracts/
libs/api/
libs/db/
libs/ui/
libs/content/
libs/flags/
libs/observability/
```

Pass criteria:

```text
Apps location is clear.
Libraries location is clear.
Docs location is clear.
Future code has obvious homes.
Library boundary rule is documented.
```

---

## Library Boundary Verification

Release `0.1` documents this dependency rule:

```text
libs/* may depend on libs/core only.
```

Verification should check:

```text
No obvious cross-library dependency spaghetti exists.
Shared logic belongs in libs/core where appropriate.
Exceptions are documented.
```

Automated enforcement may be deferred, but the rule must be documented.

Future releases may enforce this through Nx or ESLint rules.

---

## Secret and Environment Verification

Release `0.1` should confirm secrets are not committed.

Verify:

```text
.env files are ignored where appropriate.
.env.example exists or is planned.
Secrets are not present in committed files.
Cloudflare IDs and non-secret resource identifiers are documented carefully.
Secret values are stored in approved secret storage.
```

Never commit:

```text
API keys
provider tokens
OAuth secrets
webhook secrets
database passwords
private keys
session secrets
```

---

## Cloudflare Configuration Verification

If Cloudflare Worker configuration exists in release `0.1`, verify it.

Possible file:

```text
wrangler.toml
```

Verify:

```text
Wrangler config parses as TOML.
Worker entrypoint exists.
Asset directory path is correct or documented.
Bindings are named consistently.
No secrets are stored directly in config.
Observability settings are intentional.
Queue bindings are documented if used.
KV/R2 bindings are documented if used.
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

---

## Docker Verification

Full Docker support is not required for release `0.1`.

However, Docker expectations should be documented.

Verify:

```text
Docker expectations are documented.
Future deployable apps/services are expected to have Dockerfiles.
Full self-hosting is marked future scope.
No release 0.1 task depends on full Docker Compose.
```

---

## CI Readiness Verification

Release `0.1` should be CI-ready or clearly document what remains.

Verify:

```text
Core commands are CI-friendly.
Node 24.x is documented.
pnpm is documented.
Coverage threshold is documented.
80% coverage gate is included.
CI expectations are documented.
```

If GitHub Actions exists, verify:

```text
CI uses Node 24.x.
CI uses pnpm.
CI runs lint.
CI runs format check if available.
CI runs typecheck.
CI runs test:coverage.
CI runs build.
```

---

## Minimum Test Coverage Gate

This is a hard release quality gate.

```text
Minimum coverage: 80%
```

Required thresholds:

| Coverage Type | Minimum |
| ------------- | ------: |
| Statements    |     80% |
| Branches      |     80% |
| Functions     |     80% |
| Lines         |     80% |

Release `0.1` may have a small amount of runtime code, but whatever real logic exists should be tested.

Do not lower the threshold just to pass.

If code is not worth testing, reconsider whether it belongs in runtime logic.

---

## Test File Naming

Recommended test file patterns:

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

Tests should live near the code they verify unless a package has a specific testing structure.

---

## What Should Be Tested in 0.1

Release `0.1` should test foundational logic where it exists.

Examples:

```text
core utility functions
base error behavior
constants helpers
environment validation helpers
configuration helpers
small pure functions
workspace scripts where practical
```

Do not write fake tests that only exist to inflate coverage.

Tests should verify real behavior.

---

## What Does Not Need Product Testing Yet

Release `0.1` does not need tests for features that do not exist yet.

Out of scope:

```text
Authentication flows
Discord moderation flows
Ticket flows
AI assistant behavior
Workflow automation
Billing
Marketplace
Mobile app
Desktop app
Self-hosting
Advanced integrations
```

These belong to later releases.

---

## Failure Handling

If a test command fails, document:

```text
Command that failed
Error summary
Affected area
Likely cause
Fix or next step
Whether release is blocked
```

Example:

```text
Command:
pnpm typecheck

Failure:
apps/frontend cannot resolve libs/ui path alias.

Status:
Blocked

Next step:
Fix tsconfig path mapping.
```

---

## Release Testing Checklist

Before release `0.1` is marked complete:

```text
pnpm install passes.
pnpm lint passes.
pnpm format passes.
pnpm format:check passes if available.
pnpm typecheck passes.
pnpm test passes.
pnpm test:coverage passes.
Coverage is at least 80%.
pnpm build passes.
Docs are present.
Release docs are present.
No secrets are committed.
Folder casing is consistent.
CI expectations are documented.
Docker expectations are documented.
Known limitations are documented.
```

---

## Known Limitations

Release `0.1` may still have limitations.

Acceptable limitations:

```text
Limited test suite because product features are not implemented yet.
Placeholder apps or libraries.
CI workflow may be basic.
Docker support may be documentation-only.
Cloudflare config may be early.
No end-user product testing yet.
```

Unacceptable limitations:

```text
No install path.
No typecheck path.
No test command.
No coverage command.
No documented coverage threshold.
No build path or explanation.
No release docs.
Secrets committed to repo.
Confusing duplicate docs folder casing.
```

---

## Testing Exit Criteria

Release `0.1` testing is complete when:

```text
All required commands run successfully.
Coverage threshold is enforced at 80%.
Coverage report is generated.
Workspace structure is verified.
Docs structure is verified.
Release docs are verified.
Secrets are not committed.
Known limitations are documented.
```

---

## Final Testing Standard

Release `0.1` testing should make the foundation trustworthy.

The standard is:

> A developer can clone the repo, install dependencies, run checks, run tests with at least 80% coverage, build the workspace, and understand whether the foundation is ready for the next release.
