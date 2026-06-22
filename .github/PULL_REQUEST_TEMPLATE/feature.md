<!--
.github/PULL_REQUEST_TEMPLATE/feature.md

PR title format:
feat(scope): concise description

Examples:
feat(core): add user consent contracts
feat(frontend): add account settings page
feat(discord): add ticket transcript exports
feat(infra): add centralized service observability
-->

# ✨ Feature

## 🚀 Summary

<!--
What capability does this pull request add or improve?

Keep this short and outcome-focused.

Examples:
- Add user profile visibility preferences.
- Add Discord ticket transcript exports.
- Add an account settings route to the frontend.
- Add a reusable API pagination contract.
-->

## 🔗 Linked issue

Closes #

<!--
Optional external reference:
AER-123
-->

## 🎯 Problem or opportunity

<!--
What problem does this feature solve?

Describe:
- Who experiences the problem
- What is difficult, missing, slow, unsafe, or confusing today
- Why this feature matters now
-->

## 💡 Proposed behavior

<!--
Describe the intended behavior from the user, developer, administrator,
or system perspective.

Useful details:
- User flows
- API behavior
- Service behavior
- Permissions
- State changes
- Error states
- Edge cases
-->

## 🧩 Affected Aerealith areas

<!-- Select every area affected by this feature. -->

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

## 🏗 Implementation details

<!--
Explain the implementation at a level useful to reviewers.

Consider including:
- New routes, APIs, contracts, schemas, entities, repositories, or services
- New package dependencies
- Data model or migration changes
- Configuration or environment variable changes
- Feature flags
- Background processing or event flows
- Permission and access-control behavior
- Important architectural tradeoffs
-->

## 🧪 Acceptance criteria

<!--
List observable conditions that prove this feature is complete.

Examples:
- [ ] Users can update their profile visibility preferences.
- [ ] Invalid settings return a typed validation error.
- [ ] Settings persist across sessions.
- [ ] Relevant API contracts are documented.
-->

- [ ]
- [ ]
- [ ]

## 🔐 Security and privacy review

<!--
Complete the applicable items below. Leave unchecked items that do not apply.
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
Describe database schema, entity, contract, migration, or state changes.

Write "None" when this feature does not affect persisted data.
-->

### Database or entity changes

<!--
Examples:
- Add a user notification preferences table.
- Add a nullable profile field.
- No persistent data changes.
-->

### Migration plan

<!--
Examples:
- Run the generated Drizzle migration before deploying the service.
- Existing records use safe defaults.
- No migration required.
-->

### Rollback plan

<!--
Explain how to safely revert the feature if needed.

Examples:
- Revert this pull request.
- Disable the feature flag.
- Roll back the migration only if no production records depend on it.
-->

## 🧱 API and contract changes

<!--
Document changed or new:
- REST routes
- tRPC procedures
- GraphQL operations
- WebSocket events
- Shared contracts
- Zod schemas
- Error codes
- Public types
- Environment variables
-->

## 🧷 Dependency impact

<!--
List new, upgraded, removed, or intentionally avoided dependencies.

Write "None" if no dependency changes are included.
-->

| Package | Change | Reason |
| ------- | ------ | ------ |
|         |        |        |

## 🧪 Validation performed

<!--
List commands you actually ran and summarize the result.

Examples:
pnpm nx test core
pnpm nx lint frontend
pnpm nx typecheck db
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
- Screen recordings for interactive flows
- API request and response examples for non-visual features

Write "Not applicable" when no frontend or UI behavior changed.
-->

## 🚦 Rollout plan

<!--
Describe any deployment order, feature flags, database migrations,
cache invalidation, configuration changes, monitoring, or staged rollout.

Write "Standard merge and deploy" if no special rollout is required.
-->

## 📈 Monitoring and observability

<!--
Document relevant:
- Logs
- Metrics
- Traces
- Alerts
- Dashboards
- Error codes
- User-impact signals

Write "Standard service monitoring" if no new monitoring is needed.
-->

## 🔄 Follow-up work

<!--
List any intentionally deferred work.

Examples:
- Add bulk settings management in a future PR.
- Add Discord dashboard controls after the service API stabilizes.
- Add migration tooling before production rollout.
- None.
-->

## 📝 Additional notes

<!--
Add anything reviewers need to know:
- Design decisions
- Tradeoffs
- Backward compatibility concerns
- Review focus areas
- Deployment warnings
- Links to related architecture or planning documents
-->
