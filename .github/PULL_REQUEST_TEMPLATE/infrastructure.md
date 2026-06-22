<!--
.github/PULL_REQUEST_TEMPLATE/infrastructure.md

PR title format:
build(scope): concise description
ci(scope): concise description
feat(infra): concise description
fix(infra): concise description
security(infra): concise description

Examples:
build(docker): add service container health checks
ci(cloudflare): validate preview deployments
feat(infra): configure centralized observability
fix(nx-cloud): restore remote cache authentication
security(infra): restrict deployment credential access
-->

# 🏗️ Infrastructure Change

## ✨ Summary

<!--
Briefly explain what infrastructure, deployment, CI/CD, platform, or
operational capability this pull request changes.

Examples:
- Add Docker health checks for service containers.
- Configure Cloudflare preview deployment validation.
- Add Grafana observability for API service errors.
- Update Nx Cloud remote caching configuration.
-->

## 🔗 Linked issue

Closes #

<!--
Optional external reference:
AER-123
-->

## 🎯 Problem or opportunity

<!--
Describe the operational problem, risk, bottleneck, reliability concern,
security concern, deployment limitation, or maintenance need this change addresses.
-->

## 🧩 Affected systems

<!-- Select every system affected by this pull request. -->

- [ ] Cloudflare Workers
- [ ] Cloudflare Pages
- [ ] Cloudflare DNS or domains
- [ ] Cloudflare secrets or bindings
- [ ] Docker images
- [ ] Docker Compose
- [ ] Kubernetes
- [ ] GitHub Actions
- [ ] Nx Cloud
- [ ] CI/CD pipelines
- [ ] Environment configuration
- [ ] Secrets management
- [ ] Database connectivity or migrations
- [ ] Monitoring, logging, or tracing
- [ ] Alerting or incident response
- [ ] Networking, routing, or gateways
- [ ] Build tooling
- [ ] Package manager or workspace tooling
- [ ] Other

## 🌍 Affected environments

<!-- Select every environment affected by this change. -->

- [ ] Local development
- [ ] Preview
- [ ] Staging
- [ ] Production
- [ ] CI only
- [ ] Shared infrastructure
- [ ] No runtime environment impact

## 🛠 Implementation details

<!--
Explain the infrastructure change in enough detail for reviewers to understand:

- Configuration files changed
- New or updated workflows
- New environment variables or bindings
- New Docker images, services, volumes, or networks
- Changes to CI triggers, permissions, caching, or artifacts
- Deployment behavior
- Monitoring, logging, tracing, dashboards, or alerts
- Access-control and secrets handling
- Architecture decisions and tradeoffs
-->

## 🔐 Security review

<!--
Do not include actual credentials, secret values, tokens, private URLs,
or sensitive infrastructure details in this pull request body.
-->

- [ ] GitHub Actions permissions use the minimum required access.
- [ ] Secrets are referenced through GitHub, Cloudflare, or another approved secret manager.
- [ ] No secrets, credentials, tokens, private keys, or private URLs were committed.
- [ ] Deployment credentials and environment access were reviewed.
- [ ] Network exposure, ingress, routing, and firewall implications were reviewed.
- [ ] Authentication and authorization boundaries were reviewed where applicable.
- [ ] Supply-chain and dependency changes were reviewed where applicable.
- [ ] This change does not affect security-sensitive infrastructure.

## ⚙️ Configuration changes

<!--
Document changed configuration, bindings, environment variables, secrets,
feature flags, deployment settings, workflow inputs, or runtime parameters.

Do not include secret values.
-->

| Configuration      | Environment | Change                    | Purpose         | Secret   |
| ------------------ | ----------- | ------------------------- | --------------- | -------- |
| `EXAMPLE_VARIABLE` | staging     | added / changed / removed | Explain purpose | yes / no |
|                    |             |                           |                 |          |

## 🐳 Container and runtime impact

<!--
Document Docker, Kubernetes, Worker runtime, process, memory, CPU, storage,
network, health check, or scaling changes.

Write "None" when this pull request does not affect runtime infrastructure.
-->

### Runtime changes

<!--
Examples:
- Add a health check to the user service container.
- Increase Worker compatibility flags.
- Add a Kubernetes resource limit.
- No runtime changes.
-->

### Resource impact

<!--
Describe expected CPU, memory, storage, bandwidth, queue, or cache effects.

Write "No material impact expected" when appropriate.
-->

## 🗃 Database and migration impact

<!--
Describe schema migrations, connection changes, backup requirements,
migration order, compatibility concerns, or rollback behavior.

Write "None" when the change does not affect databases.
-->

### Migration plan

<!--
Examples:
- Run migrations before deploying the application.
- Deploy application code before enabling the new binding.
- No database migration required.
-->

### Data safety considerations

<!--
Examples:
- Confirm backup exists before migration.
- Migration is additive and backward compatible.
- No persistent data impact.
-->

## 🚦 Deployment plan

<!--
Describe the intended rollout sequence.

Include:
- Required order of deployment
- Environment progression
- Required approvals
- Feature flags
- Cache invalidation
- Required manual steps
- Validation after deployment
-->

### Deployment sequence

1.
2.
3.

### Post-deployment validation

<!--
Examples:
- Confirm health endpoint returns 200.
- Confirm Cloudflare Worker deployment completed.
- Confirm CI cache hit rate is normal.
- Confirm dashboards and logs show no new errors.
-->

## ↩️ Rollback plan

<!--
Explain how to safely reverse this change if deployment causes failures.

Examples:
- Revert this pull request and redeploy.
- Restore the previous environment configuration.
- Redeploy the previous Docker image tag.
- Disable the new feature flag or binding.
-->

## 📈 Monitoring and observability

<!--
Document logs, metrics, traces, dashboards, alerts, or operational signals
that should be reviewed after deployment.
-->

### Signals to monitor

- [ ] Deployment success or failure status
- [ ] Service health checks
- [ ] Error rate
- [ ] Request latency
- [ ] CPU or memory utilization
- [ ] Database connection errors
- [ ] Cache hit rate
- [ ] Queue depth or background job failures
- [ ] Cloudflare Worker exceptions
- [ ] GitHub Actions failures
- [ ] Nx Cloud cache behavior
- [ ] Other

### Alerting changes

<!--
Describe new, changed, or removed alerts.

Write "None" when no alerting changes are included.
-->

## 🧪 Validation performed

<!--
List the commands, workflows, environments, and manual checks you actually ran.

Examples:
pnpm install --frozen-lockfile
pnpm nx run-many -t lint
pnpm nx run-many -t test
pnpm nx run-many -t typecheck
docker compose config
docker build -t aerealith-service .
wrangler deploy --dry-run
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
- [ ] I validated the changed configuration syntax.
- [ ] I validated affected CI workflows or deployment commands.
- [ ] I verified the rollback plan is practical.
- [ ] I reviewed relevant logs, metrics, traces, or dashboards.
- [ ] I confirmed affected environments are documented above.

## 📸 Screenshots, logs, or deployment evidence

<!--
Attach relevant evidence where useful:

- GitHub Actions run links
- Deployment output
- Cloudflare dashboard screenshots
- Docker logs
- Health check output
- Monitoring dashboard screenshots
- Before/after infrastructure diagrams

Remove sensitive information before attaching.
-->

## 🔄 Follow-up work

<!--
List intentionally deferred work.

Examples:
- Add production alert after staging validation.
- Migrate remaining services to the new Docker base image.
- Add dashboard panel for cache metrics.
- None.
-->

## 📝 Additional notes

<!--
Add reviewer guidance, operational caveats, compatibility notes,
maintenance instructions, or links to architecture documents.
-->
