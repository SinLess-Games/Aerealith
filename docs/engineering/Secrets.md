# Secrets

Status: Active
Implementation State: Mixed; active repository controls and planned runtime integrations
Current-State Source: [Current Architecture](../architecture/Current%20Architecture.md)
Owner: SinLess Games LLC
Last Updated: 2026-07-18
Document Type: Engineering Security Standard
Security Classification: Internal Engineering
Primary Environment Prefix: `AEREALITH_`

## Project Context

- [Project Overview](../Project-Overview.md)
- [Company and Project Structure](../Company-and-Project-Structure.md)
- [Current State](../CURRENT_STATE.md)
- [Engineering Documentation](./README.md)

## Purpose

This document defines the secret-handling standard for the Aerealith platform.
Aerealith AI is the assistant and intelligence layer within Aerealith; it follows
the same controls and receives no special exemption from them.

This standard governs how contributors and deployment systems identify,
generate, store, inject, access, rotate, revoke, test, and respond to exposure of
sensitive credentials.

The guiding rule is:

> A secret is supplied only to the smallest trusted runtime that needs it, is
> never committed or exposed to a client, and remains revocable without changing
> application source.

This document may name secret identifiers, storage mechanisms, and safe
placeholders. It must never contain a real secret value.

## Authority and Status

The rules in this document are active security requirements. The repository does
not yet implement every target storage provider or lifecycle tool described
below.

For current implementation questions, use this evidence order:

1. Executable source and deployment workflows.
2. Repository ignore rules and security automation.
3. [Current Architecture](../architecture/Current%20Architecture.md).
4. This document's explicit current-state table.
5. Draft target architecture and engineering examples.

A storage mechanism appearing in a draft architecture document does not prove
that Aerealith currently uses it.

## Current Repository Controls

| Control                                                           | Current evidence                                                                                                                               | State                                                          |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Local environment files are excluded from Git                     | [`.gitignore`](../../.gitignore) ignores `.env`, `.env.*`, `.dev.vars`, and `.dev.vars.*` while allowing placeholder examples.                 | Active                                                         |
| Secret material is excluded from container build context          | [`.dockerignore`](../../.dockerignore) excludes environment files, key and certificate formats, `secrets/`, and `credentials/`.                | Active                                                         |
| Committed content is scanned for likely secrets                   | [Gitleaks workflow](../../.github/workflows/07-gitleaks.yaml) scans trusted branches and internal pull requests and runs on a weekly schedule. | Active when the required Gitleaks license secret is configured |
| Forked pull requests do not receive privileged scanner secrets    | The Gitleaks workflow uses `pull_request`, not `pull_request_target`, and fails closed for external forks pending maintainer review.           | Active                                                         |
| Deployment credentials come from GitHub Actions secrets           | Cloudflare preview, staging, and production workflows consume scoped GitHub secrets and withhold them from external forks.                     | Active                                                         |
| Frontend Worker resources are declared as bindings                | [`wrangler.toml`](../../apps/frontend/wrangler.toml) declares asset, queue, KV, R2, feature-flag, and analytics bindings.                      | Active; these resource bindings are not secret values          |
| Product runtime secrets are uploaded by deployment workflows      | Preview deployment explicitly does not upload runtime Worker secrets, and no general product-secret upload path is implemented.                | Planned                                                        |
| A centralized application secret manager or inventory exists      | No repository-wide adapter, inventory, or rotation service is implemented.                                                                     | Planned                                                        |
| A local root secret-scan command exists                           | Gitleaks runs in GitHub Actions, but `package.json` does not currently expose a local secret-scan script.                                      | Planned                                                        |
| Managed Vault, External Secrets, or Kubernetes integration exists | These remain target deployment options in draft architecture and engineering documents.                                                        | Planned                                                        |

## Current Configuration Exceptions

The target naming standard uses `AEREALITH_` for Aerealith-owned server
configuration. Current source still includes transitional or tool-facing names:

- `DATABASE_URL` in the database configuration boundary and Drizzle tooling.
- `LIBRETRANSLATE_URL` and `LIBRETRANSLATE_API_KEY` in the translation tooling.
- Vendor and CI identifiers such as `CLOUDFLARE_API_TOKEN` and
  `GITLEAKS_LICENSE` where an external integration defines or already consumes
  the name.

These identifiers describe current repository behavior. Do not silently rename
them in documentation or deployment settings. A rename requires an implemented
migration, compatibility plan, tests, and coordinated secret update.

## What Counts as a Secret

A secret is any value that grants authority, proves identity, decrypts protected
material, signs trusted data, or enables access that should not be public.

Examples include:

- Passwords and password-equivalent values.
- Session, API, access, and refresh tokens.
- OAuth client secrets and provider credentials.
- Database connection strings containing credentials.
- Signing, encryption, recovery, and private keys.
- Webhook signing secrets.
- Deployment, registry, and observability credentials.
- AI provider keys used by Aerealith AI.
- Backup and restore credentials.

The following are usually configuration rather than secrets, provided they do
not embed credentials or private topology:

- Environment and service names.
- Public URLs.
- Feature availability flags.
- Timeouts, retry limits, and log levels.
- Public identifiers intended for browser use.

When classification is uncertain, handle the value as a secret until a security
review documents otherwise.

## Core Requirements

Every secret must be:

- Generated with an appropriate cryptographically secure mechanism.
- Owned by a named team, service, or responsible maintainer.
- Scoped to one purpose and the minimum required authority.
- Separated by environment.
- Stored outside source control.
- Injected only at runtime or through an approved ephemeral build secret mount.
- Validated without printing its value.
- Redacted from logs, errors, traces, screenshots, reports, and support material.
- Rotatable and revocable.
- Removed when the consumer or integration is retired.

A secret must not be shared merely because two services belong to Aerealith or
are operated under SinLess Industries.

## Secret Ownership Record

Before a production secret is created, its private inventory record should
identify:

```text
identifier
owner
purpose
consumer
provider or issuer
environment
scope
creation date
rotation expectation
revocation procedure
recovery or replacement dependency
```

The inventory stores metadata and a managed-store reference, not the raw secret.
It must not be placed in a public issue or repository document if its metadata
would expose sensitive infrastructure.

A repository-wide secret inventory is not implemented yet. Until it is,
ownership must be documented in the approved private secret store or deployment
environment that holds the value.

## Naming

Aerealith-owned server-side secret identifiers should use:

```text
AEREALITH_<DOMAIN>_<PURPOSE>
```

Illustrative target identifiers:

```text
AEREALITH_AUTH_SESSION_SIGNING_KEY
AEREALITH_DATABASE_URL
AEREALITH_DISCORD_CLIENT_SECRET
AEREALITH_AI_PROVIDER_API_KEY
AEREALITH_NOTIFICATIONS_EMAIL_API_KEY
AEREALITH_WEBHOOK_SIGNING_SECRET
```

These are naming examples, not proof that the corresponding integrations or
secret bindings are implemented.

Use a provider-required name when a vendor action, CLI, or tool contract requires
it. Keep provider names at adapter and deployment boundaries rather than leaking
them into shared platform contracts.

Secret names may appear in code, schemas, and documentation. Secret values may
not.

## Source Control and Examples

Never commit real secrets in:

- Source files or generated code.
- `.env` or `.dev.vars` files.
- Example configuration.
- Tests, snapshots, fixtures, or recordings.
- Markdown, issue text, or pull-request descriptions.
- Shell history or committed scripts.
- Terraform state or deployment output without approved protection.
- Container images, layers, labels, or build arguments.
- Browser bundles, source maps, or static assets.

Example files must use unmistakable inert placeholders, such as:

```dotenv
AEREALITH_EXAMPLE_API_KEY=replace-with-development-value
```

Do not use a token-shaped random string as a placeholder. Scanners and reviewers
must be able to distinguish examples from credentials without weakening general
detection rules.

An ignore rule is a defense against accidental staging, not permission to store
long-lived plaintext credentials carelessly.

## Local Development

Local development should use fake adapters and synthetic values by default.
External providers require separate development credentials with no production
authority.

Allowed local mechanisms include ignored `.env` files, ignored Cloudflare
`.dev.vars` files, operating-system credential stores, and approved local secret
managers. Use one documented mechanism per runtime; do not define the same secret
through competing sources with ambiguous precedence.

Local secrets must:

- Remain outside Git and container build context.
- Be readable only by the developer account where practical.
- Use development-only provider accounts and resources.
- Be revoked when a contributor no longer needs access.
- Never be copied into chat, screenshots, test output, or bug reports.

No committed `.env.example` or `.dev.vars.example` currently defines the
application's complete secret contract. Adding safe examples and validation is
planned work, not a prerequisite to invent secret names ad hoc.

## Continuous Integration

GitHub Actions secrets must be referenced through the `secrets` context and
exposed only to the step or job that needs them. Non-secret settings belong in
repository or environment variables.

Workflows must:

- Use least-privileged permissions.
- Avoid `pull_request_target` for execution of untrusted pull-request code.
- Withhold repository and environment secrets from external forks.
- Avoid echoing values or serializing the complete environment.
- Avoid uploading secret matches or raw scanner output as broadly accessible
  artifacts.
- Use protected GitHub environments for production credentials and approvals.
- Fail clearly when a required credential is absent.

The current Gitleaks workflow is the repository's implemented committed-secret
scan. A local equivalent and documented maintainer procedure for external forks
remain follow-up work.

## Runtime Injection

### Cloudflare

Sensitive Worker values should use Cloudflare secret bindings rather than plain
Wrangler `vars`. A secret belongs only to the Worker and environment that needs
it.

The current frontend deployment workflows use Cloudflare API credentials to
deploy the Worker. They do not upload general application runtime secrets.
Adding an application secret therefore requires an explicit storage,
provisioning, validation, and rotation design; adding a name to documentation is
not sufficient.

Do not pass a secret value as a command-line argument. Confirm the intended
Cloudflare account, Worker, and environment before changing a secret binding.

### Node.js and Tooling

Node.js services and tools may receive secrets through their environment or an
injected environment object. Access should be concentrated at a configuration
boundary and converted into a narrow typed configuration object.

Current database code already supports passing an environment object to its
configuration loader. Some tooling still reads `process.env` directly. Treat
those direct reads as current implementation constraints to migrate deliberately,
not as a pattern to spread.

### Containers and Orchestrators

Target container deployments should inject runtime secrets through approved
Docker, Kubernetes, External Secrets, Vault-compatible, or orchestrator
mechanisms. These integrations are not established by the current repository.

Required target properties are:

- No production secret in a Dockerfile, image layer, Compose file, or build
  argument.
- Read-only secret mounts where file injection is used.
- No secret mounted into an unrelated workload.
- Environment-specific service accounts and credentials.
- Encryption and access controls appropriate to the orchestrator.
- Rotation without rebuilding an otherwise unchanged image.

Kubernetes Secret values are encoded, not automatically protected merely because
they use the Secret resource type.

## Application Access

Application code should receive only the secret-derived capability it needs.
Prefer an adapter or configured client over passing raw credentials through many
layers.

Feature code must not:

- Return a secret through an API contract.
- Store a secret in Redux, browser storage, public caches, or client state.
- Include a secret in an event, audit payload, analytics property, or metric
  label.
- Compare or transform secrets in ways that expose timing or diagnostic detail.
- Include raw provider responses that may contain credentials in public errors.

Aerealith AI must not receive platform or provider secrets as model context.
Tool execution uses server-side adapters; the model receives only the minimum
non-secret result needed for the user-approved task.

## Logging, Errors, and Diagnostics

Logs and errors may include a secret identifier, provider, environment, and safe
failure code. They must not include the secret value or a reversible fragment.

Redaction must cover:

- Structured logs and exception metadata.
- Request and response headers.
- URLs and connection strings with embedded credentials.
- Trace attributes and baggage.
- CI job summaries and annotations.
- Health and diagnostics endpoints.
- Screenshots and support bundles.

Do not log a full environment object. Redaction is a backup control; the safer
design is never to pass secret material into telemetry code.

## Rotation and Revocation

A production secret needs a documented rotation and revocation path before the
consumer is considered production-ready.

A safe rotation normally includes:

1. Create a replacement with equal or narrower scope.
2. Store it in the correct environment and consumer boundary.
3. Support overlapping validity only when the provider and risk model allow it.
4. Deploy or reload the consumer without logging either value.
5. Verify the new credential through a safe health or capability check.
6. Revoke the old credential.
7. Confirm dependent systems no longer use it.
8. Record completion in the approved private operational system.

Emergency revocation takes priority over a routine overlap window.

## Suspected Exposure Response

Treat a detected real secret as compromised even if it appeared only briefly or
was removed from the latest commit.

Respond in this order:

1. Do not use, repeat, test, or paste the value elsewhere.
2. Report it privately through the process in
   [Security Policy](../../SECURITY.md).
3. Identify the owner, issuer, affected environments, and consumers without
   broadening disclosure.
4. Revoke or rotate the credential immediately.
5. Remove it from current source, artifacts, logs, caches, and deployment output.
6. Review access and provider logs for misuse.
7. Coordinate any history rewrite with maintainers after revocation; history
   removal does not replace rotation.
8. Add or improve prevention and regression controls without allowlisting a real
   credential.

Do not discuss a live credential in a public issue or pull request.

## Testing and Review

Secret-handling changes require tests and review proportional to their risk.
Relevant checks include:

- Missing required secret fails safely without printing it.
- Optional integration remains disabled or degraded when its secret is absent.
- Public API responses and browser bundles omit secret fields.
- Logs, traces, health output, and thrown errors remain redacted.
- Each runtime receives only its declared secret set.
- Forked pull requests cannot access repository or environment secrets.
- Rotation can move consumers to a replacement and revoke the old value.
- Secret scanners recognize fixtures as inert without broad allowlists.

Reviewers should verify both the value path and the authority path: where a
secret enters, where it can travel, what it permits, and how it is revoked.

## Prohibited Patterns

The following are prohibited:

- Committing a real credential and deleting it in a later commit.
- Sharing one production credential across unrelated services.
- Using production credentials for local development or tests.
- Supplying secrets through frontend-public environment prefixes.
- Baking secrets into artifacts or images.
- Passing secrets in command-line arguments when a protected input mechanism
  exists.
- Logging secret values for debugging.
- Treating base64 encoding as encryption.
- Adding broad scanner exclusions to silence an unexplained finding.
- Assuming a managed platform removes Aerealith's responsibility for scope,
  rotation, and incident response.

## Planned Implementation Sequence

The repository should close current gaps in this order:

1. Inventory current CI, deployment, database, translation, and provider secrets
   with owners and environments.
2. Define safe placeholder example files for implemented runtimes.
3. Centralize and validate application configuration at composition roots.
4. Add a documented local secret-scan command that matches CI behavior where
   licensing permits.
5. Define product runtime secret provisioning for Cloudflare before a feature
   requires it.
6. Add managed-store adapters only when Docker, Kubernetes, or self-hosted
   runtimes are implemented.
7. Add rotation runbooks, redaction tests, and exposure-response exercises for
   production credentials.

This sequence is target work. It does not claim those capabilities are already
available.

## Related Documentation

- [Environment Variables](./Environment%20Variables.md)
- [Local Development](./Local%20Development.md)
- [Cloudflare](./Cloudflare.md)
- [Docker](./Docker.md)
- [Testing](./Testing.md)
- [Code Style](./Code%20Style.md)
- [Security Architecture](../architecture/Security%20Architecture.md)
- [Current Architecture](../architecture/Current%20Architecture.md)
- [API Response Envelope Decision](../decisions/DEC-010-api-response-envelope.md)
- [Platform Providers Versus Integrations](../decisions/DEC-011-platform-providers-vs-integrations.md)
- [Security Policy](../../SECURITY.md)

## Final Standard

> Every Aerealith secret has a defined owner, purpose, environment, scope,
> storage boundary, consumer, rotation path, and revocation path; enters only the
> smallest trusted runtime that needs it; never enters source control, client
> code, model context, telemetry, or public output; and can be replaced without
> changing application source or weakening user control.
