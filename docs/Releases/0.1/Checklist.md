# 0.1 — Checklist

Release `0.1 — Foundation & Workspace` is complete only when the repository foundation is installed, configured, documented, tested, and ready for the next release.

This checklist is the final go/no-go gate for release `0.1`.

Do not mark this release complete until the required checks pass or any limitations are clearly documented.

---

## Purpose

This checklist confirms that release `0.1` successfully establishes:

- workspace foundation
- package management
- TypeScript configuration
- linting
- formatting
- testing
- 80% coverage minimum
- build command
- documentation structure
- release documentation
- app/library structure
- dependency boundary expectations
- CI readiness
- Docker expectations
- secret handling expectations

Release `0.1` is not complete just because files exist.

It is complete when the foundation works.

---

# Release Status

```text
Status: Planned
Release: 0.1 — Foundation & Workspace
Completion Target: Before 0.2 begins
Required Coverage Minimum: 80%
```

---

# Go / No-Go Summary

| Gate                      | Required | Status      |
| ------------------------- | -------: | ----------- |
| Workspace Gate            |      Yes | Not Started |
| Tooling Gate              |      Yes | Not Started |
| Repository Structure Gate |      Yes | Not Started |
| Documentation Gate        |      Yes | Not Started |
| Release Docs Gate         |      Yes | Not Started |
| Testing Gate              |      Yes | Not Started |
| Coverage Gate             |      Yes | Not Started |
| Build Gate                |      Yes | Not Started |
| CI Readiness Gate         |      Yes | Not Started |
| Docker Expectations Gate  |      Yes | Not Started |
| Security / Secrets Gate   |      Yes | Not Started |
| Scope Gate                |      Yes | Not Started |

---

# 1. Workspace Gate

The workspace must be installable and understandable.

## Required Checks

- [ ] `pnpm` is the documented package manager.
- [ ] `pnpm-workspace.yaml` exists.
- [ ] `pnpm-lock.yaml` exists and is committed.
- [ ] `package.json` exists at the repository root.
- [ ] Nx is installed or configured.
- [ ] `nx.json` exists.
- [ ] Workspace projects are discoverable.
- [ ] Root scripts are defined.
- [ ] Developer setup path is documented.

## Verification Commands

```bash
pnpm install
```

Optional:

```bash
pnpm nx graph
```

## Pass Criteria

- [ ] `pnpm install` completes successfully.
- [ ] No unexpected `package-lock.json` or `yarn.lock` is generated.
- [ ] Workspace package discovery works.
- [ ] Nx can run from the repository root.
- [ ] The repo can be cloned and installed predictably.

---

# 2. Runtime Gate

The runtime expectation must be clear.

## Required Checks

- [ ] Node version expectation is documented.
- [ ] Node version standard is `Node 24.x`.
- [ ] `.node-version` or `.nvmrc` exists, or the version is documented elsewhere.
- [ ] `package.json` includes `engines.node` if appropriate.
- [ ] Future CI can use the same Node version.

## Pass Criteria

- [ ] Developers know which Node version to use.
- [ ] Local development and CI can align on Node 24.x.

---

# 3. TypeScript Gate

TypeScript must be configured as the primary language foundation.

## Required Checks

- [ ] TypeScript is installed.
- [ ] `tsconfig.base.json` exists.
- [ ] Root `tsconfig.json` exists if needed.
- [ ] Apps and libs can extend shared TypeScript config.
- [ ] Typecheck command exists.
- [ ] Strict typing expectations are documented.

## Verification Command

```bash
pnpm typecheck
```

## Pass Criteria

- [ ] `pnpm typecheck` completes successfully.
- [ ] TypeScript errors are resolved.
- [ ] Any placeholder limitations are documented.
- [ ] Future apps/libs can inherit TypeScript settings cleanly.

---

# 4. Code Quality Gate

Linting and formatting must be configured.

---

## ESLint Checks

- [ ] ESLint is installed.
- [ ] ESLint config exists.
- [ ] TypeScript linting is configured.
- [ ] Ignore rules are configured where needed.
- [ ] Lint command exists.

## Verification Command

```bash
pnpm lint
```

## Pass Criteria

- [ ] `pnpm lint` completes successfully.
- [ ] No lint errors remain.
- [ ] Lint scope is clear.

---

## Prettier Checks

- [ ] Prettier is installed.
- [ ] Prettier config exists.
- [ ] `.prettierignore` exists if needed.
- [ ] Format command exists.
- [ ] Format check command exists or is planned.

## Verification Commands

```bash
pnpm format
```

Recommended for CI:

```bash
pnpm format:check
```

## Pass Criteria

- [ ] `pnpm format` completes successfully.
- [ ] Formatting changes are committed.
- [ ] `pnpm format:check` passes if available.
- [ ] Formatting applies consistently to code, docs, and config files.

---

## Commitlint Checks

- [ ] Commitlint is installed or intentionally deferred.
- [ ] Commitlint config exists if enabled.
- [ ] Conventional Commits are documented.
- [ ] Example commit messages are provided.

## Pass Criteria

- [ ] Commit message standard is documented.
- [ ] Commitlint is configured or clearly deferred.

---

# 5. Testing Gate

The test runner must be configured and usable.

## Required Checks

- [ ] Vitest is installed.
- [ ] Test config exists if needed.
- [ ] Test command exists.
- [ ] Tests can run from the repository root.
- [ ] Test file naming conventions are documented.
- [ ] Testing limitations are documented if the suite is minimal.

## Verification Command

```bash
pnpm test
```

## Pass Criteria

- [ ] `pnpm test` completes successfully.
- [ ] All tests pass.
- [ ] Test output is understandable.
- [ ] Future libraries can add tests cleanly.

---

# 6. Coverage Gate

Release `0.1` requires an 80% minimum coverage threshold.

This is a hard release gate.

## Required Coverage Thresholds

| Coverage Type | Minimum |
| ------------- | ------: |
| Statements    |     80% |
| Branches      |     80% |
| Functions     |     80% |
| Lines         |     80% |

## Required Checks

- [ ] Coverage command exists.
- [ ] Coverage provider is configured.
- [ ] Coverage thresholds are configured.
- [ ] Coverage report is generated.
- [ ] Coverage output is visible locally.
- [ ] Coverage can run in CI.
- [ ] Coverage exclusions are justified.
- [ ] Real logic is not excluded to inflate coverage.

## Verification Command

```bash
pnpm test:coverage
```

## Pass Criteria

- [ ] `pnpm test:coverage` completes successfully.
- [ ] Statements coverage is at least 80%.
- [ ] Branches coverage is at least 80%.
- [ ] Functions coverage is at least 80%.
- [ ] Lines coverage is at least 80%.
- [ ] Coverage report is generated.
- [ ] `coverage/` is not committed.

---

# 7. Build Gate

The workspace must have a build path.

## Required Checks

- [ ] Build command exists.
- [ ] Nx build targets exist where applicable.
- [ ] Placeholder build limitations are documented.
- [ ] Build output is ignored where appropriate.
- [ ] Build command is CI-ready.

## Verification Command

```bash
pnpm build
```

## Pass Criteria

- [ ] `pnpm build` completes successfully.
- [ ] Build failures are understandable.
- [ ] Build limitations are documented if some apps/libs are placeholders.

---

# 8. Root Scripts Gate

The root `package.json` should define the standard commands.

## Required Scripts

- [ ] `lint`
- [ ] `format`
- [ ] `typecheck`
- [ ] `test`
- [ ] `test:coverage`
- [ ] `build`

## Recommended Scripts

- [ ] `format:check`
- [ ] `lint:fix`
- [ ] `clean`
- [ ] `graph`
- [ ] `affected`
- [ ] `dev`

## Pass Criteria

- [ ] Required scripts exist.
- [ ] Scripts are documented.
- [ ] Scripts work or limitations are documented.
- [ ] Script names are predictable.

---

# 9. Repository Structure Gate

The repo structure must be clear.

## Required Top-Level Folders

- [ ] `apps/`
- [ ] `libs/`
- [ ] `docs/`

## Expected or Planned Apps

- [ ] `apps/frontend/`
- [ ] `apps/api/`

## Expected or Planned Libraries

- [ ] `libs/core/`
- [ ] `libs/contracts/`
- [ ] `libs/api/`
- [ ] `libs/db/`
- [ ] `libs/ui/`
- [ ] `libs/content/`
- [ ] `libs/flags/`
- [ ] `libs/observability/`

## Pass Criteria

- [ ] Apps location is clear.
- [ ] Libraries location is clear.
- [ ] Docs location is clear.
- [ ] Future shared code has an obvious home.
- [ ] Future deployable apps/services have an obvious home.

---

# 10. Library Boundary Gate

The initial dependency rule must be documented.

## Required Rule

```text
libs/* may depend on libs/core only.
```

## Required Checks

- [ ] Rule is documented in release docs.
- [ ] Rule is documented or planned for architecture docs.
- [ ] Allowed examples are documented.
- [ ] Avoided examples are documented.
- [ ] Exception process is documented.
- [ ] Automated enforcement is planned or deferred intentionally.

## Pass Criteria

- [ ] Library boundary rule is clear.
- [ ] Cross-library dependencies are not added casually.
- [ ] Exceptions require documentation.

---

# 11. Documentation Gate

Documentation must exist and be navigable.

## Required Documentation Structure

- [ ] `docs/README.md`
- [ ] `docs/vision/`
- [ ] `docs/product/`
- [ ] `docs/releases/`
- [ ] `docs/architecture/`
- [ ] `docs/engineering/`
- [ ] `docs/services/`
- [ ] `docs/modules/`
- [ ] `docs/integrations/`
- [ ] `docs/api/`
- [ ] `docs/operations/`
- [ ] `docs/rfcs/`

## Required Vision Docs

- [ ] `docs/vision/README.md`
- [ ] `docs/vision/Vision.md`
- [ ] `docs/vision/Mission.md`
- [ ] `docs/vision/Core Values.md`
- [ ] `docs/vision/Product Philosophy.md`
- [ ] `docs/vision/Manifesto.md`
- [ ] `docs/vision/Roadmap.md`
- [ ] `docs/vision/Positioning.md`
- [ ] `docs/vision/Trust Model.md`

## Required Product Docs

- [ ] `docs/product/README.md`
- [ ] `docs/product/Product Overview.md`
- [ ] `docs/product/User Personas.md`
- [ ] `docs/product/Platform Capabilities.md`
- [ ] `docs/product/Module System.md`
- [ ] `docs/product/Discord Platform.md`
- [ ] `docs/product/AI Assistant.md`
- [ ] `docs/product/Automation.md`
- [ ] `docs/product/Dashboard.md`
- [ ] `docs/product/Integrations.md`
- [ ] `docs/product/Developer Platform.md`
- [ ] `docs/product/MVP Scope.md`

## Pass Criteria

- [ ] Docs are organized.
- [ ] Docs are readable.
- [ ] README files link to important docs.
- [ ] Docs use consistent folder casing.
- [ ] No obvious broken relative links exist.

---

# 12. Release Documentation Gate

Release `0.1` must have complete release docs.

## Required Release Docs

- [ ] `docs/releases/README.md`
- [ ] `docs/releases/0.1/README.md`
- [ ] `docs/releases/0.1/Release.md`
- [ ] `docs/releases/0.1/Features.md`
- [ ] `docs/releases/0.1/Architecture Changes.md`
- [ ] `docs/releases/0.1/Tasks.md`
- [ ] `docs/releases/0.1/Testing.md`
- [ ] `docs/releases/0.1/Checklist.md`
- [ ] `docs/releases/0.1/Breaking Changes.md`

## Pass Criteria

- [ ] All release docs exist.
- [ ] Release docs link to each other.
- [ ] Release scope is clear.
- [ ] Release tasks are clear.
- [ ] Testing requirements are clear.
- [ ] 80% coverage requirement is documented.
- [ ] Breaking changes are documented or explicitly marked none.
- [ ] Future release docs can copy this structure.

---

# 13. Folder Casing Gate

Folder casing must be consistent.

## Required Standard

Preferred:

```text
docs/releases/
```

Avoid:

```text
docs/Releases/
```

## Required Checks

- [ ] Check for duplicate folders that differ only by capitalization.
- [ ] Consolidate release docs into `docs/releases/`.
- [ ] Update links to lowercase path casing.
- [ ] Document lowercase folder preference.

## Pass Criteria

- [ ] `docs/releases/` is used consistently.
- [ ] No duplicate `docs/Releases/` folder remains.
- [ ] Relative links use consistent casing.

---

# 14. Environment and Secrets Gate

Secrets must not be committed.

## Required Checks

- [ ] `.gitignore` excludes local secret files.
- [ ] `.env` is ignored where appropriate.
- [ ] `.env.example` exists or is intentionally deferred.
- [ ] Secret handling rules are documented.
- [ ] Local environment expectations are documented.
- [ ] No secrets are committed.

## Never Commit

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

## Pass Criteria

- [ ] Secret files are ignored.
- [ ] No committed files contain secrets.
- [ ] Environment setup expectations are clear.

---

# 15. Cloudflare Foundation Gate

Cloudflare configuration is optional in `0.1`, but if present, it must be valid and documented.

## Required Checks If Cloudflare Config Exists

- [ ] `wrangler.toml` exists.
- [ ] TOML parses correctly.
- [ ] Worker entrypoint exists.
- [ ] Asset directory path is correct or documented.
- [ ] Bindings are documented.
- [ ] No secrets are committed in config.
- [ ] Observability settings are intentional.
- [ ] Queue/KV/R2 bindings are documented if used.

## Known Binding Names

```text
ASSETS
AEREALITH_KV
AEREALITH_AI
FLAGSHIP_FLAGS
AEREALITH_ANALYTICS
EVENTBUS
```

## Pass Criteria

- [ ] Cloudflare config is valid if present.
- [ ] Cloudflare assumptions are documented.
- [ ] Provider lock-in risk is acknowledged.
- [ ] Future Docker/self-hosting path is not blocked.

---

# 16. Docker Expectations Gate

Full Docker support is not required for release `0.1`.

Docker expectations must still be documented.

## Required Checks

- [ ] Docker expectations are documented.
- [ ] Future deployable apps/services are expected to have Dockerfiles.
- [ ] Full Docker Compose is marked future scope.
- [ ] Full self-hosting is marked future scope.
- [ ] Provider replacement direction is documented.

## Pass Criteria

- [ ] Docker expectations are clear.
- [ ] No `0.1` task incorrectly depends on full self-hosting.
- [ ] Future deployable boundaries are Docker-aware.

---

# 17. CI Readiness Gate

Release `0.1` should be CI-ready or document what remains.

## Required Checks

- [ ] CI expectations are documented.
- [ ] Core commands are suitable for CI.
- [ ] Node 24.x is documented for CI.
- [ ] pnpm is documented for CI.
- [ ] Coverage threshold is documented for CI.
- [ ] Initial GitHub Actions workflow exists or is intentionally deferred.

## Expected CI Commands

```bash
pnpm install
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test:coverage
pnpm build
```

## Pass Criteria

- [ ] CI flow is documented.
- [ ] Commands are CI-friendly.
- [ ] Missing CI pieces are documented.

---

# 18. Scope Gate

Release `0.1` must stay focused on foundation and workspace work.

## Required Checks

- [ ] No major authentication implementation is included.
- [ ] No Discord moderation implementation is included.
- [ ] No ticket system implementation is included.
- [ ] No AI assistant behavior implementation is included.
- [ ] No workflow engine implementation is included.
- [ ] No marketplace implementation is included.
- [ ] No billing implementation is included.
- [ ] No mobile/desktop app implementation is included.
- [ ] No full self-hosting implementation is included.

## Allowed in 0.1

```text
Placeholders
Folder structure
Planning docs
Tooling setup
Workspace setup
Basic config
Basic sample tests
Documentation
Release tracking
```

## Pass Criteria

- [ ] Release scope matches `0.1 — Foundation & Workspace`.
- [ ] Product features are moved to later releases.
- [ ] No scope creep is hidden inside the release.

---

# 19. Breaking Changes Gate

Breaking changes must be documented.

## Required Checks

- [ ] `Breaking Changes.md` exists.
- [ ] Release is identified as the first formal release.
- [ ] Path casing changes are documented if applicable.
- [ ] Migration notes are included if existing files were moved.
- [ ] If there are no breaking changes, the file says so clearly.

## Pass Criteria

- [ ] Breaking changes are documented or explicitly marked none.
- [ ] Migration notes are clear.

---

# 20. Final Verification Commands

Before marking release `0.1` complete, run:

```bash
pnpm install
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
```

Recommended CI-style command sequence:

```bash
pnpm install
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test:coverage
pnpm build
```

---

# 21. Required Passing Results

Release `0.1` requires:

```text
Install passes.
Lint passes.
Format passes.
Typecheck passes.
Tests pass.
Coverage passes at 80% minimum.
Build passes.
Docs exist.
Release docs exist.
Secrets are not committed.
Folder casing is consistent.
Known limitations are documented.
```

---

# 22. Acceptable Limitations

The following limitations are acceptable for release `0.1`:

```text
Limited product tests because product features do not exist yet.
Placeholder apps.
Placeholder libraries.
Basic CI only.
Docker expectations documented but Dockerfiles not complete.
Cloudflare config early or partial.
No end-user product flows.
No production deployment automation.
No full observability stack.
```

---

# 23. Unacceptable Limitations

The following limitations block release completion:

```text
No install path.
No TypeScript config.
No lint command.
No format command.
No test command.
No coverage command.
No 80% coverage threshold.
No build command or build explanation.
No release docs.
No documentation structure.
Secrets committed to the repo.
Duplicate docs/Releases and docs/releases folders.
Unclear app/library structure.
Unclear package manager.
Unclear Node version.
```

---

# 24. Final Go / No-Go Decision

Use this section when release `0.1` is ready for review.

## Go

Mark release `0.1` as **Go** only when:

- [ ] All required gates pass.
- [ ] Coverage is at least 80%.
- [ ] Docs are complete.
- [ ] Known limitations are documented.
- [ ] No critical blockers remain.
- [ ] The next release can safely begin.

## No-Go

Mark release `0.1` as **No-Go** if:

- [ ] Any required command fails.
- [ ] Coverage is below 80%.
- [ ] Secrets are committed.
- [ ] Required docs are missing.
- [ ] Folder casing is inconsistent.
- [ ] Scope creep has entered the release.
- [ ] The workspace cannot be installed or checked reliably.

---

# 25. Release Completion Statement

When complete, update this section.

```text
Release 0.1 — Foundation & Workspace has been completed.

The Aerealith AI repository can be installed, checked, formatted, typechecked, tested with at least 80% coverage, built, documented, and used as the foundation for release 0.2.
```

---

# Final Checklist Standard

Release `0.1` is complete when the foundation is boring in the best way.

It installs.

It checks.

It tests.

It builds.

It documents itself.

It gives future releases somewhere clean to stand.

The standard is:

> A developer can clone the repo, install dependencies, run core checks, pass 80% coverage, build the workspace, understand the structure, and begin release `0.2` without guessing where things belong.
