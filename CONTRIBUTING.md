# Contributing to Aerealith

Thank you for contributing. Keep changes focused, secure, and easy to review.
Repository configuration and executable source are authoritative; draft
documentation may describe behavior that is not implemented.

## Start Here

Read the [project overview](README.md), [current state](docs/CURRENT_STATE.md),
[technology stack](docs/STACK.md), and [engineering index](docs/engineering/README.md).
Also consult the applicable standards for
[local development](docs/engineering/Local%20Development.md),
[code style](docs/engineering/Code%20Style.md),
[TypeScript](docs/engineering/TypeScript%20Standards.md),
[testing](docs/engineering/Testing.md),
[monorepo structure](docs/engineering/Monorepo%20Rules.md),
[dependencies](docs/engineering/Dependency%20Rules.md),
[package management](docs/engineering/Package%20Management.md),
[documentation](docs/engineering/Documentation%20Standards.md), and
[secrets](docs/engineering/Secrets.md).

## Setup and Local Development

Install Git, Node.js `26.5.0`, and pnpm `11.13.1`, as pinned in
`package.json`, then install the committed dependency graph:

```bash
pnpm install --frozen-lockfile
```

Use pnpm only and do not create npm or Yarn lockfiles. This is an Nx workspace;
root scripts delegate checks to Nx. The root manifest has no general `dev` or
`build` script, so use the owning project's configured Nx target rather than
unimplemented draft examples. Use synthetic data and fake providers where
available; never use production data or credentials locally.

## Branches and Commits

Use GitHub Flow against `master`. Accepted branch prefixes are `feature/`,
`fix/`, `hotfix/`, `chore/`, `docs/`, `refactor/`, `test/`, `build/`,
`ci/`, `perf/`, `security/`, and `ai/`. The `release/` and `releases/`
prefixes are reserved. CI runs for pull requests and pushes targeting `master`,
`staging`, and `production`.

Commitlint requires `type(optional-scope): subject`. Allowed types are `feat`,
`fix`, `refactor`, `test`, `docs`, `build`, `ci`, `chore`, `perf`,
`style`, `revert`, `security`, `deps`, `release`, `wip`, and `hotfix`.
Types and scopes are lowercase; subjects are required and do not end in a
period; headers are at most 100 characters. `wip` commits are rejected on
`master`, `staging`, and `production`. The pre-commit hook runs lint-staged.

## Code and Dependency Rules

- Preserve Nx ownership, public entry points, runtime compatibility, and
  architectural dependency direction.
- Browser code must not import persistence, secrets, server configuration, or
  server-only implementations. Keep provider SDKs in adapters and persistence
  in the data boundary.
- Avoid circular, phantom, undeclared, and deep private imports.
- Add dependencies only to their owning project. Explain purpose, runtime,
  security, transitive, bundle, replacement, and removal impact in the pull
  request.
- Review every manifest, override, dependency, and lockfile change. Never
  hand-edit the lockfile.
- Do not edit generated files, build or coverage output, installed dependencies,
  or caches.

## Testing and Validation

Add deterministic tests for changed behavior, boundaries, failures, and security
invariants. Do not use production credentials, real external services,
arbitrary sleeps, or shared mutable fixtures in ordinary tests.

These commands are current root scripts:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm e2e
pnpm check
```

`pnpm check` runs formatting checks, code and Markdown linting, type checking,
and tests. Run coverage and end-to-end checks separately when relevant. The
manifest also supplies `:affected` scripts for focused validation.

## Documentation

Update documentation with behavior, configuration, public contract, setup, or
operational changes. Label plans, use canonical terminology, relative links,
stable headings, language-tagged fences, and safe examples. Do not manually edit
generated reference documentation. Run:

```bash
pnpm lint:md
```

## Security

Never commit or disclose secrets, credentials, tokens, keys, production
connection strings, sensitive data, or unredacted diagnostics. Keep local
`.env` and `.dev.vars` files ignored. Secrets must not enter browser code,
Aerealith AI context, logs, tests, screenshots, issues, or pull requests.

Report vulnerabilities privately under the [security policy](SECURITY.md).
Treat exposed credentials as compromised without using or repeating them.
Authentication, authorization, sessions, credentials, migrations, dependencies,
lockfiles, containers, infrastructure, CI, deployment, breaking contracts, and
security findings require risk-appropriate human review.

## Licensing and Contributor Agreement

Before contributions can be accepted, contributors must agree to the applicable
final Contributor License Agreement (CLA). The current [CLA](CLA.md) is a draft
for attorney review, and no acceptance service or approved acceptance process is
configured yet. Until the CLA and process are approved, maintainers must not
represent a contribution as accepted under the CLA.

Use [LICENSE-POLICY.md](LICENSE-POLICY.md) to identify the license governing
each changed file. A file-specific notice, nearest directory license, or package
license overrides the root default. If ownership or licensing is ambiguous,
stop and request review through `legal@sinlessgames.com`; do not assume the
material has been relicensed.

Contributions must:

- be original or lawfully reusable under terms compatible with the destination;
- contain no improperly copied or incompatible third-party code, content,
  models, datasets, generated assets, or other resources;
- preserve existing copyright, attribution, SPDX, and license notices;
- use the correct SPDX identifier on clearly owned source files when a header is
  appropriate;
- document the purpose, owner, provenance, and license compatibility of every
  new dependency; and
- keep brand assets and proprietary components outside the permissions granted
  by the open-source code licenses.

Use `AGPL-3.0-only` for clearly owned core source and `Apache-2.0` only in a
package explicitly classified for that license. Documentation text covered by
the documentation notice uses `CC-BY-4.0`. Brand and proprietary paths use no
open-source SPDX identifier. Do not add headers to JSON, lockfiles, generated
files, or third-party files, and never replace an existing notice.

Run the licensing check before opening a pull request:

```bash
pnpm license:check
```

Commit messages for licensing changes should use an appropriate configured type,
such as `docs(license): ...`, `chore(license): ...`, or `deps(...): ...`.
Pull requests must identify affected license paths, new dependencies,
third-party material, generated content, and preserved notices.

## Pull Requests, Reviews, and CI

Open a focused pull request against `master`; use a draft until it is testable
and link applicable issues. Describe the problem and solution, affected
projects, tests run, documentation and configuration effects, dependency and
security impact, migrations, compatibility, rollback, and safe UI evidence.

Resolve review comments with code, tests, documentation, or a technical
explanation. Automation never approves or merges pull requests, and passing
checks do not replace human review.

CI performs a frozen install, verifies Nx, runs affected `lint`, `typecheck`,
`test`, and `build` targets, and runs MegaLinter. Other workflows may run
security, dependency, and coverage checks. Required checks must pass. Fork pull
requests receive no repository or environment secrets.

## Contributor Checklist

- [ ] Scope and branch prefix are correct; commits pass Commitlint.
- [ ] Project, runtime, API, and dependency boundaries are preserved.
- [ ] Tests cover behavior and important failures; relevant checks pass.
- [ ] Documentation is current and `pnpm lint:md` passes.
- [ ] No secrets, production data, generated output, or unrelated changes exist.
- [ ] Dependency and lockfile changes are intentional and explained.
- [ ] The pull request links work, documents risk, and includes safe UI evidence
      when appropriate.

## Maintainer Checklist

- [ ] Scope, linkage, branch, commits, architecture, and dependencies are valid.
- [ ] Tests are meaningful, deterministic, and proportional to risk.
- [ ] Documentation, configuration, migrations, compatibility, and rollback are
      covered.
- [ ] Dependency ownership, license, security, and lockfile impact are reviewed.
- [ ] Secrets, user data, logs, artifacts, and browser bundles remain protected.
- [ ] High-risk changes received qualified human review.
- [ ] Required checks pass and the final diff has no unrelated generated changes.
