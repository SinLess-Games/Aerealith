<!--
.github/PULL_REQUEST_TEMPLATE/refactor.md

PR title format:
refactor(scope): concise description

Examples:
refactor(core): simplify entity construction
refactor(db): consolidate user query helpers
refactor(api): centralize route metadata handling
refactor(frontend): reorganize account settings components
-->

# ♻️ Refactor

## ✨ Summary

<!--
Briefly explain what internal structure, code organization, architecture,
or implementation pattern this pull request improves.

Examples:
- Simplify shared entity construction and validation.
- Consolidate duplicated database query helpers.
- Reorganize frontend components around feature boundaries.
- Replace a legacy abstraction with a smaller typed alternative.
-->

## 🔗 Linked issue

Closes #

<!--
Optional external reference:
AER-123
-->

## 🎯 Motivation

<!--
Why is this refactor needed?

Examples:
- Reduce duplication.
- Improve maintainability.
- Improve type safety.
- Clarify ownership and responsibilities.
- Simplify testing.
- Reduce coupling between modules.
- Improve performance without changing intended behavior.
- Prepare the codebase for an upcoming feature.
-->

## 🧩 Affected Aerealith areas

<!-- Select every area affected by this refactor. -->

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
- [ ] Other

## 🏗 Architecture before this change

<!--
Describe the previous structure, limitation, duplication, coupling, or
maintenance problem.

Include relevant paths, abstractions, dependencies, or flow diagrams
when they help reviewers understand the need for this refactor.
-->

## 🔧 Architecture after this change

<!--
Describe the new structure and responsibility boundaries.

Useful details:
- Files, modules, or packages moved
- APIs, contracts, schemas, or types changed
- Dependencies removed or introduced
- Duplication removed
- Ownership clarified
- New conventions established
-->

## 🔄 Behavior contract

<!--
A refactor should not intentionally change externally visible behavior
unless explicitly documented below.
-->

- [ ] This pull request does not intentionally change public behavior.
- [ ] This pull request preserves existing API contracts and user-facing flows.
- [ ] This pull request preserves existing error behavior where applicable.
- [ ] This pull request preserves existing persistence behavior where applicable.
- [ ] Intentional behavior changes are documented below.

### Intentional behavior changes

<!--
Document every intentional behavior change.

Write "None" when this is a behavior-preserving refactor.
-->

## 🧱 Dependency and boundary review

<!--
Review how this refactor affects package and module boundaries.

For Aerealith:
- Libraries should depend on core only unless an exception is intentional.
- Core must not depend on database or application layers.
- Avoid introducing unnecessary cross-library dependencies.
-->

- [ ] Library dependency boundaries were reviewed.
- [ ] No unnecessary cross-library dependencies were introduced.
- [ ] Core remains independent of database and application layers.
- [ ] Public imports and exports remain intentional.
- [ ] Circular dependency risk was reviewed.
- [ ] Dependency changes are documented below.
- [ ] No dependency changes are included.

### Dependency changes

| Package or module | Change | Reason |
| ----------------- | ------ | ------ |
|                   |        |        |

## 🗃 Data and migration impact

<!--
Describe database, schema, migration, entity, contract, or persisted-state
changes introduced by this refactor.

Write "None" when the refactor does not affect persisted data.
-->

### Database or entity changes

<!--
Examples:
- Move repository mapping logic without changing table structure.
- Consolidate schema helpers with no migration required.
- No persistent data changes.
-->

### Migration plan

<!--
Examples:
- No migration required.
- Run generated migration before deployment.
- Existing records remain compatible.
-->

### Rollback plan

<!--
Explain how to safely revert this refactor if needed.

Examples:
- Revert this pull request.
- Restore the previous module structure.
- Deploy the previous known-good artifact.
-->

## 🧱 API and contract impact

<!--
Document changed or preserved:
- REST routes
- tRPC procedures
- GraphQL operations
- WebSocket events
- Shared contracts
- Zod schemas
- Error codes
- Public types
- Environment variables

Write "None" when no public contract changes are included.
-->

## 🔐 Security and privacy review

<!--
Complete applicable items below.
-->

- [ ] Authentication behavior was reviewed.
- [ ] Authorization and permission boundaries were reviewed.
- [ ] Input validation and error handling were reviewed.
- [ ] Sensitive user data handling was reviewed.
- [ ] Consent, privacy, retention, or audit behavior was reviewed where applicable.
- [ ] Rate limits, abuse prevention, retries, or idempotency were considered where applicable.
- [ ] No secrets, credentials, tokens, or private data were added.

## 🧪 Validation strategy

<!--
Explain how you verified that behavior was preserved.

Examples:
- Existing unit tests cover the refactored entities.
- Added regression tests around repository query behavior.
- Ran end-to-end tests for affected frontend workflows.
- Compared API responses before and after the refactor.
-->

### Regression risk areas

<!--
List behaviors, services, or workflows that reviewers should pay special
attention to.
-->

### Test changes

<!--
List added, updated, removed, or intentionally unchanged test coverage.
-->

## 🧪 Validation performed

<!--
List commands you actually ran and summarize their results.

Examples:
pnpm nx test core
pnpm nx test db
pnpm nx lint frontend
pnpm nx typecheck api
pnpm nx build frontend
-->

```sh
# Commands run:
```

### Validation checklist

- [ ] I added or updated tests, or documented why tests are not applicable.
- [ ] I ran the relevant typecheck, lint, and test commands.
- [ ] I updated documentation, or confirmed no documentation changes are needed.
- [ ] I did not add secrets, credentials, tokens, or private data.
- [ ] I attached screenshots or a recording for frontend or UI changes.

## 📸 Screenshots or recordings

<!--
Required when apps/frontend or libs/ui changes.

Attach:
- Before and after screenshots
- Screen recordings for interactive changes
- API request and response examples for non-visual behavior
- Architecture diagrams when helpful

Write "Not applicable" when no frontend or UI behavior changed.
-->

## 🚦 Rollout plan

<!--
Describe deployment order, feature flags, migrations, cache invalidation,
configuration changes, or staged rollout requirements.

Write "Standard merge and deploy" when no special rollout is needed.
-->

## 📈 Monitoring and observability

<!--
Document logs, metrics, traces, dashboards, alerts, error codes, or signals
that should be reviewed after deployment.

Write "Standard service monitoring" when no additional monitoring is needed.
-->

## 🔄 Follow-up work

<!--
List intentionally deferred work.

Examples:
- Remove temporary compatibility adapter after downstream migration.
- Split remaining legacy modules in a separate pull request.
- Add architecture documentation after the pattern stabilizes.
- None.
-->

## 📝 Additional notes

<!--
Add reviewer guidance, design tradeoffs, compatibility notes, review focus
areas, or links to relevant architecture documentation.
-->
