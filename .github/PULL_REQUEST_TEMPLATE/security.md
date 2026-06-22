<!--
.github/PULL_REQUEST_TEMPLATE/security.md

PR title format:
security(scope): concise description

Examples:
security(auth): strengthen refresh token validation
security(api): prevent unauthorized resource access
security(infra): restrict deployment credential permissions
security(deps): patch vulnerable package versions

⚠️ Do not include secrets, credentials, tokens, private keys, exploit payloads,
private URLs, or sensitive vulnerability details in this pull request.
-->

# 🔐 Security Change

> [!IMPORTANT]
> Do not use this pull request template to publicly disclose an active or
> potentially exploitable vulnerability.
>
> Report confirmed or suspected vulnerabilities privately through GitHub
> Security Advisories before opening a public pull request:
>
> `https://github.com/SinLess-Games/Aerealith/security/advisories/new`

## 🛡️ Summary

<!--
Briefly explain the security improvement, hardening measure, remediation,
or risk reduction included in this pull request.

Examples:
- Strengthen refresh token validation and reuse detection.
- Restrict Cloudflare deployment credentials to required permissions.
- Add authorization checks to user profile update routes.
- Upgrade vulnerable dependencies and verify compatibility.
-->

## 🔗 Linked issue

Closes #

<!--
Optional external reference:
AER-123

Do not link to a public issue that exposes sensitive vulnerability details.
-->

## 🚨 Security concern addressed

<!--
Describe the risk at a safe, high level.

Include:
- What security property was missing or weak
- What area is affected
- Who or what could be impacted
- Why this change matters

Do not include:
- Exploit payloads
- Credentials
- Private endpoints
- Secret values
- Detailed attack instructions
-->

## 🎯 Security objective

<!--
Describe the intended security outcome.

Examples:
- Reject expired or reused refresh tokens.
- Enforce least-privilege deployment permissions.
- Prevent unauthorized users from modifying protected resources.
- Improve audit logging for sensitive actions.
-->

## 🧩 Affected Aerealith areas

<!-- Select every area affected by this change. -->

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
- [ ] Dependencies
- [ ] Other

## 🧠 Threat and impact review

### Threat category

<!-- Select every applicable category. -->

- [ ] Authentication weakness
- [ ] Authorization weakness
- [ ] Session or token handling
- [ ] Input validation
- [ ] Data exposure or privacy
- [ ] Dependency vulnerability
- [ ] Secret or credential handling
- [ ] CI/CD or supply-chain security
- [ ] Cloud or infrastructure configuration
- [ ] Logging or auditability
- [ ] Rate limiting or abuse prevention
- [ ] Discord permission or command security
- [ ] Other

### Potential impact

<!--
Describe the impact at a safe, high level.

Examples:
- Unauthorized account access
- Unauthorized data modification
- Exposure of non-sensitive metadata
- Increased abuse risk
- Deployment credential misuse
- Service availability impact
-->

### Affected environments

- [ ] Local development
- [ ] Preview
- [ ] Staging
- [ ] Production
- [ ] CI only
- [ ] Shared infrastructure
- [ ] No runtime environment impact

## 🛠️ Security implementation

<!--
Explain the remediation or hardening approach.

Useful details:
- Validation rules added or strengthened
- Permission checks introduced
- Token, session, or cookie changes
- Dependency updates
- Infrastructure configuration changes
- Secret-management changes
- Logging, audit, or monitoring improvements
- Rate limiting, retries, idempotency, or abuse protections
-->

## 🔐 Authentication and authorization review

<!--
Complete every applicable item.
-->

- [ ] Authentication flows were reviewed.
- [ ] Authorization and permission boundaries were reviewed.
- [ ] Resource ownership checks were reviewed.
- [ ] Session, token, cookie, or credential handling was reviewed.
- [ ] Sensitive actions require the correct permission level.
- [ ] Error responses do not disclose sensitive implementation details.
- [ ] Rate limiting, brute-force prevention, or abuse protections were considered.
- [ ] This change does not affect authentication or authorization behavior.

## 🗃 Data, privacy, and audit review

- [ ] Input validation was reviewed.
- [ ] Sensitive user data handling was reviewed.
- [ ] Consent, privacy, retention, or audit behavior was reviewed where applicable.
- [ ] Logs do not expose secrets, tokens, credentials, or sensitive user data.
- [ ] Database access and query boundaries were reviewed where applicable.
- [ ] Data migration requirements are documented below.
- [ ] This change does not affect persisted data or privacy behavior.

### Data or migration impact

<!--
Describe database, schema, entity, contract, migration, or audit-log impact.

Write "None" when no persistent data changes are included.
-->

## 📦 Dependency and supply-chain review

<!--
Complete this section when dependencies, package manager configuration,
containers, CI actions, or build tooling are affected.
-->

- [ ] Dependency release notes or changelogs were reviewed.
- [ ] Relevant security advisories or CVEs were reviewed.
- [ ] Transitive dependency changes were reviewed.
- [ ] GitHub Actions use pinned and trusted actions where practical.
- [ ] Docker base images or build dependencies were reviewed where applicable.
- [ ] No unnecessary package or tool was added.
- [ ] This change does not affect dependencies or supply-chain controls.

### Advisory references

<!--
Examples:
- CVE-YYYY-NNNNN
- GHSA-xxxx-xxxx-xxxx
- Dependabot alert number
- Internal security tracking reference

Write "None" when no published advisory applies.
-->

## ⚙️ Infrastructure and secrets review

<!--
Do not include actual secret values, private URLs, account identifiers,
or sensitive infrastructure details.
-->

- [ ] GitHub Actions permissions use the minimum required access.
- [ ] Cloudflare, Docker, CI, or infrastructure permissions were reviewed.
- [ ] Secrets are stored through approved secret-management systems.
- [ ] No secrets, credentials, tokens, private keys, or private URLs were committed.
- [ ] New environment variables, bindings, or configuration are documented below.
- [ ] Network exposure, ingress, routing, or firewall implications were reviewed.
- [ ] This change does not affect infrastructure or secrets management.

### Configuration changes

| Configuration      | Environment | Change                    | Purpose         | Secret   |
| ------------------ | ----------- | ------------------------- | --------------- | -------- |
| `EXAMPLE_VARIABLE` | production  | added / changed / removed | Explain purpose | yes / no |
|                    |             |                           |                 |          |

## 🧪 Security validation

<!--
List commands and checks you actually performed.

Examples:
pnpm nx test auth
pnpm nx test api
pnpm nx lint core
pnpm nx typecheck auth
pnpm audit
pnpm exec eslint .
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
- [ ] I tested the relevant unauthorized or invalid access paths.
- [ ] I tested expected valid behavior after applying the security change.
- [ ] I reviewed error responses for sensitive information disclosure.
- [ ] I reviewed logs, audit events, and observability behavior where applicable.
- [ ] I verified that the remediation addresses the documented security objective.

## 📈 Monitoring and detection

<!--
Document monitoring, logs, metrics, traces, dashboards, alerts, or audit
signals that should be watched after deployment.
-->

### Signals to monitor

- [ ] Authentication failure rate
- [ ] Authorization failure rate
- [ ] Token or session validation failures
- [ ] API validation errors
- [ ] Suspicious request patterns
- [ ] Rate limit events
- [ ] Database access errors
- [ ] Cloudflare Worker exceptions
- [ ] CI/CD failures
- [ ] Dependency or container scan results
- [ ] Audit-log events
- [ ] Other

### Alerting changes

<!--
Describe new, changed, or removed alerts.

Write "None" when no alerting changes are included.
-->

## 🚦 Deployment plan

<!--
Describe deployment order, migrations, configuration changes, feature flags,
cache invalidation, environment updates, and post-deployment validation.

Write "Standard merge and deploy" when no special rollout is needed.
-->

## ↩️ Rollback plan

<!--
Explain how to safely reverse this change if it causes unexpected behavior.

Examples:
- Revert this pull request and redeploy.
- Restore the previous permission configuration.
- Roll back a dependency version.
- Disable a feature flag.
-->

## 📸 Evidence

<!--
Attach safe evidence where useful:

- Sanitized test output
- CI workflow results
- Screenshots of non-sensitive UI behavior
- Before-and-after authorization behavior
- Monitoring dashboards with sensitive details removed

Do not attach secrets, exploit payloads, credentials, private logs,
or confidential infrastructure details.
-->

## 🔄 Follow-up work

<!--
List intentionally deferred work.

Examples:
- Add broader abuse-detection telemetry.
- Extend authorization coverage to related endpoints.
- Remove temporary compatibility behavior after rollout.
- None.
-->

## 📝 Additional notes

<!--
Add reviewer guidance, security-review focus areas, compatibility notes,
or links to private security tracking systems where access is restricted.
-->
