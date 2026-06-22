<!--
.github/PULL_REQUEST_TEMPLATE/dependency-update.md

PR title format:
deps: concise description

Examples:
deps: update Drizzle ORM to version 0.45.2
deps: upgrade Nx workspace dependencies
deps: remove unused frontend packages
deps(core): update Zod validation dependency
security(deps): patch vulnerable package versions
-->

# 📦 Dependency Update

## ✨ Summary

<!--
Give a short, clear explanation of what changed.

Examples:
- Upgrade Drizzle ORM and related PostgreSQL packages.
- Remove unused frontend dependencies.
- Patch vulnerable transitive packages.
- Align Nx, TypeScript, and Vitest workspace versions.
-->

## 🔗 Related issue

<!--
Optional for dependency updates.

Examples:
Closes #123
Related to #456
AER-123
-->

## 🎯 Reason for this change

<!--
Why is this dependency update needed?

Examples:
- Security advisory or CVE remediation
- Bug fix
- Compatibility with another package
- New required feature
- Performance improvement
- Maintenance / keeping dependencies current
- Removing unused packages
- Reducing duplicate dependency versions
-->

- [ ] Security remediation
- [ ] Bug fix
- [ ] Compatibility update
- [ ] New capability or required feature
- [ ] Performance improvement
- [ ] Routine maintenance
- [ ] Dependency cleanup or removal
- [ ] Lockfile or workspace alignment
- [ ] Other

## 📋 Dependency changes

| Package        | Previous version | New version | Change type                     | Reason      |
| -------------- | ---------------- | ----------- | ------------------------------- | ----------- |
| `package-name` | `x.y.z`          | `x.y.z`     | major / minor / patch / removed | Explain why |
|                |                  |             |                                 |             |

<!--
For removed packages, use:
| `package-name` | `x.y.z` | removed | removed | No longer used |
-->

## 🧩 Affected workspace areas

<!-- Select every area affected by this update. -->

- [ ] Frontend
- [ ] Documentation
- [ ] Developer portal
- [ ] Core library
- [ ] Database library
- [ ] API library
- [ ] UI library
- [ ] Utility library
- [ ] Configuration library
- [ ] Feature flags
- [ ] Authentication service
- [ ] User service
- [ ] Discord service
- [ ] Infrastructure
- [ ] Cloudflare
- [ ] Nx Cloud
- [ ] Docker
- [ ] CI/CD
- [ ] Repository tooling
- [ ] No direct runtime impact

## ⚠️ Breaking changes and compatibility

<!--
Document all relevant release-note changes, deprecations, migration steps,
Node.js requirements, package-manager requirements, API changes, or behavior
changes introduced by updated dependencies.

Write "None known" when you reviewed release notes and found no relevant
breaking changes.
-->

### Breaking changes

<!--
Example:
- Drizzle ORM changed transaction typing behavior.
- Nx now requires Node.js version 24 or newer.
- Package X removed a deprecated API previously used by apps/frontend.
-->

### Required migrations or code updates

<!--
Example:
- Updated import paths in libs/db.
- Replaced deprecated configuration option.
- No code migration required.
-->

### Compatibility review

- [ ] I reviewed the release notes or changelog for each direct dependency update.
- [ ] I reviewed peer dependency warnings and resolved intentional conflicts.
- [ ] I reviewed Node.js, pnpm, TypeScript, and Nx compatibility where applicable.
- [ ] I confirmed the update does not unintentionally add duplicate major versions.
- [ ] I documented all relevant breaking changes above.
- [ ] No breaking changes are known.

## 🔐 Security review

<!--
Complete this section for security-related updates, vulnerability remediations,
or packages that process authentication, user data, network traffic, secrets,
or deployment credentials.
-->

### Advisory or vulnerability reference

<!--
Examples:
- CVE-YYYY-NNNNN
- GitHub Security Advisory: GHSA-xxxx-xxxx-xxxx
- Dependabot alert number
- None
-->

### Security impact

<!--
Explain the risk being addressed at a safe, high level.
Do not include secrets, credentials, exploit payloads, or active attack details.
-->

- [ ] This update resolves a known security advisory or vulnerability.
- [ ] I reviewed whether the vulnerable package is reachable in Aerealith.
- [ ] I reviewed transitive dependency changes.
- [ ] No security-specific impact applies to this update.

## 🧪 Validation performed

<!--
List the commands you actually ran and summarize their results.

Examples:
pnpm install --frozen-lockfile
pnpm nx run-many -t lint
pnpm nx run-many -t test
pnpm nx run-many -t typecheck
pnpm nx build frontend
-->

```sh
# Commands run:
```

### Validation checklist

- [ ] I ran `pnpm install` successfully after updating dependencies.
- [ ] I verified `pnpm-lock.yaml` only contains expected changes.
- [ ] I ran the relevant typecheck commands.
- [ ] I ran the relevant lint commands.
- [ ] I ran the relevant test commands.
- [ ] I ran relevant application or library builds.
- [ ] I checked affected runtime behavior manually where applicable.
- [ ] I added or updated tests, or documented why tests are not applicable.
- [ ] I updated documentation, or confirmed no documentation changes are needed.
- [ ] I did not add secrets, credentials, tokens, or private data.

## 🗂 Lockfile and package-manager review

- [ ] Direct dependency versions were intentionally updated.
- [ ] Transitive dependency changes were reviewed.
- [ ] No unexpected package-manager configuration changes were introduced.
- [ ] No unintended package removals occurred.
- [ ] No unnecessary duplicate package versions were introduced.
- [ ] Workspace dependency references remain valid.
- [ ] The lockfile was generated using the repository-supported pnpm version.

## 🚀 Rollout and rollback plan

### Rollout plan

<!--
Describe any deployment order, cache invalidation, package publishing,
database migration, environment update, or monitoring needed.
Write "Standard merge and deploy" when no special rollout is required.
-->

### Rollback plan

<!--
Explain how to safely revert this update if it causes failures.

Examples:
- Revert this pull request.
- Pin package-name back to x.y.z.
- Restore the prior lockfile.
- Redeploy the previous known-good artifact.
-->

## 📸 Screenshots or recordings

<!--
Required when this dependency update changes visible frontend or UI behavior.
Attach screenshots, recordings, before/after comparisons, or write:
"Not applicable — no frontend or UI behavior changed."
-->

## 📝 Additional notes

<!--
Include anything reviewers should know:

- Known warnings that are expected
- Deferred follow-up updates
- Major-version upgrade notes
- Compatibility work still needed
- Reasons a package was retained despite a deprecation warning
- Monitoring signals to watch after deployment
-->
