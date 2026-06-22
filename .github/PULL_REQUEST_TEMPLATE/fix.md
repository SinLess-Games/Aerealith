<!--
.github/PULL_REQUEST_TEMPLATE/fix.md

PR title format:
fix(scope): concise description

Examples:
fix(auth): prevent expired refresh token reuse
fix(db): preserve consent history during updates
fix(frontend): correct account settings form validation
fix(discord): prevent duplicate moderation actions
-->

# 🐛 Bug Fix

## ✨ Summary

<!--
Briefly explain the bug and the result of this pull request.

Examples:
- Prevent refresh tokens from being accepted after expiration.
- Correct profile visibility validation for empty settings.
- Fix duplicate Discord event processing during reconnects.
-->

## 🔗 Linked issue

Fixes #

<!--
Optional external reference:
AER-123
-->

## 🚨 Problem

<!--
Describe the defect clearly.

Include:
- What is broken
- Who or what is affected
- When it occurs
- How serious the impact is
- Whether the bug affects production, staging, local development, or CI
-->

## 🔁 Steps to reproduce

<!--
Provide the smallest reliable reproduction path.

Example:
1. Sign in with a valid account.
2. Wait for the refresh token to expire.
3. Call the refresh endpoint.
4. Observe that the expired token is accepted.
-->

1.
2.
3.

## ✅ Expected behavior

<!--
What should happen instead?
-->

## ❌ Actual behavior

<!--
What happens today?

Include errors, unexpected responses, incorrect state changes,
visual defects, or behavior differences.
-->

## 🔍 Root cause

<!--
Explain the underlying cause of the issue.

Useful details:
- Incorrect condition or validation
- Missing error handling
- State synchronization issue
- Schema mismatch
- Race condition
- Dependency regression
- Configuration mismatch
- Incorrect API contract or default value
-->

## 🛠 Resolution

<!--
Explain how this pull request fixes the issue.

Include:
- Code or configuration changes
- Validation changes
- Error handling changes
- Migration or compatibility behavior
- Why the fix addresses the root cause
-->

## 🧩 Affected Aerealith areas

<!-- Select every area affected by this fix. -->

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

## 🧪 Regression coverage

<!--
Describe how this fix is protected against returning.

Examples:
- Added a regression unit test for expired refresh tokens.
- Added an end-to-end test for profile visibility updates.
- Added a test covering duplicate Discord gateway events.
- Not applicable because this is a configuration-only correction.
-->

### Regression scenario covered

<!--
Describe the exact failing behavior that is now tested or manually verified.
-->

### Test changes

<!--
List added or updated test files, test cases, fixtures, or mocks.
-->

## 🔐 Security and privacy review

<!--
Complete the applicable items below.
-->

- [ ] Authentication behavior was reviewed.
- [ ] Authorization and permission boundaries were reviewed.
- [ ] Input validation and error handling were reviewed.
- [ ] Sensitive user data handling was reviewed.
- [ ] Consent, privacy, retention, or audit behavior was reviewed where applicable.
- [ ] Rate limits, abuse prevention, retries, or idempotency were considered where applicable.
- [ ] No secrets, credentials, tokens, or private data were added.

## 🗃 Data and migration impact

<!--
Describe database, schema, migration, entity, contract, or persisted-state impact.

Write "None" when this fix does not affect persisted data.
-->

### Database or entity changes

<!--
Examples:
- Correct invalid default value for user settings metadata.
- Add a missing index for active session lookup.
- No persistent data changes.
-->

### Migration plan

<!--
Examples:
- Run the generated migration before deploying.
- Existing data remains compatible.
- No migration required.
-->

### Rollback plan

<!--
Explain how this fix can be reverted safely if needed.

Examples:
- Revert this pull request.
- Restore the previous configuration value.
- Disable the related feature flag.
-->

## 🧱 API and contract impact

<!--
Document any changed:
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

## 🧷 Dependency impact

<!--
List dependency additions, upgrades, removals, or explain why none are needed.

Write "None" when no dependency changes are included.
-->

| Package | Change | Reason |
| ------- | ------ | ------ |
|         |        |        |

## 🧪 Validation performed

<!--
List the commands you actually ran and summarize the result.

Examples:
pnpm nx test core
pnpm nx test db
pnpm nx lint frontend
pnpm nx typecheck auth
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
- Mobile and desktop screenshots where applicable
- Screen recordings for interaction bugs
- API request and response examples for non-visual fixes

Write "Not applicable" when no frontend or UI behavior changed.
-->

## 🚦 Rollout plan

<!--
Describe any deployment order, migrations, configuration changes,
feature flags, cache invalidation, monitoring, or staged rollout.

Write "Standard merge and deploy" if no special rollout is required.
-->

## 📈 Monitoring and observability

<!--
Document signals to watch after deployment.

Examples:
- Authentication failure rate
- User settings validation errors
- Database query errors
- Discord command failure logs
- Cloudflare Worker exceptions

Write "Standard service monitoring" when no additional monitoring is needed.
-->

## 🔄 Follow-up work

<!--
List intentionally deferred work.

Examples:
- Add broader regression coverage for related edge cases.
- Remove temporary compatibility code after the next release.
- Add observability dashboard coverage.
- None.
-->

## 📝 Additional notes

<!--
Add reviewer guidance, known limitations, deployment warnings,
compatibility concerns, or links to related architecture notes.
-->
