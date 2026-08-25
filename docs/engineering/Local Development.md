# Local Development

Status: Draft
Implementation State: Draft standard; examples may describe target configuration
Current-State Source: [Current Architecture](../architecture/Current%20Architecture.md)
Owner: SinLess Games LLC
Last Updated: 2026-07-18
Security Classification: Internal Engineering
Primary Audience: Aerealith contributors and maintainers

Related RFCs:

- `docs/rfcs/0002-monorepo-library-boundaries.md`
- `docs/rfcs/0003-api-versioning-and-route-strategy.md`
- `docs/rfcs/0004-error-and-result-model.md`
- `docs/rfcs/0005-entity-schema-and-contract-strategy.md`
- `docs/rfcs/0008-configuration-and-secrets-model.md`
- `docs/rfcs/0009-authentication-session-and-authorization-model.md`
- `docs/rfcs/0010-api-envelope-request-and-trace-id-propagation.md`
- `docs/rfcs/0011-event-envelope-audit-model-and-idempotency.md`
- `docs/rfcs/0012-workflow-records-and-approval-primitive.md`
- `docs/rfcs/0013-provider-abstraction-and-integration-interface.md`
- `docs/rfcs/0014-module-registry-manifest-and-lifecycle.md`
- `docs/rfcs/0015-discord-permission-role-hierarchy-and-action-safety.md`
- `docs/rfcs/0016-ai-assistant-boundaries-and-mvp-memory-scope.md`
- `docs/rfcs/0017-observability-trace-propagation-and-alerting.md`

Related Architecture:

- `docs/architecture/Monorepo Architecture.md`
- `docs/architecture/Frontend Architecture.md`
- `docs/architecture/API Architecture.md`
- `docs/architecture/Service Architecture.md`
- `docs/architecture/Data Architecture.md`
- `docs/architecture/Auth Architecture.md`
- `docs/architecture/Security Architecture.md`
- `docs/architecture/Discord Architecture.md`
- `docs/architecture/Module Architecture.md`
- `docs/architecture/Workflow Architecture.md`
- `docs/architecture/AI Architecture.md`
- `docs/architecture/Integration Architecture.md`
- `docs/architecture/Notification Architecture.md`
- `docs/architecture/Audit Architecture.md`
- `docs/architecture/Observability Architecture.md`

---

## Purpose

This document defines the local development architecture and contributor workflow for the Aerealith platform.

It governs how contributors:

```text
prepare a workstation
install the required toolchain
bootstrap the monorepo
start local services
manage local configuration
manage development secrets
run the frontend and API
run persistent integrations
run workers and scheduled jobs
run database migrations
seed deterministic data
run tests and quality gates
debug services and workers
inspect local telemetry
simulate provider failures
validate PostgreSQL and CockroachDB compatibility
work without production credentials
match continuous-integration behavior
clean and recover a broken environment
```

The objective is to make local development:

```text
predictable
repeatable
secure by default
fast for ordinary work
complete when deeper integration testing is required
close to production without pretending to be production
portable across supported environments
observable
recoverable
friendly to automation
```

The guiding rule is:

> A new contributor should be able to clone the repository, run one documented bootstrap command, start the appropriate development profile, and understand exactly which services, credentials, data, adapters, and external providers are active.

Local development must never require production data or production credentials.

---

## Architecture Summary

Aerealith uses an Nx TypeScript monorepo managed with pnpm and Node.js 24.x.

The local development environment combines:

```text
host-installed development tools
pnpm-managed JavaScript dependencies
Nx task orchestration
Docker Compose for disposable stateful infrastructure
Wrangler for Cloudflare-compatible request runtimes
Node.js processes for persistent integrations and workers
PostgreSQL as the default local relational database
CockroachDB as a compatibility test target
Drizzle for schema and migration management
fake provider adapters by default
optional real-provider development connections
OpenTelemetry-compatible local telemetry
```

The recommended development shape is:

```text
Host
├── VS Code or compatible editor
├── Node.js 24.x
├── Corepack
├── pnpm
├── Nx through the workspace
├── Wrangler through the workspace
├── frontend process
├── API process
├── optional workers
└── optional integration runtimes

Docker Compose
├── PostgreSQL
├── optional CockroachDB
├── optional OpenTelemetry Collector
├── optional local observability stack
├── optional mail testing service
└── optional supporting test services
```

The default local environment should remain useful without:

```text
Discord credentials
AI provider credentials
Resend credentials
Cloudinary credentials
Datadog credentials
Grafana Cloud credentials
production Cloudflare access
production databases
production queues
```

Provider-backed capabilities should use deterministic fake adapters until a contributor explicitly enables a development provider.

---

## Local Development Goals

The local development architecture should provide:

```text
one documented toolchain
one package manager
one committed lockfile
one repository bootstrap path
clear development profiles
fast incremental startup
reproducible database setup
safe local secrets
provider fakes
production-compatible contracts
CI parity
deterministic tests
visible logs and traces
clear failure messages
simple cleanup and recovery
```

---

## Non-Goals

The local environment does not need to reproduce every production characteristic.

Ordinary local development does not require:

```text
a local Kubernetes cluster
production-scale data
production provider credentials
production traffic volume
production DDoS controls
production certificate infrastructure
full multi-region behavior
all observability vendors running simultaneously
one container per logical service
all future integrations enabled
```

Kubernetes, real provider sandboxes, local model inference, and full observability stacks are specialized profiles rather than mandatory daily dependencies.

---

## Core Principles

Aerealith local development follows these principles:

```text
Bootstrap should be automated.
Defaults should be safe.
Production credentials are forbidden locally.
Production user data is forbidden locally.
Fake providers are the default.
Real providers are explicit opt-in.
Configuration is validated at startup.
Secrets are never committed.
One service should not require the entire platform to run.
Local infrastructure should be disposable.
Database migrations should be reproducible.
Seed data should be deterministic.
Every important runtime should expose health.
Every request should carry request and trace IDs.
Local failures should be easy to inspect.
CI commands should also work locally.
Security controls remain active locally.
```

---

## Supported Development Platforms

### Primary Platform

The primary supported local development platform is:

```text
Ubuntu 24.04 LTS or a compatible modern Linux distribution
```

This is the reference environment for:

```text
repository scripts
Docker behavior
shell tooling
Node.js runtime behavior
filesystem behavior
container networking
local service startup
```

### Secondary Platforms

Secondary supported environments may include:

```text
macOS on an actively supported release
Windows through WSL2 with Ubuntu
```

Native Windows development is best-effort unless explicitly included in a release requirement.

### Shell

Recommended shells:

```text
zsh
bash
```

Repository scripts must not depend on personal aliases, shell themes, interactive prompts, or machine-specific paths.

Cross-platform automation should prefer:

```text
Node.js scripts
Nx executors
portable shell commands
```

---

## Required Host Resources

Recommended workstation resources:

| Resource  |                   Minimum |             Recommended |
| --------- | ------------------------: | ----------------------: |
| CPU       |           4 logical cores | 8 or more logical cores |
| Memory    |                     16 GB |           32 GB or more |
| Free disk |                     20 GB |           50 GB or more |
| Network   | Required for installation |        Stable broadband |

The full profile containing CockroachDB and local observability may require significantly more memory and disk.

A GPU is not required for the MVP development environment.

Future local-model development should use a separate GPU-enabled profile.

---

## Required Toolchain

The required baseline toolchain is:

```text
Git
Node.js 24.x
Corepack
pnpm
Docker Engine or Docker Desktop
Docker Compose v2
```

Recommended tools:

```text
VS Code
GitHub CLI
jq
curl
OpenSSL
make
```

Optional specialized tools:

```text
kubectl
Helm
Minikube or Kind
Cloudflare Wrangler authentication
Discord development application
provider-specific command-line tools
```

The repository should verify required versions during bootstrap.

---

## Version Management

The repository should declare the supported Node.js version through:

```text
.node-version
.nvmrc
package.json engines
```

The canonical runtime requirement is:

```text
Node.js 24.x
```

The package manager version should be pinned in `package.json`.

```json
{
  "packageManager": "pnpm@<pinned-version>",
  "engines": {
    "node": ">=24 <25"
  }
}
```

Contributors should enable Corepack:

```bash
corepack enable
```

Repository scripts should fail early when unsupported Node.js or pnpm versions are detected.

Example failure:

```text
DEV_TOOLCHAIN_UNSUPPORTED

Aerealith requires Node.js 24.x.
Detected Node.js 22.14.0.
```

---

## Package Management

Aerealith uses:

```text
pnpm
```

Repository rules:

```text
Commit pnpm-lock.yaml.
Do not commit package-lock.json.
Do not commit yarn.lock.
Do not install with npm or Yarn.
Use frozen lockfile installs in CI.
Review unexpected lockfile changes.
Declare dependencies in the owning project.
```

Common commands:

```bash
pnpm install
pnpm install --frozen-lockfile
pnpm add <package> --filter <project>
pnpm add -D <package> --filter <project>
pnpm remove <package> --filter <project>
pnpm update --interactive
```

Dependency updates should remain compatible with:

```text
Renovate
Dependabot
Snyk
GitHub dependency review
```

---

## Monorepo Shape

The expected high-level repository shape is:

```text
.
├── apps/
│   ├── frontend/
│   ├── services/
│   │   ├── api/
│   │   ├── workers/
│   │   └── scheduled/
│   └── integrations/
│       └── discord/
├── libs/
│   ├── api/
│   ├── content/
│   ├── contracts/
│   ├── core/
│   ├── db/
│   ├── flags/
│   ├── observability/
│   ├── ui/
│   └── utils/
├── tools/
│   ├── generators/
│   └── scripts/
├── docs/
├── docker/
├── compose.yaml
├── nx.json
├── package.json
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

The exact layout may evolve through accepted RFCs.

Local scripts should operate through Nx project metadata rather than hardcoded assumptions wherever practical.

---

## Nx Task Orchestration

Nx is the primary task orchestrator.

Nx should coordinate:

```text
serve
build
lint
typecheck
test
coverage
database generation
migration validation
contract generation
container builds
affected-project checks
```

Examples:

```bash
pnpm nx graph
pnpm nx show projects
pnpm nx serve frontend
pnpm nx serve api
pnpm nx test core
pnpm nx lint discord
pnpm nx affected -t lint,typecheck,test
```

Root package scripts should provide stable entry points for common workflows.

Example:

```json
{
  "scripts": {
    "bootstrap": "node tools/scripts/bootstrap.mjs",
    "dev": "nx run-many -t serve --projects=frontend,api --parallel",
    "dev:integration": "node tools/scripts/dev-integration.mjs",
    "dev:full": "node tools/scripts/dev-full.mjs",
    "lint": "nx run-many -t lint",
    "typecheck": "nx run-many -t typecheck",
    "test": "nx run-many -t test",
    "test:coverage": "nx run-many -t test:coverage",
    "validate": "node tools/scripts/validate-workspace.mjs"
  }
}
```

---

## Development Profiles

Aerealith should provide several development profiles.

The contributor should start only the profile required for the current task.

---

## Minimal Profile

Purpose:

```text
ordinary frontend work
ordinary API work
domain development
contract development
local authentication
database development
```

Includes:

```text
frontend
API
PostgreSQL
fake AI adapter
fake email adapter
fake integration adapters
in-app notifications
console telemetry
```

Excludes by default:

```text
Discord runtime
real email
real AI provider
CockroachDB
full observability stack
Kubernetes
```

Recommended command:

```bash
pnpm dev
```

---

## Integration Profile

Purpose:

```text
Discord development
provider callback testing
module integration
workflow integration
notification delivery testing
```

Includes:

```text
frontend
API
PostgreSQL
Discord runtime
workers
local queue implementation
fake providers
optional development Discord application
```

Recommended command:

```bash
pnpm dev:integration
```

---

## Full Profile

Purpose:

```text
cross-service integration testing
observability development
CockroachDB compatibility
release-candidate validation
failure simulation
```

Includes:

```text
frontend
API
workers
scheduled workers
Discord runtime
PostgreSQL
CockroachDB compatibility target
OpenTelemetry Collector
optional local Grafana-compatible stack
all fake adapters
```

Recommended command:

```bash
pnpm dev:full
```

---

## Specialized Profiles

Potential specialized profiles:

```text
dev:discord
dev:observability
dev:cockroach
dev:kubernetes
dev:ai-real
dev:email-real
dev:container
```

Specialized profiles must be:

```text
opt-in
documented
environment-isolated
safe by default
```

---

## Development Profile Matrix

| Capability          | Minimal  | Integration | Full        |
| ------------------- | -------- | ----------- | ----------- |
| Frontend            | Yes      | Yes         | Yes         |
| API                 | Yes      | Yes         | Yes         |
| PostgreSQL          | Yes      | Yes         | Yes         |
| Discord Runtime     | No       | Yes         | Yes         |
| Workflow Workers    | Optional | Yes         | Yes         |
| Scheduled Workers   | No       | Optional    | Yes         |
| Fake AI             | Yes      | Yes         | Yes         |
| Real AI Provider    | Opt-in   | Opt-in      | Opt-in      |
| Fake Email          | Yes      | Yes         | Yes         |
| Real Resend         | No       | Opt-in      | Opt-in      |
| CockroachDB         | No       | Optional    | Yes         |
| OTel Collector      | Optional | Optional    | Yes         |
| Local Grafana Stack | No       | Optional    | Optional    |
| Kubernetes          | No       | No          | Specialized |

---

## Bootstrap Flow

The repository should provide one primary bootstrap command.

```bash
pnpm bootstrap
```

The bootstrap process should:

```text
verify Node.js
verify pnpm
verify Git
verify Docker
verify Docker Compose
install dependencies
create missing local configuration
generate safe local secrets
start core infrastructure
wait for database readiness
apply migrations
seed deterministic data
validate contracts
run lightweight health checks
print next-step commands
```

Bootstrap should be idempotent.

Running it again should repair missing prerequisites without destroying valid local work.

---

## Bootstrap Flow Diagram

```mermaid
flowchart TD
  Clone["Clone Repository"]
  Verify["Verify Toolchain"]
  Install["Install Dependencies"]
  Configure["Create Local Configuration"]
  Secrets["Generate Local Secrets"]
  Infra["Start Core Infrastructure"]
  Migrate["Apply Migrations"]
  Seed["Seed Local Data"]
  Validate["Validate Workspace"]
  Health["Run Health Checks"]
  Ready["Ready for Development"]

  Clone --> Verify
  Verify --> Install
  Install --> Configure
  Configure --> Secrets
  Secrets --> Infra
  Infra --> Migrate
  Migrate --> Seed
  Seed --> Validate
  Validate --> Health
  Health --> Ready
```

---

## First-Time Setup

Recommended first-time flow:

```bash
git clone <repository-url>
cd aerealith
corepack enable
pnpm bootstrap
pnpm dev
```

The bootstrap command should print local URLs and active adapters.

Example:

```text
Aerealith local environment is ready.

Frontend:           http://localhost:3000
API:                http://localhost:8787
PostgreSQL:         localhost:5432
Database:           aerealith_local
AI adapter:         fake
Email adapter:      fake
Discord adapter:    disabled
Telemetry exporter: console
```

---

## Local Port Conventions

Proposed default ports:

| Service                 |    Port | Notes                           |
| ----------------------- | ------: | ------------------------------- |
| Frontend                |  `3000` | Primary browser application.    |
| API Worker              |  `8787` | Wrangler-compatible API.        |
| Discord Runtime Health  |  `4001` | Health and diagnostics only.    |
| Worker Health           |  `4002` | Background worker diagnostics.  |
| Scheduled Worker Health |  `4003` | Scheduled runtime diagnostics.  |
| PostgreSQL              |  `5432` | Default local database.         |
| CockroachDB SQL         | `26257` | Compatibility profile.          |
| CockroachDB Admin UI    |  `8080` | Development only.               |
| OpenTelemetry gRPC      |  `4317` | Local collector.                |
| OpenTelemetry HTTP      |  `4318` | Local collector.                |
| Local Grafana           |  `3001` | Optional observability profile. |
| Local Loki              |  `3100` | Optional observability profile. |
| Local Tempo             |  `3200` | Optional observability profile. |
| Mail Test UI            |  `8025` | Optional local mail sink.       |

Ports should be configurable through validated local configuration.

---

## Local Hostnames

Ordinary development should use:

```text
localhost
```

Optional local routing may use:

```text
aerealith.localhost
api.aerealith.localhost
```

Custom local domains should not require editing `/etc/hosts` unless a specialized profile documents the requirement.

---

## Configuration Architecture

Configuration should be centralized and runtime-validated.

The repository should distinguish:

```text
committed safe defaults
local non-secret overrides
local secrets
runtime bindings
test-specific configuration
provider-specific development configuration
```

Suggested files:

```text
.env.example
.env.local
.env.test
.env.integration
.env.discord.local
```

Rules:

```text
.env.example is committed and contains placeholders only.
.env.local is ignored by Git.
.env.test contains only deterministic safe values.
Production values never appear in local files.
Frontend-exposed values use an explicit public prefix.
Server-only values never enter frontend bundles.
```

---

## Configuration Ownership

Configuration access should be owned by explicit modules.

Preferred locations:

```text
apps/frontend/src/config/
apps/services/api/src/config/
apps/services/workers/src/config/
apps/integrations/discord/src/config/
libs/db/src/config/
libs/observability/src/config/
```

Avoid scattered code such as:

```ts
const databaseUrl = process.env.DATABASE_URL
```

Instead, use a validated object.

```ts
export const ApiConfigSchema = z.object({
  environment: z.enum(['local', 'test', 'preview', 'staging', 'production']),
  port: z.coerce.number().int().positive(),
  databaseUrl: z.string().min(1),
  databaseDialect: z.enum(['postgresql', 'cockroachdb']),
  aiEnabled: z.coerce.boolean(),
})
```

Invalid configuration should stop startup with an actionable error.

---

## Environment Variable Naming

Environment variables should use the `AEREALITH_` prefix.

Examples:

```text
AEREALITH_ENVIRONMENT
AEREALITH_API_PORT
AEREALITH_DATABASE_URL
AEREALITH_DATABASE_DIALECT
AEREALITH_LOG_LEVEL
AEREALITH_OTEL_ENABLED
AEREALITH_AI_ENABLED
AEREALITH_AI_PROVIDER
AEREALITH_NOTIFICATIONS_EMAIL_ENABLED
AEREALITH_DISCORD_ENABLED
```

Frontend-public variables should use an explicit framework-approved prefix.

Example:

```text
NEXT_PUBLIC_AEREALITH_API_BASE_URL
```

No secret may use a public prefix.

---

## Local Secrets

Local secrets may include:

```text
development Discord bot token
development OAuth client secret
optional AI provider key
optional Resend key
optional Cloudinary secret
local encryption key
local signing key
```

Local secret rules:

```text
Use development-only credentials.
Never copy production credentials locally.
Store secrets in ignored files or local secret tooling.
Do not place secrets in shell history.
Do not place secrets in screenshots.
Do not include secrets in issue reports.
Rotate any accidentally committed or shared secret.
```

The repository should provide:

```text
.env.example
configuration validation
secret redaction tests
Gitleaks scanning
```

---

## Local Secret Generation

Bootstrap may generate safe local-only secrets.

Examples:

```text
session encryption key
local signing key
local webhook test secret
local data-encryption key
```

Generated values should be:

```text
cryptographically random
stored in ignored local files
clearly labeled local-only
regenerable
```

Example command:

```bash
pnpm secrets:generate:local
```

Regenerating secrets may invalidate:

```text
browser sessions
signed development links
encrypted fixture data
webhook signatures
```

The command should warn before regeneration.

---

## Production Isolation

Local development must not connect to production by default.

The application should reject obvious production targets when:

```text
AEREALITH_ENVIRONMENT=local
```

Potential protections:

```text
production hostname denylist
database-name validation
provider project validation
Cloudflare account validation
explicit dangerous-target override
interactive confirmation
CI prohibition
```

Example:

```text
DEV_DATABASE_UNSAFE_TARGET

The local environment attempted to connect to:
postgresql://.../aerealith_production

Local startup was stopped.
```

Exceptional production access belongs in operations and security documentation, not ordinary development.

---

## Docker Compose Architecture

Docker Compose provides disposable stateful infrastructure.

Suggested profiles:

```text
core
cockroach
observability
mail
full
```

Example commands:

```bash
docker compose --profile core up -d
docker compose --profile observability up -d
docker compose --profile full up -d
```

The `core` profile should include only infrastructure required for ordinary development.

Application code should normally run on the host for fast reload unless container parity is being tested.

---

## Compose Service Principles

Compose services should use:

```text
pinned image versions
named volumes
health checks
explicit ports
development-only credentials
clear service names
resource limits where practical
```

Compose files must not contain production secrets.

Local credentials may use obvious development values.

```text
username: aerealith
password: aerealith_local_only
database: aerealith_local
```

These values must never be reused outside local development.

---

## Core Local Infrastructure

The core profile should contain:

```text
PostgreSQL
```

Optional infrastructure may include:

```text
CockroachDB
OpenTelemetry Collector
Mailpit or equivalent local mail sink
Grafana
Loki
Tempo
Mimir-compatible metrics storage
Pyroscope
```

Aerealith should not add local infrastructure without an actual architecture requirement.

---

## Database Development Strategy

Aerealith supports:

```text
PostgreSQL
CockroachDB
```

The default local database is:

```text
PostgreSQL
```

CockroachDB is a compatibility target used through:

```text
dedicated tests
specialized development profile
CI validation
release validation
```

The ORM and migration system is:

```text
Drizzle
```

---

## PostgreSQL Local Development

PostgreSQL should run through Docker Compose.

Example connection:

```text
postgresql://aerealith:aerealith_local_only@localhost:5432/aerealith_local
```

The local PostgreSQL service should provide:

```text
health check
named volume
automatic database creation
development-only credentials
documented reset behavior
```

Example command:

```bash
pnpm db:up
```

Equivalent Compose command:

```bash
docker compose --profile core up -d postgres
```

---

## CockroachDB Compatibility

CockroachDB should use a separate database and configuration.

Example command:

```bash
pnpm db:cockroach:up
```

Compatibility validation should include:

```text
schema migration
repository tests
transaction behavior
unique constraints
JSON behavior
timestamp behavior
pagination behavior
retry behavior
```

Application code must not silently assume PostgreSQL-only behavior when CockroachDB compatibility is a documented requirement.

---

## Database Dialect Configuration

The active database dialect should be explicit.

```text
AEREALITH_DATABASE_DIALECT=postgresql
```

or:

```text
AEREALITH_DATABASE_DIALECT=cockroachdb
```

Dialect-specific behavior should be isolated inside:

```text
libs/db
```

Domain and API layers should not branch on database vendor.

---

## Drizzle Schema Ownership

Drizzle schemas belong in:

```text
libs/db/src/schema/
```

Suggested structure:

```text
libs/db/src/schema/
├── auth/
├── accounts/
├── integrations/
├── modules/
├── workflows/
├── notifications/
├── audit/
├── ai/
└── shared/
```

Persistence records must not become domain entities or public API contracts.

---

## Database Commands

Recommended commands:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:status
pnpm db:seed
pnpm db:reset
pnpm db:studio
pnpm db:validate
pnpm db:validate:cockroach
```

Commands should route through Nx or repository scripts.

Avoid developers invoking undocumented raw migration commands.

---

## Migration Workflow

Recommended schema-change workflow:

```text
1. Update the Drizzle schema.
2. Generate a migration.
3. Review the migration.
4. Apply it to an empty local database.
5. Apply it to a seeded local database.
6. Run repository and service tests.
7. Validate CockroachDB compatibility.
8. Review rollback or forward-recovery behavior.
9. Commit schema and migration together.
```

Generated migrations require human review.

---

## Migration Rules

Migrations should:

```text
be deterministic
be committed
avoid destructive defaults
support forward recovery
use expand-and-contract for risky changes
remain compatible with supported databases
```

Avoid:

```text
editing already-applied migrations
dropping columns without a staged plan
rewriting large tables during ordinary startup
adding non-null columns without defaults or backfill
```

---

## Migration Startup Policy

Application startup should not silently generate migrations.

Local startup may automatically apply committed migrations when explicitly enabled.

Example:

```text
AEREALITH_DATABASE_AUTO_MIGRATE=true
```

Production migration behavior must remain separate and controlled.

---

## Seed Data

Local seed data should be:

```text
deterministic
synthetic
repeatable
privacy-safe
scope-rich
useful for UI and authorization testing
```

Seed data may include:

```text
local users
accounts
organizations
communities
memberships
roles
modules
workflows
notifications
audit records
integration connections using fake credentials
Discord server fixtures
tickets
moderation cases
```

---

## Seed Identities

Recommended local identities:

```text
owner@aerealith.local
admin@aerealith.local
member@aerealith.local
developer@aerealith.local
suspended@aerealith.local
```

Seed identities should represent distinct permission states.

The seed set should include:

```text
account owner
organization administrator
community administrator
ordinary member
developer
unauthorized user
suspended user
```

---

## Seed Authentication

Local seed authentication should avoid unsafe universal bypasses.

Potential approaches:

```text
known local-only passwords
magic-link sink
development identity provider
explicit local sign-in route
```

Any development shortcut must:

```text
require AEREALITH_ENVIRONMENT=local
be impossible to enable in production
be clearly marked in the UI
produce normal sessions
use normal authorization
produce audit events where appropriate
```

---

## Database Reset

Database reset is destructive and must be guarded.

Recommended command:

```bash
pnpm db:reset
```

The reset script should verify:

```text
environment is local or test
hostname is approved
database name contains a local marker
production override is absent
```

It should then:

```text
stop dependent workers
drop or recreate the local database
apply migrations
seed deterministic data
run health checks
```

Example confirmation:

```text
Resetting PostgreSQL database: aerealith_local
Host: localhost
Environment: local
```

---

## Database Reset Safety

The reset command must refuse:

```text
production hostnames
staging hostnames
unknown remote hosts
databases without a local or test marker
```

A dangerous override, if one exists at all, should require:

```text
an explicit environment variable
an explicit command flag
interactive confirmation
security documentation
```

It must not work in CI or production runtimes.

---

## Local Frontend Development

The frontend should run through its Nx target.

```bash
pnpm nx serve frontend
```

or:

```bash
pnpm dev:frontend
```

The frontend should support:

```text
fast refresh
type checking
source maps
local API configuration
authenticated local sessions
fake-provider UI states
error and loading states
accessibility testing
```

The frontend should not contain local-only permission truth.

---

## Frontend API Configuration

The local frontend should call the local API through an explicit base URL.

```text
NEXT_PUBLIC_AEREALITH_API_BASE_URL=http://localhost:8787
```

Preferred deployment parity is:

```text
same-origin frontend and API
```

When local development uses separate origins, CORS and CSRF behavior must remain explicit.

Do not use wildcard credentialed CORS merely because the environment is local.

---

## Local API Development

The API should run through Wrangler or the selected local runtime.

```bash
pnpm nx serve api
```

or:

```bash
pnpm dev:api
```

The local API should preserve:

```text
/api/V1/
request validation
response envelopes
authentication
authorization
risk evaluation
approval
request IDs
trace IDs
error mapping
rate limits where practical
```

Local mode must not bypass service architecture.

---

## Wrangler Development

Wrangler may be used for:

```text
Cloudflare-compatible request handling
Worker bindings
local environment simulation
queue bindings where supported
scheduled trigger simulation
```

Wrangler configuration should remain environment-specific.

Production account identifiers and secrets should not be required for local mode.

---

## Local Combined Frontend and API Shape

The production MVP may use a combined frontend and API Worker.

Local development may run them as separate processes for reload speed.

This is acceptable when:

```text
routes remain compatible
cookies remain secure for local behavior
CORS and CSRF are tested
deployment parity tests exist
container or preview validation tests the combined shape
```

---

## Local Authentication

Local authentication should use the same fundamental model as production:

```text
server-managed opaque session
HttpOnly cookie
server-side session record
current authorization checks
session revocation
```

Local development should not use browser-owned bearer tokens as a shortcut.

---

## Local Session Cookies

Local cookie settings may differ only where HTTPS is unavailable.

Example local settings:

```text
HttpOnly: true
Secure: false on localhost only
SameSite: Lax
Path: /
```

Production settings remain:

```text
HttpOnly: true
Secure: true
SameSite: Lax or stricter according to policy
```

The application must ensure insecure cookies cannot be enabled outside local development.

---

## Local HTTPS

Local HTTPS is optional for ordinary development.

It may be required for testing:

```text
Secure cookies
OAuth callbacks
WebAuthn or passkeys
browser permission APIs
service workers
push notifications
```

A specialized HTTPS profile may use:

```text
locally trusted certificates
a local reverse proxy
an approved secure tunnel
```

Certificates and private keys must remain ignored by Git.

---

## Local Email Verification

Email verification should use:

```text
a local mail sink
an in-app development mailbox
a deterministic verification-link inspector
```

Verification tokens must still be:

```text
single-use
short-lived
hashed in storage
scope-bound
```

The local environment should test real verification behavior without sending email externally.

---

## Local Password Reset

Password reset should use the same token and session invalidation behavior as production.

Local testing should verify:

```text
unknown email uses a generic response
reset token expires
reset token is single-use
password change revokes required sessions
security notification is created
audit event is created
```

---

## Local Authorization

Authorization must remain fully active locally.

Local tests should include:

```text
cross-account access
cross-organization access
cross-community access
disabled module access
revoked integration access
approval-required action
administrator-only action
```

A local administrator account should not be the only available seed identity.

---

## Persistent Integration Runtimes

Persistent integrations should run as independent processes.

For Discord:

```bash
pnpm nx serve discord
```

or:

```bash
pnpm dev:discord
```

The Discord runtime owns:

```text
gateway connection
interaction handling
Discord REST coordination
provider rate limits
Discord-specific health
event normalization
```

It should not be embedded inside the API process merely for local convenience.

---

## Discord Development Modes

Discord development should support:

```text
disabled
fake
recorded-event
live-development
```

### Disabled

No Discord runtime is started.

The rest of Aerealith remains operational.

### Fake

Discord capability calls use deterministic fake adapters.

### Recorded Event

Gateway and interaction fixtures are replayed locally.

### Live Development

A development-only Discord application and test server are used.

---

## Discord Development Credentials

Live Discord development requires separate credentials:

```text
development application ID
development public key
development client ID
development client secret
development bot token
development server ID
```

These credentials must not be shared with production.

The runtime should print:

```text
Discord adapter: live-development
Discord application: Aerealith Development
Discord server allowlist: enabled
```

It should never print the token.

---

## Discord Test Server Allowlist

Live Discord development should use an allowlist.

```text
AEREALITH_DISCORD_ALLOWED_SERVER_IDS=<development-server-id>
```

The development bot should refuse to operate outside approved test servers unless an explicit development override exists.

This reduces accidental actions in unrelated servers.

---

## Discord Command Registration

Development command registration should support:

```text
test-server registration
global registration only when explicitly requested
command cleanup
versioned command definitions
```

Default development behavior should use server-scoped commands because they update faster and reduce accidental global exposure.

---

## Discord Gateway Fixtures

Gateway fixtures should include:

```text
member joined
member left
message created
message deleted
role updated
channel deleted
bot removed
permission changed
interaction created
```

Fixtures must contain synthetic data.

Recorded production events are not permitted.

---

## Discord Failure Simulation

Local Discord testing should simulate:

```text
gateway disconnect
gateway resume
invalid bot token
missing bot permission
missing user permission
role-hierarchy denial
rate limit
deleted channel
deleted role
bot removal
interaction replay
provider timeout
```

Fake adapters should allow deterministic control of these failures.

---

## Provider Adapter Defaults

Every external provider should support at least one local-safe mode.

| Provider              | Default Local Mode         |
| --------------------- | -------------------------- |
| Discord               | Fake or disabled           |
| AI provider           | Deterministic fake         |
| Resend                | Local mail sink or fake    |
| Cloudinary            | Local file adapter or fake |
| Datadog               | Disabled                   |
| Grafana Cloud         | Disabled                   |
| GitHub integration    | Fake                       |
| Google integration    | Fake                       |
| Microsoft integration | Fake                       |

Real providers require explicit opt-in.

---

## Fake Provider Contract

A fake provider should implement the same provider-neutral interface as the real adapter.

It should support:

```text
success
validation failure
permission denial
rate limit
temporary failure
permanent failure
timeout
revocation
malformed response
duplicate event
```

A fake provider must not simply return success for every operation.

---

## AI Development

The default AI provider is deterministic and fake.

```text
AEREALITH_AI_PROVIDER=fake
```

The fake AI provider should support:

```text
normal response
structured response
invalid structured response
action proposal
timeout
rate limit
provider unavailable
streaming
```

This supports reliable tests without:

```text
provider cost
network dependency
nondeterministic output
private-data transfer
```

---

## Real AI Provider Development

Real AI provider development must be opt-in.

Example:

```text
AEREALITH_AI_ENABLED=true
AEREALITH_AI_PROVIDER=<development-provider>
AEREALITH_AI_ALLOW_REAL_PROVIDER=true
```

The runtime should display a visible warning:

```text
Real AI provider enabled.
Synthetic development data only.
Requests may incur provider cost.
```

Real AI testing should use:

```text
development API keys
strict token limits
strict cost limits
synthetic context
non-production accounts
```

---

## AI Cost Protection

Local real-provider use should enforce:

```text
maximum input tokens
maximum output tokens
maximum requests per minute
maximum daily development budget
capability allowlist
```

A missing budget configuration should disable the real provider rather than run without limits.

---

## Email Development

The default email channel should use:

```text
fake adapter
local mail sink
```

Potential command:

```bash
pnpm dev:mail
```

The mail sink should expose a local UI for inspecting:

```text
verification email
password reset email
security notification
invitation
workflow approval
integration health notification
```

No external email should be sent in the default profile.

---

## Real Resend Development

Real Resend delivery must be opt-in.

It should require:

```text
development API key
verified development sender
recipient allowlist
environment confirmation
```

Example:

```text
AEREALITH_NOTIFICATIONS_EMAIL_PROVIDER=resend
AEREALITH_NOTIFICATIONS_EMAIL_ALLOW_REAL_DELIVERY=true
AEREALITH_NOTIFICATIONS_EMAIL_RECIPIENT_ALLOWLIST=developer@example.com
```

The adapter must reject recipients outside the allowlist.

---

## Media Development

Cloudinary-backed media should use a local or fake adapter by default.

Local options may include:

```text
filesystem-backed object store
in-memory fixture adapter
local S3-compatible service later
```

Real Cloudinary development should use:

```text
development cloud
development credentials
isolated folder prefix
automatic cleanup
```

---

## Queue Development

The local queue implementation must preserve important production semantics.

It should support:

```text
at-least-once delivery
duplicate delivery
retry
delayed delivery
dead-letter handling
consumer failure
consumer restart
```

A simple direct function call is insufficient for integration testing when production behavior relies on queues.

---

## Queue Modes

Potential queue modes:

```text
in-memory deterministic queue
database-backed development queue
Cloudflare queue emulator
external local queue later
```

The minimal profile may use an in-memory queue.

The integration and full profiles should use a durable development queue where practical.

---

## Queue Idempotency Testing

Local tooling should make it easy to:

```text
redeliver an event
duplicate a webhook
restart a worker after execution
fail before acknowledgment
fail after provider success
```

This is required for testing:

```text
audit idempotency
notification idempotency
workflow idempotency
integration action receipts
```

---

## Worker Development

Workers should run independently.

Potential commands:

```bash
pnpm dev:workers
pnpm nx serve workers
```

Workers may include:

```text
audit consumer
notification consumer
workflow consumer
integration reconciliation
retention worker
export worker
```

Each worker runtime should expose:

```text
liveness
readiness
queue status
database status
current build information
```

---

## Scheduled Work

Scheduled tasks should be invokable manually.

Examples:

```bash
pnpm schedule:run integration-health
pnpm schedule:run notification-digest
pnpm schedule:run audit-retention
pnpm schedule:run workflow-reconciliation
```

Manual invocation should preserve:

```text
scope
idempotency
logging
trace IDs
normal service behavior
```

---

## Local Webhooks

Webhook development should support:

```text
signed fixture delivery
invalid signature
expired timestamp
duplicate delivery
malformed payload
oversized payload
unknown event
```

Example command:

```bash
pnpm webhook:send discord message-created
```

Webhook fixtures should use the same validation path as external requests.

---

## External Callback Development

OAuth and external callbacks may require a publicly reachable development URL.

A secure development tunnel may be used.

Tunnel requirements:

```text
development-only URL
explicit startup
short lifetime
no production credentials
callback allowlist
visible runtime warning
```

The tunnel address must not be hardcoded into committed configuration.

---

## Local Observability

Local runtimes should emit the same telemetry shape as production.

The default local exporter may be:

```text
console
```

Optional exporters may include:

```text
OpenTelemetry Collector
local Grafana stack
Datadog development environment
Grafana Cloud development environment
```

External observability is opt-in.

---

## Structured Local Logs

Local logs should include:

```text
timestamp
level
service
environment
operation
request ID
trace ID
error code
duration
```

Example:

```json
{
  "level": "info",
  "service": "api",
  "environment": "local",
  "operation": "module.enable",
  "requestId": "req_local_123",
  "traceId": "trace_local_456",
  "durationMs": 42
}
```

Logs must not contain:

```text
passwords
session tokens
API key secrets
OAuth tokens
authorization headers
provider credentials
private encryption keys
```

---

## Developer-Friendly Log Mode

Local development may provide:

```text
pretty console logs
structured JSON logs
```

Suggested setting:

```text
AEREALITH_LOG_FORMAT=pretty
```

CI and container parity should use:

```text
AEREALITH_LOG_FORMAT=json
```

Both formats should originate from the same structured log events.

---

## Local Trace Inspection

Request and trace IDs should be visible in:

```text
API responses
console logs
worker logs
provider adapter logs
audit records
notification delivery records
```

A local trace should allow a contributor to follow:

```text
frontend request
API route
service method
database operation
queue publication
worker consumption
provider action
audit event
notification event
```

---

## Local Metrics

Useful development metrics include:

```text
request count
request latency
error count
database query duration
queue depth
queue retry count
workflow run count
notification delivery count
provider error count
Discord rate-limit count
AI usage count
```

Metrics should not contain high-cardinality private identifiers.

---

## Local Observability Profile

An optional observability profile may include:

```text
OpenTelemetry Collector
Grafana
Loki
Tempo
Mimir-compatible metrics storage
Pyroscope
```

Potential command:

```bash
pnpm dev:observability
```

The observability profile should not be required for ordinary frontend or API development.

---

## Datadog Development

Datadog may be used for selected development or staging diagnostics.

Local Datadog use should:

```text
use development credentials
tag all telemetry as local
avoid private payloads
remain disabled by default
avoid sending every developer's routine logs
```

---

## Grafana Cloud Development

Grafana Cloud may receive development telemetry when explicitly enabled.

Required labels:

```text
environment=local
developer=<safe-local-identifier>
service=<service-name>
```

Private or secret values must not appear in labels.

---

## Debugging

The repository should include VS Code debug configurations.

Potential configurations:

```text
Debug Frontend
Debug API
Debug Discord Runtime
Debug Workers
Debug Current Test
Attach to Node Process
```

Recommended file:

```text
.vscode/launch.json
```

Debug configurations must use workspace-relative paths.

---

## Source Maps

Development builds should provide source maps.

Source maps should support debugging:

```text
TypeScript
Workers
Node.js runtimes
tests
```

Production source-map publication remains controlled by deployment and security policy.

---

## Breakpoints

Contributors should be able to set breakpoints in:

```text
route handlers
application services
domain policies
provider adapters
queue consumers
Drizzle repositories
```

Debugging should not require transpiled output navigation.

---

## Local Diagnostics Command

The repository should provide:

```bash
pnpm diagnostics:local
```

The command may collect:

```text
operating system
Node.js version
pnpm version
Docker version
Docker Compose version
active containers
active development profile
configured ports
database health
migration status
service health
adapter mode
recent safe errors
```

It must not collect or print secrets.

---

## Diagnostics Output

Example:

```text
Aerealith Local Diagnostics

Environment:          local
Node.js:              24.3.0
pnpm:                 10.x
Docker:               available
PostgreSQL:           healthy
Migrations:           current
Frontend:             healthy
API:                  healthy
Discord adapter:      fake
AI adapter:           fake
Email adapter:        mailpit
Telemetry:            console
```

---

## Health Checks

Each local runtime should expose health.

Potential endpoints:

```text
/health/live
/health/ready
/health/dependencies
```

### Liveness

Answers:

```text
Is the process running?
```

### Readiness

Answers:

```text
Can the process safely receive work?
```

### Dependency Health

May include:

```text
database
queue
provider
configuration
migration status
```

Health endpoints must not expose secrets.

---

## Testing Strategy

Local testing should mirror CI behavior.

Testing layers include:

```text
unit tests
contract tests
repository tests
service integration tests
provider adapter tests
queue tests
browser component tests
end-to-end tests
security tests
migration tests
container tests
```

Coverage requirement:

```text
80% statements
80% branches
80% functions
80% lines
```

---

## Unit Tests

Unit tests should:

```text
run without Docker where practical
use deterministic fakes
avoid network calls
avoid real provider credentials
run quickly
```

Example:

```bash
pnpm test
```

Single project:

```bash
pnpm nx test core
```

Watch mode:

```bash
pnpm nx test core --watch
```

---

## Repository Tests

Repository tests should run against a real local database.

They should verify:

```text
schema mapping
scope filtering
unique constraints
transaction behavior
pagination
idempotency
```

Repository tests must not depend solely on in-memory mocks.

---

## Integration Tests

Integration tests may require:

```text
PostgreSQL
local queue
fake providers
API runtime
worker runtime
```

Example:

```bash
pnpm test:integration
```

The test runner should:

```text
start required dependencies
apply migrations
seed test data
run tests
clean up
```

---

## End-to-End Tests

End-to-end tests should use isolated test data.

Potential flows:

```text
sign in
switch account scope
enable module
configure module
trigger workflow
approve action
execute fake provider action
view audit record
receive notification
disconnect integration
```

Example:

```bash
pnpm test:e2e
```

---

## Browser Testing

Frontend tests may use:

```text
Vitest
React Testing Library
Playwright
Meticulous AI
```

Meticulous AI supports visual regression and UI-change validation.

It does not replace:

```text
functional tests
accessibility tests
authorization tests
manual review
```

---

## Accessibility Testing

Local frontend testing should include:

```text
keyboard navigation
screen-reader semantics
focus behavior
color-independent state
reduced motion
high contrast
form errors
status announcements
```

Automated accessibility tools should run where practical.

Manual review remains required for critical flows.

---

## Security Testing

Local security tests should include:

```text
session revocation
CSRF
CORS
authorization denial
cross-scope access
webhook signature verification
approval replay
event replay
secret redaction
unsafe URL rejection
rate limiting
```

Security controls must not be disabled merely to simplify development.

---

## Failure Simulation

The repository should provide deterministic failure controls.

Potential environment variables:

```text
AEREALITH_FAKE_DATABASE_LATENCY_MS
AEREALITH_FAKE_QUEUE_DUPLICATE_RATE
AEREALITH_FAKE_DISCORD_RATE_LIMITED
AEREALITH_FAKE_DISCORD_PERMISSION_MISSING
AEREALITH_FAKE_AI_TIMEOUT
AEREALITH_FAKE_EMAIL_BOUNCE
```

A more structured failure-control interface may be preferable to many environment variables.

---

## Failure Scenario Registry

A local failure registry may support:

```text
database unavailable
database slow
queue duplicate
queue delayed
provider timeout
provider rate limit
credential revoked
permission removed
invalid structured AI output
email bounce
audit write failure
notification delivery failure
```

Example command:

```bash
pnpm failure:set discord-rate-limit
pnpm failure:clear
```

Failure modes must never be enabled in production.

---

## CI Parity

The repository should provide one command that closely matches continuous integration.

```bash
pnpm validate
```

The validation command should run:

```text
toolchain validation
lockfile validation
format check
lint
typecheck
unit tests
coverage
contract validation
migration validation
secret scanning
static analysis
build
```

Some slower provider and container tests may run separately.

---

## Affected Validation

During development, Nx affected commands should reduce feedback time.

```bash
pnpm nx affected -t lint,typecheck,test
```

Before opening a pull request:

```bash
pnpm validate
```

Before a release candidate:

```bash
pnpm validate:full
```

---

## Formatting

Formatting should be automated.

Potential command:

```bash
pnpm format
```

Check-only command:

```bash
pnpm format:check
```

Formatting automation should prevent style debates from consuming review attention.

---

## Linting

Linting should include:

```text
ESLint
Nx dependency-boundary rules
import restrictions
security-oriented custom rules
```

Potential local command:

```bash
pnpm lint
```

Custom rules may prevent:

```text
frontend importing libs/db
provider SDKs escaping integration boundaries
direct process.env access
raw database row responses
authorization header logging
```

---

## Type Checking

Type checking should run independently from builds.

```bash
pnpm typecheck
```

Strict TypeScript settings should remain enabled.

Avoid solving type errors through:

```text
unnecessary any
unsafe assertions
disabled strictness
```

---

## Static Analysis

Local static-analysis commands may include:

```bash
pnpm security:semgrep
pnpm security:snyk
pnpm security:codeql:prepare
```

CI remains authoritative for complete scanning.

---

## Secret Scanning

Gitleaks should run locally where practical.

```bash
pnpm security:secrets
```

A detected secret should be treated as compromised even when committed only briefly.

Required response:

```text
revoke
rotate
remove
review access
document when necessary
```

---

## Dependency Scanning

Dependency security may use:

```text
Snyk
Dependabot
Renovate
GitHub dependency review
pnpm audit as supplemental information
```

Local command:

```bash
pnpm security:dependencies
```

A clean local command does not replace repository security alerts.

---

## Container Scanning

Container images should be scanned with:

```text
Trivy
Snyk container scanning where configured
```

Example:

```bash
pnpm security:containers
```

Container scanning should cover:

```text
base image
operating-system packages
Node.js dependencies
configuration
```

---

## Code Coverage

Codecov may report CI coverage.

Local coverage commands should produce standard reports.

```bash
pnpm test:coverage
```

Expected formats may include:

```text
text
HTML
LCOV
Cobertura
```

Coverage thresholds should be enforced locally and in CI.

---

## Sonar Integration

SonarLint may provide editor feedback.

SonarQube or a compatible service may run in CI.

Local Sonar tooling is supplemental.

It must not require every contributor to run a local Sonar server.

---

## Local Build

Every deployable should build locally.

Examples:

```bash
pnpm nx build frontend
pnpm nx build api
pnpm nx build discord
pnpm nx build workers
```

Full build:

```bash
pnpm build
```

Builds should not require production secrets.

---

## Container Parity

A container development profile should verify Docker packaging.

Potential command:

```bash
pnpm dev:container
```

Container parity should test:

```text
image build
non-root execution
configuration injection
health endpoints
graceful shutdown
database connectivity
queue connectivity
```

It should not replace faster host-based development.

---

## Kubernetes Development

Kubernetes is optional for ordinary work.

A specialized profile may use:

```text
Minikube
Kind
```

Kubernetes development is appropriate for:

```text
network policy testing
secret injection testing
rolling updates
resource-limit testing
multi-runtime deployment
Discord shard coordination later
```

Potential command:

```bash
pnpm dev:kubernetes
```

---

## Kubernetes Resource Limits

Local Kubernetes manifests should use modest resource requests and limits.

The profile should clearly state required workstation resources.

It must not assume a production-sized cluster.

---

## Local Data Policy

Local development data must be:

```text
synthetic
non-production
non-secret
disposable
```

Do not import production databases or exports into local development.

Sanitized fixtures require an explicit approved process.

---

## Screenshots and Bug Reports

Before sharing screenshots or diagnostics, contributors should verify they do not contain:

```text
tokens
email addresses
private Discord content
provider credentials
private user information
internal production URLs
```

The diagnostics script should generate a safe-to-share output mode.

```bash
pnpm diagnostics:local --redacted
```

---

## Cleanup

The repository should provide cleanup commands at several levels.

### Stop Processes

```bash
pnpm dev:stop
```

### Stop Infrastructure

```bash
docker compose down
```

### Remove Local Volumes

```bash
pnpm local:clean:data
```

### Remove Generated Files

```bash
pnpm local:clean:generated
```

### Full Local Reset

```bash
pnpm local:reset
```

The full reset should require confirmation before deleting volumes.

---

## Nx Cache

Nx cache should improve local development performance.

Potential commands:

```bash
pnpm nx reset
```

Cache reset should not be the first response to every failure.

Use it when:

```text
task output is clearly stale
project graph state is corrupted
cache metadata is invalid
```

---

## Dependency Recovery

When dependency installation becomes inconsistent:

```bash
rm -rf node_modules
pnpm install --frozen-lockfile
```

Deleting the lockfile should not be the default recovery step.

The committed lockfile is the expected dependency state.

---

## Database Recovery

Database recovery steps should proceed from least destructive to most destructive:

```text
1. Check container health.
2. Check migration status.
3. Restart PostgreSQL.
4. Reapply pending migrations.
5. Inspect local logs.
6. Reset only the local database.
7. Remove the local volume as a final step.
```

---

## Port Conflict Recovery

The repository should detect common port conflicts.

Example:

```text
DEV_PORT_IN_USE

Port 8787 is already in use.
Process: node
Suggested actions:
  pnpm dev:stop
  lsof -i :8787
  AEREALITH_API_PORT=8788 pnpm dev:api
```

---

## Troubleshooting Command

A general troubleshooting command may run:

```bash
pnpm doctor
```

It should verify:

```text
Node.js
pnpm
Docker
Compose
ports
configuration
database
migrations
workspace graph
generated files
service health
```

---

## Development Documentation

Local development documentation should include:

```text
quick start
toolchain installation
profiles
configuration
database
Discord development
AI development
email development
observability
testing
debugging
troubleshooting
cleanup
```

Suggested structure:

```text
docs/development/
├── README.md
├── Quick Start.md
├── Toolchain.md
├── Configuration.md
├── Database.md
├── Discord.md
├── AI.md
├── Notifications.md
├── Observability.md
├── Testing.md
├── Debugging.md
└── Troubleshooting.md
```

This architecture document defines direction.

The development guides provide step-by-step commands.

---

## Contributor Onboarding

A contributor onboarding test should be performed from a clean environment.

The onboarding test should verify that a new contributor can:

```text
install required tools
clone the repository
run bootstrap
start the minimal profile
sign in locally
view seeded data
make a small change
run tests
run validation
reset the environment
```

Undocumented manual steps are defects.

---

## New Contributor Target

A reasonable onboarding target is:

```text
clean clone to running minimal environment without production credentials
```

The exact time target should be measured after the repository scripts exist.

The architecture should not promise a specific duration before real onboarding measurements exist.

---

## Local Development Security

Local development follows:

```text
docs/architecture/Security Architecture.md
```

High-priority risks include:

```text
production credential leakage
production data exposure
uncommitted secret files
unsafe development bypasses
open local services
provider actions outside test resources
browser token storage
logging private content
```

---

## Local Network Exposure

Development servers should bind to:

```text
127.0.0.1
```

by default.

Binding to:

```text
0.0.0.0
```

must be explicit when required for:

```text
containers
mobile devices
local network testing
secure tunnels
```

The runtime should warn when a development service is exposed beyond localhost.

---

## Development Bypasses

A development-only bypass must meet all of these requirements:

```text
environment-locked
disabled by default
visibly marked
covered by a production-disablement test
unable to grant unrestricted authority
documented
```

Preferred approach:

```text
avoid bypasses
```

Use seeded identities and normal authorization instead.

---

## Local Rate Limits

Rate limits should remain enabled in local and test environments where practical.

Development configuration may use higher limits.

It should still support testing:

```text
rate-limit reached
retry-after behavior
per-user limits
per-key limits
provider rate limits
```

---

## Local Audit Behavior

Meaningful local actions should still publish audit events.

Local audit testing should support:

```text
event duplication
redaction
unsupported event version
dead-letter behavior
query authorization
export
```

Audit may use a shorter local retention policy.

---

## Local Notification Behavior

The default notification configuration should provide:

```text
in-app notifications
local email sink
fake Discord delivery
```

Contributors should be able to inspect:

```text
notification record
recipient state
delivery attempt
provider result
trace ID
```

---

## Local Workflow Behavior

Workflows should use the same execution model as production.

Local testing should include:

```text
manual trigger
event trigger
condition
approval wait
approval rejection
retry
timeout
cancellation
duplicate delivery
partial success
```

Do not create a simplified local-only workflow engine.

---

## Local Module Behavior

Modules should load through the normal registry.

Local module testing should preserve:

```text
manifest validation
lifecycle
configuration validation
dependencies
permissions
risk
approval
audit
```

A local module harness may simplify test setup.

It must not bypass policy.

---

## Local Integration Behavior

Integrations should expose:

```text
provider definition
connection lifecycle
health
permissions
capabilities
credential state
disconnect
revocation
```

Fake adapters should use synthetic credential references rather than raw fake secrets in public responses.

---

## Local AI Behavior

AI-disabled mode must remain fully supported.

```text
AEREALITH_AI_ENABLED=false
```

Core functionality should continue:

```text
auth
modules
workflows
Discord
notifications
audit
integrations
```

---

## Local Observability Behavior

Local telemetry should preserve production field names where practical.

Examples:

```text
service.name
deployment.environment
request.id
trace.id
error.code
module.id
workflow.id
provider
```

High-cardinality user data should not become metric labels.

---

## Self-Hosting Development

The local architecture should prove the structural boundaries required for self-hosting.

The environment should support:

```text
external providers disabled
fake adapters
local email sink
local database
local observability
Docker execution
```

A self-hosted contributor should be able to develop core behavior without Aerealith-managed infrastructure.

---

## Security Tooling Integration

The local workflow should integrate with:

```text
Snyk
Semgrep
Gitleaks
Trivy
SonarLint
Codecov through CI
Dependabot
Renovate
```

Local tools support fast feedback.

Repository and CI controls remain authoritative.

---

## Repository Automation

Automation scripts belong under:

```text
tools/scripts/
tools/generators/
```

Scripts should:

```text
use clear names
validate arguments
fail with actionable messages
avoid destructive defaults
support non-interactive CI mode
redact secrets
```

Avoid large undocumented shell scripts scattered throughout application directories.

---

## Script Naming

Recommended names:

```text
bootstrap.mjs
dev-integration.mjs
dev-full.mjs
validate-config.mjs
reset-local-database.mjs
generate-local-secrets.mjs
collect-local-diagnostics.mjs
run-failure-scenario.mjs
```

Nx targets and root scripts should remain the stable public entry points even when implementation files move.

---

## Local Development Error Codes

Potential development-tooling error codes:

```text
DEV_TOOLCHAIN_UNSUPPORTED
DEV_DOCKER_UNAVAILABLE
DEV_PORT_IN_USE
DEV_CONFIG_MISSING
DEV_CONFIG_INVALID
DEV_SECRET_MISSING
DEV_DATABASE_UNAVAILABLE
DEV_DATABASE_UNSAFE_TARGET
DEV_MIGRATION_FAILED
DEV_SEED_FAILED
DEV_PROVIDER_NOT_CONFIGURED
DEV_PROVIDER_CREDENTIAL_REJECTED
DEV_PROFILE_UNKNOWN
DEV_HEALTH_CHECK_FAILED
DEV_RESET_REFUSED
```

Developer scripts should provide:

```text
stable error code
plain-language explanation
recommended next action
```

---

## File Structure

Recommended development tooling structure:

```text
tools/
├── generators/
│   ├── application/
│   ├── library/
│   ├── module/
│   ├── service/
│   └── integration/
└── scripts/
    ├── bootstrap.mjs
    ├── dev-integration.mjs
    ├── dev-full.mjs
    ├── validate-config.mjs
    ├── generate-local-secrets.mjs
    ├── reset-local-database.mjs
    ├── collect-local-diagnostics.mjs
    └── run-failure-scenario.mjs
```

Docker resources may use:

```text
docker/
├── postgres/
├── cockroach/
├── observability/
└── mail/
```

---

## Root Script Direction

Recommended root scripts:

```json
{
  "scripts": {
    "bootstrap": "node tools/scripts/bootstrap.mjs",
    "doctor": "node tools/scripts/collect-local-diagnostics.mjs",
    "dev": "nx run-many -t serve --projects=frontend,api --parallel",
    "dev:frontend": "nx serve frontend",
    "dev:api": "nx serve api",
    "dev:workers": "nx serve workers",
    "dev:discord": "nx serve discord",
    "dev:integration": "node tools/scripts/dev-integration.mjs",
    "dev:full": "node tools/scripts/dev-full.mjs",
    "db:up": "docker compose --profile core up -d postgres",
    "db:migrate": "nx run db:migrate",
    "db:seed": "nx run db:seed",
    "db:reset": "node tools/scripts/reset-local-database.mjs",
    "validate": "nx run-many -t lint,typecheck,test,build",
    "validate:full": "node tools/scripts/validate-workspace.mjs"
  }
}
```

Exact names should be finalized before the bootstrap contract becomes stable.

---

## Implementation Sequence

Recommended implementation order:

```text
1. Pin Node.js and pnpm versions.
2. Define root workspace scripts.
3. Create the bootstrap script.
4. Create .env.example and configuration validation.
5. Create the core Docker Compose profile.
6. Add PostgreSQL health and migration commands.
7. Add deterministic seed data.
8. Add minimal frontend and API development profile.
9. Add fake provider adapters.
10. Add persistent Discord development profile.
11. Add local queue and worker behavior.
12. Add local authentication flow.
13. Add local notification inbox.
14. Add local OpenTelemetry configuration.
15. Add CockroachDB compatibility profile.
16. Add the full validation command.
17. Add reset and diagnostics commands.
18. Add VS Code debug configurations.
19. Add failure-simulation scenarios.
20. Add contributor quick-start documentation.
21. Add security and secret-scanning hooks.
22. Add container parity validation.
23. Add optional Kubernetes profile.
24. Run onboarding rehearsal from a clean environment.
```

---

## Required Decisions

Before the local development foundation is considered stable, Aerealith must finalize:

```text
exact Node.js version policy
exact pnpm version
root script names
frontend local port
API local port
local session strategy
configuration-file hierarchy
local secret-storage method
PostgreSQL image version
CockroachDB compatibility version
migration command ownership
seed identity strategy
fake provider interface
local queue adapter
local observability default
local email sink
supported operating systems
CI parity command
```

Before a local Kubernetes profile is considered supported, Aerealith must finalize:

```text
Minikube or Kind preference
local ingress
secret injection
image loading
resource requirements
persistent volumes
observability profile
```

---

## Local Development Anti-Patterns

Avoid:

```text
requiring production credentials
using production user data
supporting multiple package managers
scattering process.env access
making every contributor run Kubernetes
running every application process in Docker during ordinary UI work
using only real providers in tests
printing secrets in startup logs
storing tokens in frontend localStorage
using wildcard CORS because the environment is local
skipping authorization in local mode
using a fake queue that cannot redeliver
editing the database instead of testing services
resetting every cache as the first troubleshooting step
requiring undocumented manual setup
creating scripts that work only on one personal machine
making CI use a different hidden build process
```

---

## Relationship to Monorepo Architecture

Local development uses Nx to respect project boundaries and orchestrate tasks.

The local workflow should make correct dependency boundaries easier than incorrect imports.

Generators, target defaults, and project tags should enforce architecture during ordinary development.

---

## Relationship to Frontend Architecture

The frontend local server uses real API contracts and server-owned authentication where practical.

Frontend-only mocks are appropriate for isolated component work.

They do not replace full-stack security tests.

---

## Relationship to API Architecture

The local API uses:

```text
/api/V1/
```

It should preserve:

```text
response envelopes
error envelopes
request IDs
trace IDs
validation
authorization
rate limits where testable
```

---

## Relationship to Service Architecture

Services should be independently runnable where practical.

Local composition must not collapse service boundaries into route handlers or shared global state.

---

## Relationship to Data Architecture

Local persistence uses PostgreSQL by default and CockroachDB as a compatibility target.

Drizzle schemas, migrations, repositories, data classification, and deletion behavior should remain consistent with production architecture.

---

## Relationship to Auth Architecture

Local authentication should preserve server-side session behavior and authorization.

Any development shortcut must remain environment-locked, visibly marked, and tested against accidental production enablement.

---

## Relationship to Security Architecture

Local development keeps security controls active.

It must support testing:

```text
scope isolation
approval enforcement
webhook verification
secret redaction
session revocation
permission denial
provider revocation
```

---

## Relationship to Discord Architecture

Discord development defaults to fake adapters and recorded events.

Live development uses a separate Discord application and dedicated test server.

No module should require a live Discord connection for unit tests.

---

## Relationship to Module Architecture

Modules should load through the same validated registry and lifecycle rules locally.

Local harnesses may simplify context creation but must not bypass module permissions, risk, approval, or capability constraints.

---

## Relationship to Workflow Architecture

Local workflows should support deterministic triggering, approval, retry, cancellation, and replay.

The workflow engine should not use a separate simplified execution model solely for development.

---

## Relationship to AI Architecture

The default AI adapter is deterministic and fake.

Real model providers are opt-in, budget-limited, and restricted to synthetic development data.

Core platform development must continue when AI is disabled.

---

## Relationship to Integration Architecture

Every integration should provide a fake or sandbox path.

Local development should reveal connection state, active adapter, health, permissions, and revocation behavior without exposing credentials.

---

## Relationship to Notification Architecture

Local notifications use in-app delivery and a fake email sink by default.

Real email and Discord delivery require explicit opt-in and recipient restrictions.

---

## Relationship to Audit Architecture

Local meaningful actions should still publish audit-eligible events.

Audit development should support duplicate delivery, redaction, dead-letter handling, and query testing with synthetic data.

---

## Relationship to Observability Architecture

Local runtimes should emit the same structured telemetry shape as production.

Console mode is the default.

External telemetry providers are optional and development-only.

---

## Success Criteria

The local development architecture is successful when:

```text
a clean checkout can be bootstrapped through one command
unsupported tool versions fail clearly
pnpm is the only package manager
core development starts without production credentials
PostgreSQL starts through Docker Compose
migrations run reproducibly
seed data is deterministic
frontend and API support hot reload
Discord behavior is testable without live Discord
real Discord development uses isolated credentials
AI behavior is testable without a paid provider
email behavior is testable without sending real email
queue redelivery and idempotency can be tested
request and trace IDs are visible locally
logs redact secrets
local resets refuse unsafe database targets
CI commands have local equivalents
PostgreSQL and CockroachDB compatibility can be validated
full validation can run before a pull request
local diagnostics are useful and safe to share
Docker and optional Kubernetes workflows remain viable
new contributors can complete onboarding without undocumented steps
```

---

## Final Standard

Aerealith local development should make the correct architecture the easiest architecture to use.

The standard is:

> Every Aerealith contributor can bootstrap a safe, deterministic, observable development environment from a clean checkout; run only the services required for the current task; use disposable local infrastructure and synthetic data; exercise real contracts, authentication, authorization, approvals, events, audit, and provider boundaries; rely on fake adapters by default; opt into external providers only with development credentials and explicit warnings; reproduce migrations and tests; correlate failures through logs and traces; match CI behavior; and reset the environment without risking production systems or data.
