<!--
.github/PULL_REQUEST_TEMPLATE/release.md

Release pull requests must target: master

PR title format:
release: concise release description

Examples:
release: prepare Aerealith version 0.1.0
release: publish June platform update
release: prepare initial public beta
-->

# 🚀 Release Pull Request

> [!IMPORTANT]
> Release pull requests must target the `master` branch.
>
> This template is for preparing and validating a release. Do not use it for
> normal feature, fix, documentation, dependency, or infrastructure changes.

## 📦 Release summary

<!--
Briefly describe this release and the outcome it delivers.

Examples:
- Prepare Aerealith version 0.1.0 for the first public beta release.
- Publish the June platform update with user profile improvements and API fixes.
- Release a production-ready authentication and user-service foundation.
-->

## 🏷️ Release information

| Field                | Value    |
| -------------------- | -------- |
| Release version      | `v0.0.0` |
| Target branch        | `master` |
| Source branch        |          |
| Planned release date |          |
| Release owner        |          |
| Deployment owner     |          |
| Rollback owner       |          |

## 🔗 Related issues and pull requests

<!--
Optional for release pull requests.

Include relevant issues, milestones, epics, pull requests, release notes,
or external tracking references.

Examples:
- Closes #123
- Related to #456
- Includes #789, #790, and #791
- AER-123
-->

## ✨ Release contents

<!--
Summarize the customer-facing, developer-facing, operational, and security
changes included in this release.
-->

### New features

<!--
List meaningful new functionality.

Write "None" when no new features are included.
-->

- [ ]

### Bug fixes

<!--
List important bug fixes.

Write "None" when no bug fixes are included.
-->

- [ ]

### Security improvements

<!--
List security fixes, hardening work, dependency patches, or policy changes.

Do not include sensitive exploit details, secrets, credentials, tokens,
private URLs, or confidential operational information.

Write "None" when no security changes are included.
-->

- [ ]

### Performance improvements

<!--
List measurable performance, reliability, caching, query, or runtime changes.

Write "None" when no performance changes are included.
-->

- [ ]

### Infrastructure and operational changes

<!--
List relevant deployment, Cloudflare, Docker, CI/CD, observability,
environment, or configuration changes.

Write "None" when no infrastructure changes are included.
-->

- [ ]

### Dependency updates

<!--
List important package upgrades, removals, security patches, or lockfile changes.

Write "None" when no dependency changes are included.
-->

- [ ]

### Documentation changes

<!--
List updated guides, API references, contributor documentation, release notes,
or user-facing documentation.

Write "None" when no documentation changes are included.
-->

- [ ]

## ⚠️ Breaking changes

<!--
Document every breaking change clearly.

Include:
- Changed or removed API endpoints
- Updated contracts, schemas, or error codes
- Renamed configuration values or environment variables
- Removed package exports
- Changed authentication, authorization, or permission behavior
- Required client, service, or deployment changes

Write "None" when there are no breaking changes.
-->

## 🔄 Upgrade and migration guidance

<!--
Explain exactly what existing users, services, contributors, or operators
must do before or after deployment.

Include:
- Database migrations
- Environment variable changes
- Cloudflare bindings or secrets
- Docker image updates
- Configuration changes
- Cache invalidation
- Service deployment order
- Client migration steps
- Feature flag changes

Write "No manual migration required" when applicable.
-->

### Database migration plan

<!--
Describe required database migrations and deployment order.

Examples:
1. Run the generated Drizzle migrations.
2. Deploy backend services.
3. Deploy frontend application.
4. Enable the feature flag after validation.

Write "No database migration required" when applicable.
-->

### Configuration and environment changes

| Configuration      | Environment | Change                    | Required before release | Secret   |
| ------------------ | ----------- | ------------------------- | ----------------------- | -------- |
| `EXAMPLE_VARIABLE` | production  | added / changed / removed | yes / no                | yes / no |
|                    |             |                           |                         |          |

<!--
Do not include actual secret values.
-->

## 🧪 Release validation

<!--
List the commands, workflows, deployments, smoke tests, and manual checks
actually performed for this release.
-->

```sh
# Commands run:
```

### Required validation checklist

- [ ] I added or updated tests, or documented why tests are not applicable.
- [ ] I ran the relevant typecheck, lint, and test commands.
- [ ] I updated documentation, or confirmed no documentation changes are needed.
- [ ] I did not add secrets, credentials, tokens, or private data.
- [ ] I attached screenshots or a recording for frontend or UI changes.
- [ ] All required CI workflows completed successfully.
- [ ] Production build artifacts were created successfully.
- [ ] Relevant end-to-end tests completed successfully.
- [ ] Relevant API, service, and integration tests completed successfully.
- [ ] Relevant database migration checks completed successfully.
- [ ] Relevant frontend and UI workflows were manually verified.
- [ ] Relevant authentication and authorization flows were manually verified.
- [ ] Relevant error handling and recovery paths were manually verified.
- [ ] Relevant deployment, rollback, and environment configuration steps were reviewed.

## 🧭 Environment readiness

### Local development

- [ ] Local setup remains functional.
- [ ] Local environment variable changes are documented.
- [ ] Local database or migration changes are documented.

### Preview

- [ ] Preview deployment completed successfully.
- [ ] Preview environment behavior was verified.
- [ ] Preview-only configuration differences were reviewed.

### Staging

- [ ] Staging deployment completed successfully.
- [ ] Staging smoke tests completed successfully.
- [ ] Staging data migration behavior was verified where applicable.
- [ ] Staging logs, metrics, and traces were reviewed.

### Production

- [ ] Production configuration is ready.
- [ ] Required secrets, bindings, and environment variables are configured.
- [ ] Required migrations are ready to run.
- [ ] Deployment ownership is assigned.
- [ ] Rollback ownership is assigned.
- [ ] Post-deployment monitoring is ready.

## 🔐 Security and privacy release review

- [ ] Security-sensitive changes were reviewed.
- [ ] Authentication behavior was reviewed where applicable.
- [ ] Authorization and permission boundaries were reviewed where applicable.
- [ ] Input validation and error handling were reviewed.
- [ ] Sensitive user data handling was reviewed.
- [ ] Consent, privacy, retention, and audit behavior were reviewed where applicable.
- [ ] Dependency security advisories were reviewed.
- [ ] No secrets, credentials, tokens, private keys, or private URLs were committed.
- [ ] Security disclosures or advisories are handled through the proper private process.

## 📈 Monitoring and observability

<!--
Document the signals that must be watched during and after deployment.
-->

### Signals to monitor

- [ ] Deployment success and failure status
- [ ] Service health checks
- [ ] Error rate
- [ ] Request latency
- [ ] Authentication failures
- [ ] Authorization failures
- [ ] Database errors
- [ ] Database migration errors
- [ ] Cloudflare Worker exceptions
- [ ] Frontend client errors
- [ ] CI/CD failures
- [ ] Nx Cloud cache behavior
- [ ] Docker or container health
- [ ] Queue depth or background job failures
- [ ] Other

### Dashboards, alerts, and logs

<!--
Include dashboard links, alert names, log queries, trace filters, or
operational notes.

Remove or avoid private URLs and sensitive operational details.
-->

## 📸 Release evidence

<!--
Attach relevant evidence:

- CI workflow results
- Preview or staging screenshots
- Frontend before-and-after screenshots
- Release build output
- Deployment confirmation
- Health check output
- Monitoring dashboard screenshots
- Smoke test evidence

Write "Not applicable" only when visual or deployment evidence is not needed.
-->

## 🚦 Deployment plan

<!--
Describe the exact production deployment sequence.
-->

1.
2.
3.
4.

### Post-deployment smoke tests

<!--
List the highest-priority checks to run immediately after deployment.

Examples:
- Open the production homepage and verify page rendering.
- Verify sign-up, login, logout, and refresh-token flows.
- Verify API health and service readiness endpoints.
- Verify database migrations completed successfully.
- Verify Cloudflare Worker bindings are healthy.
-->

1.
2.
3.

## ↩️ Rollback plan

<!--
Explain how to safely reverse this release if it causes production issues.

Include:
- Who decides to roll back
- How to restore the prior deployment
- How to restore configuration
- Database migration rollback constraints
- Feature flags that can be disabled
- Verification steps after rollback
-->

### Rollback trigger conditions

<!--
Examples:
- Sustained elevated error rate.
- Authentication failure spike.
- Critical user workflow failure.
- Database migration failure.
- Deployment health check failure.
-->

### Rollback steps

1.
2.
3.

### Rollback validation

- [ ] Previous deployment was restored successfully.
- [ ] Critical user workflows were rechecked.
- [ ] Health checks returned to normal.
- [ ] Errors, logs, and alerts were reviewed.
- [ ] Incident notes were recorded where applicable.

## 📝 Release notes

<!--
Draft the user-facing or contributor-facing release notes here.

Include:
- Highlights
- Important fixes
- Breaking changes
- Upgrade instructions
- Known limitations
- Deprecations
- Security notices when appropriate
-->

## 🐛 Known issues and limitations

<!--
List known issues that are intentionally shipping with this release.

Include workarounds, impact, and linked issues when available.

Write "None known" when applicable.
-->

## 🔄 Follow-up work

<!--
List intentionally deferred work after release.

Examples:
- Add additional telemetry after production validation.
- Remove temporary compatibility code in the next release.
- Expand end-to-end coverage for new workflows.
- None.
-->

## ✅ Final release approval

- [ ] Release scope was reviewed.
- [ ] Breaking changes were reviewed and documented.
- [ ] Migration requirements were reviewed.
- [ ] Security and privacy considerations were reviewed.
- [ ] Validation evidence is complete.
- [ ] Deployment and rollback plans are complete.
- [ ] Release notes are complete.
- [ ] This release is ready to merge into `master`.
