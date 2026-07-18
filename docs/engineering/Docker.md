# Docker

Status: Draft
Owner: SinLess Games LLC
Last Updated: 2026-07-13
Security Classification: Internal Engineering
Primary Runtime: Node.js 24.x
Package Manager: pnpm
Workspace Orchestration: Nx
Container Runtime: Docker Engine with Docker Compose v2
Supported Deployment Direction: Docker, Kubernetes, Cloudflare-compatible runtimes, and self-hosted environments

Related Engineering Documentation:

- `docs/engineering/Code Style.md`
- `docs/engineering/Testing.md`
- `docs/engineering/TypeScript Standards.md`
- `docs/engineering/Package Management.md`
- `docs/engineering/Monorepo Rules.md`
- `docs/engineering/Dependency Rules.md`
- `docs/engineering/Environment Variables.md`
- `docs/engineering/Secrets.md`
- `docs/architecture/Local Development.md`
- `docs/engineering/Git Workflow.md`
- `docs/engineering/Security Practices.md`
- `docs/engineering/Release Process.md`

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
- `docs/architecture/Local Development.md`

Related RFCs:

- `docs/rfcs/0002-monorepo-library-boundaries.md`
- `docs/rfcs/0008-configuration-and-secrets-model.md`
- `docs/rfcs/0010-api-envelope-request-and-trace-id-propagation.md`
- `docs/rfcs/0011-event-envelope-audit-model-and-idempotency.md`
- `docs/rfcs/0013-provider-abstraction-and-integration-interface.md`
- `docs/rfcs/0017-observability-trace-propagation-and-alerting.md`

---

## Purpose

This document defines the Docker and container engineering standards for Aerealith AI.

It governs how contributors:

```text
create Dockerfiles
build container images
organize build contexts
install workspace dependencies
package deployable applications
run local infrastructure
configure Docker Compose
inject environment variables
mount secrets
create health checks
handle process signals
run as non-root
scan container images
generate software bills of materials
publish images
tag releases
promote images between environments
test containers
debug containers
operate containers
prepare services for Kubernetes
support self-hosted deployment
```

The objective is to make Aerealith containers:

```text
reproducible
secure
minimal
portable
observable
immutable
non-root
environment-neutral
easy to test
easy to operate
compatible with self-hosting
ready for Kubernetes
```

The guiding rule is:

> Every Aerealith deployable service must have a documented, reproducible, production-capable container build that contains only the application and runtime dependencies it requires, runs without elevated privileges, accepts configuration at runtime, exposes meaningful health information, shuts down safely, and can be promoted unchanged between environments.

Docker is a deployment boundary.

It must not become a workaround for unclear application architecture.

---

## Core Principles

Aerealith container engineering follows these principles:

```text
Every deployable service has a Dockerfile.
Images are built from committed source and a frozen lockfile.
Images are immutable after build.
Production secrets are never baked into images.
Production configuration is injected at runtime.
Containers run as non-root.
Images contain only required runtime files.
Build and runtime stages are separated.
Base images are pinned and reviewed.
Health checks reflect actual runtime readiness.
Signals are handled correctly.
Processes shut down gracefully.
Writable filesystem access is minimized.
Persistent state lives outside application containers.
Logs are written to stdout and stderr.
Telemetry remains provider-neutral.
Images are scanned before release.
Release images are traceable to source commits.
The same image is promoted across environments.
Containers remain usable outside Aerealith-managed infrastructure.
```

---

## Scope

This standard applies to:

```text
frontend applications
API services
background workers
scheduled workers
Discord gateway runtimes
integration runtimes
notification workers
audit consumers
workflow workers
migration jobs
administrative command-line jobs
future provider-specific runtimes
```

It also applies to supporting local infrastructure defined through Docker Compose.

Examples:

```text
PostgreSQL
CockroachDB
OpenTelemetry Collector
Grafana
Loki
Tempo
Pyroscope
local mail sink
test infrastructure
```

Third-party images do not require Aerealith-authored Dockerfiles.

They do require:

```text
pinned versions
configuration review
security scanning
health checks where practical
documented ownership
```

---

## Containerization Requirement

Every independently deployable Aerealith application must have a Dockerfile.

Examples:

```text
apps/frontend/Dockerfile
apps/services/api/Dockerfile
apps/services/workers/Dockerfile
apps/services/scheduled/Dockerfile
apps/integrations/discord/Dockerfile
```

A service may use a generated Dockerfile only when:

```text
the generator is committed
the generated result is deterministic
the output follows this standard
the output can be reviewed
```

A service primarily deployed to Cloudflare must still define a container-compatible execution path when the service architecture supports self-hosting.

The container path may use:

```text
a Node.js runtime adapter
an HTTP compatibility runtime
a self-hosted gateway
a provider-neutral service implementation
```

Cloudflare-specific bindings must not become impossible-to-replace assumptions inside the service core.

---

## Containerization Goals

Containerization should provide:

```text
repeatable builds
consistent runtime versions
portable deployment
local integration testing
self-hosting support
Kubernetes compatibility
clear process boundaries
runtime isolation
reliable rollback
```

Containerization should not require:

```text
production credentials during build
production database connectivity during build
network access during runtime startup beyond declared dependencies
repository source inside the runtime image
development tooling in production
root privileges
```

---

## Non-Goals

Docker does not replace:

```text
application configuration validation
authentication
authorization
secret management
service discovery
database migration planning
observability
backup and recovery
Kubernetes policy
network security
```

A container image being isolated does not make unsafe application behavior safe.

A container image passing a vulnerability scanner does not prove the application is secure.

---

## Image Architecture

A production image should contain:

```text
application build output
production runtime dependencies
required static assets
configuration schema
health-check implementation
runtime entry point
license or attribution files when required
```

A production image should not contain:

```text
Git history
source-control credentials
.env files
production secrets
test fixtures
coverage output
local development tools
package-manager cache
compiler cache
unused workspace packages
unrelated applications
private documentation
```

---

## Multi-Stage Builds

Production Dockerfiles must use multi-stage builds unless a simpler image is demonstrably equivalent.

Recommended stages:

```text
base
dependencies
build
production-dependencies
runtime
```

A smaller service may combine some stages.

The separation must still preserve:

```text
reproducible installation
development dependency removal
minimal runtime output
safe secret handling
```

---

## Example Multi-Stage Flow

```mermaid
flowchart LR
  Base["Pinned Node.js Base"]
  Dependencies["Install Workspace Dependencies"]
  Build["Build Nx Project"]
  Deploy["Create Production Deployment"]
  Runtime["Minimal Non-Root Runtime Image"]

  Base --> Dependencies
  Dependencies --> Build
  Build --> Deploy
  Deploy --> Runtime
```

---

## Base Image Policy

Base images must be:

```text
official or explicitly approved
actively maintained
compatible with Node.js 24.x
compatible with required native packages
scanned
pinned to an approved version
```

Recommended base family:

```text
Debian Bookworm slim or the currently approved Debian slim release
```

Example:

```dockerfile
FROM node:24-bookworm-slim
```

Release builds should eventually pin base images by digest.

Example direction:

```dockerfile
FROM node:24-bookworm-slim@sha256:<approved-digest>
```

The tag communicates intent.

The digest guarantees the exact image.

---

## Base Image Selection

Use Debian-based slim images by default because they generally provide:

```text
predictable glibc compatibility
broad native-package support
familiar debugging behavior
consistent certificate handling
```

Alpine may be used only after compatibility testing.

Alpine introduces considerations such as:

```text
musl instead of glibc
native module compatibility
different debugging tools
different binary availability
```

Distroless images may be evaluated later for specific stable services.

They should not be adopted before:

```text
debugging workflow exists
certificate handling is verified
health checks work
signal behavior is validated
native dependencies are compatible
```

---

## Base Image Updates

Base images should be updated through controlled automation.

Updates require:

```text
container build
vulnerability scan
runtime smoke test
health test
signal test
database connectivity test
provider compatibility test where relevant
```

A base image update may change:

```text
CA certificates
system libraries
time-zone data
native module behavior
shell availability
```

---

## One Primary Process

A production container should normally run one primary application process.

Examples:

```text
API process
Discord gateway process
workflow worker process
scheduled worker process
frontend server
```

Do not run unrelated services in one container.

Avoid:

```text
API plus PostgreSQL
API plus Discord gateway
worker plus cron daemon
frontend plus database
```

Separate processes provide clearer:

```text
health
scaling
restarts
resource limits
logs
ownership
```

---

## Process Supervisors

A process supervisor should not be required for ordinary Aerealith service containers.

Docker or Kubernetes owns process restart.

A supervisor may be justified only when the service genuinely requires multiple cooperating child processes that cannot be separated.

Such an exception requires architecture review.

---

## Init Process

Containers should use an init process when the application may create child processes or require zombie reaping.

Docker Compose may use:

```yaml
init: true
```

Production images may use a small approved init implementation when needed.

Node.js services that do not create child processes may run directly as PID 1 if signal handling is tested.

---

## Node.js Runtime

Node.js containers must use the approved Node.js 24.x runtime.

The runtime version should match:

```text
package.json engines
.node-version
.nvmrc
CI
local development
```

Version drift between development, CI, and containers is prohibited.

---

## Corepack and pnpm

Build stages should use Corepack to activate the pinned pnpm version.

```dockerfile
RUN corepack enable
```

The pnpm version remains defined by:

```text
packageManager in package.json
```

Do not globally install an arbitrary pnpm version.

Avoid:

```dockerfile
RUN npm install --global pnpm
```

unless required by a narrowly documented compatibility issue.

---

## Frozen Installation

Container builds must install dependencies using the committed lockfile.

```dockerfile
RUN pnpm install --frozen-lockfile
```

A container build must fail when:

```text
package manifests and lockfile disagree
the required pnpm version is unavailable
dependency integrity validation fails
```

Do not use:

```text
--no-frozen-lockfile
latest dependency resolution
lockfile regeneration
```

inside release builds.

---

## Build Context

The Docker build context should be as narrow as practical.

The repository root may remain the build context for Nx monorepo builds.

A `.dockerignore` must exclude unnecessary content.

Recommended `.dockerignore` direction:

```dockerignore
.git
.github
.vscode
.idea
node_modules
dist
coverage
.nx
.cache
.tmp
.env
.env.*
!.env.example
*.log
docs
artifacts
reports
playwright-report
test-results
```

Documentation may be included when required for package licensing or published artifacts.

---

## `.dockerignore` Rules

The ignore file should prevent:

```text
secret files entering build context
large caches slowing builds
host node_modules entering images
Git metadata entering layers
test artifacts entering runtime images
```

The build context itself may be uploaded to a remote builder.

A file excluded from the final image may still be exposed if it was included in the build context.

Secret files must be excluded before the build starts.

---

## Monorepo Build Strategy

Docker builds should target one Nx project at a time.

Example:

```bash
pnpm nx build service-api
```

The build should not package every application merely because they share a repository.

Each container should include only the dependency graph required by its target.

Potential strategies:

```text
Nx project graph
pnpm deploy
workspace pruning
generated deployment manifests
```

---

## Workspace Manifest Copying

Dependency-layer caching requires package manifests to be copied before source where practical.

In a monorepo, all required workspace manifests must be available before installation.

A generated workspace-pruning step may create a minimal build context containing:

```text
root package.json
pnpm-lock.yaml
pnpm-workspace.yaml
target package.json
dependent workspace package manifests
required configuration files
```

The pruning process must follow the Nx dependency graph.

It must not omit hidden runtime dependencies.

---

## `pnpm deploy`

`pnpm deploy` may be used to create a portable production dependency tree.

Example direction:

```bash
pnpm --filter @aerealith/service-api deploy \
  --prod \
  /deployment/service-api
```

The deployment output must be tested for:

```text
workspace dependencies
ESM package exports
NodeNext import extensions
native modules
optional dependencies
production dependency classification
```

---

## Nx Pruning Direction

Aerealith may provide a repository script such as:

```bash
pnpm container:prepare service-api
```

The script may:

```text
resolve the Nx dependency graph
copy required package manifests
build the project
create a production dependency tree
copy only runtime assets
generate image metadata
```

This script must remain deterministic.

---

## Dockerfile Location

Each application should own its Dockerfile.

Recommended:

```text
apps/services/api/Dockerfile
apps/services/workers/Dockerfile
apps/integrations/discord/Dockerfile
apps/frontend/Dockerfile
```

Shared Docker resources may live under:

```text
docker/
├── base/
├── scripts/
├── health/
├── compose/
└── observability/
```

Do not hide all application-specific container behavior in one giant root Dockerfile.

---

## Dockerfile Naming

The default production Dockerfile is:

```text
Dockerfile
```

Additional files may include:

```text
Dockerfile.dev
Dockerfile.test
Dockerfile.migration
```

Use additional Dockerfiles only when build targets cannot be expressed clearly through stages.

Prefer named build stages over many nearly identical files.

---

## Example Node.js Service Dockerfile

```dockerfile
# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim AS base

ENV NODE_ENV=production
ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"

WORKDIR /workspace

RUN corepack enable

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/services/api/package.json apps/services/api/package.json
COPY libs/contracts/package.json libs/contracts/package.json
COPY libs/core/package.json libs/core/package.json
COPY libs/db/package.json libs/db/package.json
COPY libs/observability/package.json libs/observability/package.json

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM dependencies AS build

ENV NODE_ENV=development

COPY apps/services/api apps/services/api
COPY libs libs
COPY tools tools
COPY eslint.config.mjs ./
COPY tsconfig*.json ./

RUN pnpm nx build service-api

RUN pnpm --filter @aerealith/service-api deploy \
    --prod \
    /deployment/service-api

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV AEREALITH_ENVIRONMENT=production

WORKDIR /app

RUN groupadd \
      --system \
      --gid 10001 \
      aerealith \
    && useradd \
      --system \
      --uid 10001 \
      --gid aerealith \
      --home-dir /app \
      --shell /usr/sbin/nologin \
      aerealith

COPY --from=build \
  --chown=aerealith:aerealith \
  /deployment/service-api \
  /app

USER 10001:10001

EXPOSE 8787

CMD ["node", "dist/main.js"]
```

The exact build output path should match the implemented Nx target.

---

## Dockerfile Style

Dockerfiles should:

```text
use uppercase instructions
group related commands
use JSON-array CMD and ENTRYPOINT
quote shell variables
use explicit working directories
avoid unnecessary packages
clean package-manager metadata
copy files intentionally
set ownership during COPY where practical
```

Avoid:

```dockerfile
CMD node dist/main.js
```

Prefer:

```dockerfile
CMD ["node", "dist/main.js"]
```

JSON-array form preserves signal behavior and argument boundaries.

---

## Shell Safety

Complex `RUN` commands should use safe shell behavior.

Example:

```dockerfile
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
```

Or use portable commands that fail clearly.

Avoid long shell pipelines whose failures are hidden.

Build scripts should preferably live in tested repository scripts rather than enormous Dockerfile commands.

---

## Package Installation

Operating-system packages should be installed with:

```text
--no-install-recommends
```

and package metadata should be removed in the same layer.

Example:

```dockerfile
RUN apt-get update \
    && apt-get install \
      --yes \
      --no-install-recommends \
      ca-certificates \
      curl \
    && rm -rf /var/lib/apt/lists/*
```

Do not install debugging tools in production images by default.

---

## Build Tools

Compilers and native build tools belong only in build stages.

Examples:

```text
gcc
g++
make
python
pkg-config
```

The runtime image should not include them unless required during execution.

---

## Native Dependencies

Native Node.js dependencies require validation against:

```text
Node.js 24.x
selected base image
CPU architecture
glibc or musl
container build platform
production deployment platform
```

Native dependencies must be rebuilt in a compatible Linux build stage.

Do not copy host-built `node_modules` into Linux containers.

---

## Multi-Architecture Images

Aerealith images should eventually support:

```text
linux/amd64
linux/arm64
```

Multi-architecture support is especially useful for:

```text
self-hosting
cloud ARM instances
Apple Silicon development
home labs
```

Every architecture in a manifest must pass:

```text
build
startup
health
smoke tests
```

Do not publish an architecture merely because the build completed.

---

## BuildKit

Docker BuildKit should be used for production builds.

BuildKit supports:

```text
cache mounts
secret mounts
SSH mounts
improved layer execution
provenance
SBOM generation
```

Recommended syntax declaration:

```dockerfile
# syntax=docker/dockerfile:1.7
```

The approved syntax version should be pinned and reviewed.

---

## Build Caches

Build cache may be used for:

```text
pnpm store
Nx cache
compiler cache
native build cache
```

Example:

```dockerfile
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile
```

Caches must not contain:

```text
production secrets
registry publish credentials
provider credentials
private user data
```

Caches are performance aids.

They are not authoritative build inputs.

---

## Nx Cache in Docker

Nx cache may be used during builds when:

```text
inputs are accurate
outputs are deterministic
remote cache access is trusted
credentials are protected
```

Remote cache tokens must be supplied through BuildKit secrets or approved CI mechanisms.

They must not be persisted in image layers.

---

## Build Secrets

Build secrets must use ephemeral secret mounts.

Example direction:

```dockerfile
RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN="$(cat /run/secrets/npm_token)" \
    pnpm install --frozen-lockfile
```

Do not use:

```dockerfile
ARG NPM_TOKEN
ENV NPM_TOKEN=${NPM_TOKEN}
```

for sensitive registry tokens.

Build arguments may be visible in:

```text
image history
build logs
metadata
remote builder records
```

---

## Build Arguments

Build arguments may be used only for non-secret build configuration.

Appropriate examples:

```text
application version
commit SHA
build timestamp
public frontend build variables
target architecture
```

Example:

```dockerfile
ARG AEREALITH_BUILD_COMMIT
ARG AEREALITH_SERVICE_VERSION
```

Secrets are not build arguments.

---

## Runtime Configuration

Runtime environment variables follow:

```text
docs/engineering/Environment Variables.md
```

Application configuration must be injected at runtime.

Examples:

```text
AEREALITH_ENVIRONMENT
AEREALITH_DATABASE_URL
AEREALITH_DATABASE_DIALECT
AEREALITH_LOG_LEVEL
AEREALITH_DISCORD_MODE
AEREALITH_AI_PROVIDER
```

A container image should not require rebuilding to change server-side configuration.

---

## Configuration Validation

The container process must validate configuration before becoming ready.

Startup sequence:

```text
load environment
load secret files
parse primitive values
validate schema
validate cross-field policy
initialize dependencies
become ready
```

Invalid configuration should:

```text
produce a safe error
exit non-zero
remain unready
avoid partial service startup
```

---

## Secrets

Runtime secrets should enter containers through:

```text
Docker secrets
Kubernetes Secrets
External Secrets
Vault
Cloudflare secret bindings
approved orchestrator secret injection
```

Local development may use ignored environment files.

Production secrets must not be placed in:

```text
Dockerfiles
image layers
Compose files committed to Git
image labels
build arguments
health responses
logs
```

---

## Secret Files

A container may receive secret files through read-only mounts.

Example:

```text
AEREALITH_SECURITY_SIGNING_KEY_FILE=/run/secrets/aerealith_signing_key
```

The application must reject ambiguous configuration when both are set:

```text
AEREALITH_SECURITY_SIGNING_KEY
AEREALITH_SECURITY_SIGNING_KEY_FILE
```

---

## Docker Secrets Example

```yaml
services:
  api:
    image: ghcr.io/sinless-games/aerealith-service-api:${AEREALITH_IMAGE_TAG}
    secrets:
      - database_url
      - auth_secret
    environment:
      AEREALITH_DATABASE_URL_FILE: /run/secrets/database_url
      AEREALITH_AUTH_SECRET_FILE: /run/secrets/auth_secret

secrets:
  database_url:
    file: ./secrets/database-url.txt

  auth_secret:
    file: ./secrets/auth-secret.txt
```

Local secret files must be excluded from Git.

---

## Non-Root Execution

Production containers must run as a non-root user.

Recommended numeric identity:

```text
UID 10001
GID 10001
```

Numeric IDs provide more predictable behavior across orchestrators.

Example:

```dockerfile
USER 10001:10001
```

The runtime user should:

```text
own only required application files
lack a login shell
lack sudo
lack package-manager privileges
```

---

## File Ownership

Use `COPY --chown` where supported.

```dockerfile
COPY --from=build \
  --chown=10001:10001 \
  /deployment/service-api \
  /app
```

Avoid broad runtime operations such as:

```dockerfile
RUN chown -R 10001:10001 /
```

Only application-owned paths should be writable.

---

## Read-Only Filesystem

Production containers should support a read-only root filesystem where practical.

Writable paths should be explicit.

Potential writable paths:

```text
/tmp
runtime socket directory
temporary upload staging
specific cache directory
```

Docker Compose example:

```yaml
services:
  api:
    read_only: true
    tmpfs:
      - /tmp:size=64m,mode=1777
```

Application state must not depend on the writable container layer.

---

## Temporary Files

Temporary files should use:

```text
/tmp
an explicitly mounted temporary directory
external object storage
```

Temporary data should be:

```text
bounded
cleaned
non-secret where possible
deleted after use
```

Large uploads should not be buffered indefinitely in the container filesystem.

---

## Persistent State

Application containers must remain stateless wherever practical.

Persistent state belongs in:

```text
PostgreSQL
CockroachDB
object storage
queue system
external cache
approved volume-backed service
```

Do not store durable state in:

```text
container writable layer
application source directory
temporary directory
```

---

## Volumes

Named volumes are appropriate for local infrastructure.

Examples:

```text
PostgreSQL data
CockroachDB data
local observability data
mail sink data where persistence is useful
```

Application services should not require persistent volumes unless the architecture explicitly owns local durable files.

---

## Volume Ownership

Volume-mounted paths must work with the non-root runtime UID and GID.

Do not solve permission problems by running the application as root.

Preferred solutions:

```text
initialize volume ownership
use orchestrator security context
use an init container
use a compatible volume driver
```

---

## Network Binding

Containers should listen on:

```text
0.0.0.0
```

inside the container when external access is expected.

Local host development processes may bind to:

```text
127.0.0.1
```

A service binding only to `localhost` inside a container will not be reachable through normal container networking.

---

## Ports

Container ports should be documented.

Recommended service defaults:

| Service                 | Container Port |
| ----------------------- | -------------: |
| Frontend                |         `3000` |
| API                     |         `8787` |
| Discord Health          |         `4001` |
| Worker Health           |         `4002` |
| Scheduled Worker Health |         `4003` |
| OpenTelemetry gRPC      |         `4317` |
| OpenTelemetry HTTP      |         `4318` |

`EXPOSE` documents intended ports.

It does not publish them.

---

## Port Configuration

Services should accept a validated port variable.

Example:

```text
AEREALITH_PORT=8787
```

The default container port should remain stable.

Orchestrators may map external ports independently.

---

## Container Networking

Docker Compose services should use internal service names.

Example:

```text
postgres
api
discord
worker
otel-collector
```

Application configuration may use:

```text
postgresql://aerealith:...@postgres:5432/aerealith_local
```

Do not use container IP addresses.

Container IP addresses are ephemeral.

---

## Network Segmentation

Compose should separate networks when useful.

Potential networks:

```text
edge
application
data
observability
```

Example:

```yaml
networks:
  edge:
  application:
    internal: true
  data:
    internal: true
```

Only services that require a network should join it.

---

## Database Exposure

Database ports should not be publicly exposed in production.

Local Compose may publish them to localhost for development.

Example:

```yaml
ports:
  - '127.0.0.1:5432:5432'
```

Avoid:

```yaml
ports:
  - '5432:5432'
```

when unrestricted LAN exposure is unnecessary.

---

## Health Checks

Every long-running service must expose health.

Recommended endpoints:

```text
/health/live
/health/ready
/health/dependencies
```

### Liveness

Indicates:

```text
the process is alive
the event loop is responsive
```

### Readiness

Indicates:

```text
the service is configured
required dependencies are available
migrations are compatible
the service can safely accept work
```

### Dependency Health

May report normalized safe status for:

```text
database
queue
provider
telemetry
credential state
```

---

## Docker Health Checks

Docker health checks should test a meaningful local endpoint.

Example:

```dockerfile
HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=20s \
  --retries=3 \
  CMD ["node", "dist/health-check.js"]
```

A Node.js health script avoids requiring `curl` in the runtime image.

---

## Health Check Rules

Health checks should:

```text
complete quickly
avoid side effects
avoid provider mutations
avoid leaking secrets
use bounded timeouts
distinguish live from ready
```

A health check should not perform expensive full-system diagnostics every few seconds.

---

## Readiness and Optional Providers

Optional provider failure should not make the entire service unready unless the service exists solely for that provider.

Examples:

```text
AI unavailable -> API may remain ready with AI degraded
Datadog unavailable -> service remains ready
Discord token invalid -> Discord runtime remains unready
database unavailable -> database-backed API remains unready
```

---

## Startup Probes

Long initialization should use a startup grace period.

Potential reasons:

```text
database connection
migration verification
Discord gateway initialization
cache warming
large module registry validation
```

The health configuration should avoid restarting a healthy service before startup completes.

---

## Graceful Shutdown

Services must handle:

```text
SIGTERM
SIGINT
```

Shutdown behavior should:

```text
stop accepting new work
mark readiness false
stop queue consumption
finish safe in-flight operations
release leases
close provider connections
close database pools
flush telemetry
exit within the configured timeout
```

---

## Shutdown Timeout

Recommended variable:

```text
AEREALITH_SHUTDOWN_TIMEOUT_MS
```

The value must be:

```text
bounded
documented
less than the orchestrator termination grace period
```

The process should force exit only after logging the safe timeout condition.

---

## Node.js Signal Handling

Example direction:

```ts
const shutdownSignals = ['SIGTERM', 'SIGINT'] as const

for (const signal of shutdownSignals) {
  process.once(signal, () => {
    void runtime.shutdown(signal)
  })
}
```

The shutdown implementation must be idempotent.

Multiple signals should not initiate duplicate teardown.

---

## Queue Consumer Shutdown

Workers should:

```text
stop leasing new work
finish or safely abandon in-flight work
extend visibility when required
record incomplete attempts
release worker leases
```

A forced shutdown must not silently mark unfinished work complete.

---

## Discord Runtime Shutdown

The Discord runtime should:

```text
stop accepting new interaction work
disconnect gateway sessions safely
flush pending acknowledgments where possible
persist shard state where required
close REST resources
```

Shutdown should not cause duplicate provider actions after restart.

---

## Logging

Containers must write logs to:

```text
stdout
stderr
```

Do not require log files inside the container.

Structured production logs should use:

```text
JSON
```

Local Compose may use pretty logs when explicitly configured.

---

## Log Stream Rules

Recommended direction:

```text
stdout -> normal structured application logs
stderr -> process-level startup and fatal failures
```

Libraries should use the shared logger.

They should not write arbitrary console output.

---

## Log Rotation

Docker or the orchestrator owns log collection and rotation.

Application containers should not run their own log-rotation daemon.

Local Docker logging should use bounded configuration.

Example:

```yaml
logging:
  driver: json-file
  options:
    max-size: 10m
    max-file: '3'
```

---

## Observability

Containerized services should emit:

```text
structured logs
OpenTelemetry traces
metrics
profiles where enabled
health state
build metadata
```

Telemetry configuration follows:

```text
docs/architecture/Observability Architecture.md
```

Feature code must not depend directly on Docker-specific telemetry.

---

## OpenTelemetry Sidecar or Collector

Services may export telemetry to:

```text
local OpenTelemetry Collector
shared cluster collector
Grafana Cloud
Datadog adapter
```

Compose example:

```text
AEREALITH_OBSERVABILITY_OTEL_ENDPOINT=http://otel-collector:4318
```

Failure of an optional telemetry exporter must not crash the application.

---

## Image Labels

Release images should use OCI labels.

Recommended labels:

```text
org.opencontainers.image.title
org.opencontainers.image.description
org.opencontainers.image.version
org.opencontainers.image.revision
org.opencontainers.image.created
org.opencontainers.image.source
org.opencontainers.image.licenses
```

Example:

```dockerfile
LABEL org.opencontainers.image.title="Aerealith API"
LABEL org.opencontainers.image.source="https://github.com/SinLess-Games/Aerealith"
LABEL org.opencontainers.image.revision="${AEREALITH_BUILD_COMMIT}"
LABEL org.opencontainers.image.version="${AEREALITH_SERVICE_VERSION}"
```

Do not place secrets or private infrastructure URLs in labels.

---

## Image Names

Recommended registry names:

```text
ghcr.io/sinless-games/aerealith-frontend
ghcr.io/sinless-games/aerealith-service-api
ghcr.io/sinless-games/aerealith-service-workers
ghcr.io/sinless-games/aerealith-service-scheduled
ghcr.io/sinless-games/aerealith-integration-discord
```

Image names should align with monorepo project names.

---

## Image Tags

Recommended tags:

```text
semantic release version
commit SHA
branch-safe development tag
environment promotion alias where required
```

Examples:

```text
0.6.0
sha-31ab47f
main
```

Production deployment should reference:

```text
immutable digest
or immutable semantic version plus verified digest
```

Do not deploy production from:

```text
latest
unverified mutable tag
local image name
```

---

## `latest` Tag

The `latest` tag may exist as a convenience for local or public discovery.

It must not be the authoritative production deployment reference.

Production should use:

```text
image digest
release version
```

---

## Image Promotion

The same built image should be promoted through:

```text
test
preview
staging
production
```

Do not rebuild the application separately for every environment.

Environment-specific runtime configuration should be injected after build.

Frontend build-time public configuration is an exception that requires an explicitly documented strategy.

---

## Frontend Container Strategy

The frontend container strategy depends on the frontend runtime.

Potential forms:

```text
Node.js server-rendered frontend
static assets served by a minimal web server
combined frontend and API runtime
Cloudflare deployment with self-hosted Node adapter
```

The selected form must preserve:

```text
typed API contracts
runtime configuration strategy
health checks
non-root execution
cache headers
security headers
```

---

## Static Frontend Images

A static frontend image may use an approved minimal server.

The build must ensure:

```text
only public configuration enters the bundle
server secrets are absent
source maps follow release policy
security headers are configured
history fallback is correct
```

The web server configuration belongs with the frontend application.

---

## Server-Rendered Frontend Images

A server-rendered frontend container should:

```text
run the framework production server
use production build output
avoid development dependencies
validate server configuration
expose health
handle signals
```

Do not run a development server in production.

---

## API Container Strategy

The API container should:

```text
run one HTTP runtime
bind to the configured port
validate configuration
initialize auth
connect to the database
verify migration compatibility
start telemetry
become ready
```

The API container should not execute destructive migrations automatically in production unless an accepted release design explicitly permits it.

---

## Discord Container Strategy

The Discord runtime container owns:

```text
gateway connection
interaction handling
Discord REST coordination
rate-limit coordination
provider health
```

It should not expose the full gateway or REST client to unrelated containers.

It should expose only safe health and diagnostics endpoints.

---

## Worker Container Strategy

Worker containers should support:

```text
bounded concurrency
queue backpressure
idempotency
graceful shutdown
health
retry safety
```

Concurrency should be configurable:

```text
AEREALITH_WORKER_CONCURRENCY
```

The default must be bounded.

---

## Scheduled Worker Strategy

Scheduled work may run as:

```text
long-running scheduler service
Kubernetes CronJob
Docker Compose scheduled command
external scheduler invoking a container command
```

The job implementation should remain:

```text
idempotent
observable
scope-aware
safe under retry
```

---

## Migration Containers

Database migrations should run through a dedicated command or job.

Example:

```bash
docker run --rm \
  --env-file deployment.env \
  ghcr.io/sinless-games/aerealith-service-api:0.6.0 \
  node dist/migrations/run.js
```

A dedicated migration image may be used when migration tooling should not exist in the main runtime image.

---

## Migration Rules

Migration jobs must:

```text
validate target environment
validate database dialect
acquire a migration lock
report migration status
fail non-zero on error
emit structured logs
avoid starting the application server
```

Production migrations should require controlled release orchestration.

---

## Migration and Application Compatibility

Container releases should support the selected migration strategy.

Preferred direction:

```text
expand schema
deploy compatible application
backfill
switch behavior
contract schema later
```

The application image should not assume a destructive migration completed instantly across every replica.

---

## Docker Compose

Docker Compose supports:

```text
local development
integration testing
self-hosted evaluation
single-host deployment prototypes
```

Compose is not the long-term replacement for Kubernetes where horizontal orchestration is required.

It remains a supported self-hosting path for smaller installations.

---

## Compose File Structure

Recommended structure:

```text
compose.yaml
compose.override.yaml
docker/compose/
├── compose.core.yaml
├── compose.integrations.yaml
├── compose.observability.yaml
├── compose.test.yaml
└── compose.full.yaml
```

The exact structure should avoid excessive duplication.

Profiles may be preferable to many nearly identical files.

---

## Compose Profiles

Recommended profiles:

```text
core
discord
workers
mail
observability
cockroach
full
```

Example:

```bash
docker compose --profile core up -d
docker compose --profile discord up -d
docker compose --profile observability up -d
docker compose --profile full up -d
```

---

## Core Compose Profile

The core profile should include:

```text
PostgreSQL
API where container parity is needed
frontend where container parity is needed
```

Ordinary local development may run application processes on the host while using containers for infrastructure.

---

## Full Compose Profile

The full profile may include:

```text
frontend
API
workers
scheduled workers
Discord runtime
PostgreSQL
CockroachDB compatibility service
OpenTelemetry Collector
Grafana
Loki
Tempo
Pyroscope
local mail sink
```

The full profile should remain optional because it may require substantial resources.

---

## Compose Example

```yaml
name: aerealith

services:
  postgres:
    image: postgres:<approved-version>
    restart: unless-stopped
    environment:
      POSTGRES_DB: aerealith_local
      POSTGRES_USER: aerealith
      POSTGRES_PASSWORD: aerealith_local_only
    ports:
      - 127.0.0.1:5432:5432
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test:
        - CMD-SHELL
        - pg_isready -U aerealith -d aerealith_local
      interval: 10s
      timeout: 5s
      retries: 10
    networks:
      - data

  api:
    build:
      context: .
      dockerfile: apps/services/api/Dockerfile
      target: runtime
    restart: unless-stopped
    environment:
      AEREALITH_ENVIRONMENT: local
      AEREALITH_SERVICE_NAME: service-api
      AEREALITH_PORT: 8787
      AEREALITH_DATABASE_DIALECT: postgresql
      AEREALITH_DATABASE_URL: postgresql://aerealith:aerealith_local_only@postgres:5432/aerealith_local
      AEREALITH_LOG_FORMAT: pretty
    ports:
      - 127.0.0.1:8787:8787
    depends_on:
      postgres:
        condition: service_healthy
    read_only: true
    tmpfs:
      - /tmp:size=64m,mode=1777
    security_opt:
      - no-new-privileges:true
    networks:
      - application
      - data

volumes:
  postgres-data:

networks:
  application:
    internal: true

  data:
    internal: true
```

Production Compose configuration should use real secret injection rather than plain credentials.

---

## `depends_on`

Compose `depends_on` controls startup ordering.

It does not replace:

```text
connection retries
dependency health
readiness
recovery after dependency restart
```

Applications must tolerate a dependency becoming unavailable after startup.

---

## Compose Overrides

Local-only overrides may define:

```text
source mounts
debug ports
pretty logging
development commands
additional published ports
```

Production behavior should not depend on local overrides.

---

## Development Containers

Development containers may include:

```text
source code mounts
development dependencies
debuggers
hot reload
shell tools
```

They must remain clearly separate from production runtime images.

A development image should never be published as a production release.

---

## Source Mounts

Local development may mount source code.

Example:

```yaml
volumes:
  - .:/workspace
  - pnpm-store:/pnpm/store
```

Host `node_modules` should not be mounted into a container with an incompatible operating system or architecture.

---

## Hot Reload

Hot reload containers should use:

```text
development build stage
development command
source mount
isolated dependency volume
```

Example command:

```text
pnpm nx serve service-api
```

Hot reload should not weaken:

```text
authentication
authorization
configuration validation
provider boundaries
```

---

## Debugging

Debug builds may expose a Node.js inspector port.

Example:

```text
9229
```

Inspector ports must bind to localhost unless a secure remote debugging design exists.

Example:

```yaml
ports:
  - 127.0.0.1:9229:9229
```

Do not expose the inspector publicly.

---

## Shell Access

Production containers may not include a full shell.

When debugging requires shell access:

```text
use a debug image
use an ephemeral debug container
use a local reproduction image
```

Do not permanently add broad troubleshooting tools to every runtime image.

---

## Resource Limits

Compose and Kubernetes deployment definitions should declare reasonable resources.

Potential Compose example:

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1g
    reservations:
      cpus: '0.25'
      memory: 256m
```

Compose resource enforcement varies by deployment mode.

Kubernetes remains authoritative for cluster resource policy.

---

## Resource Configuration

Applications should not infer safe concurrency solely from CPU count.

Explicit configuration should control:

```text
worker concurrency
database pool size
provider concurrency
AI request concurrency
Discord shard count
```

Resource defaults should be conservative.

---

## Memory Limits

Node.js may require a configured heap limit in constrained containers.

Example direction:

```text
NODE_OPTIONS=--max-old-space-size=768
```

This should be set only after profiling.

Do not copy one memory setting to every service.

---

## CPU Limits

CPU throttling can affect:

```text
request latency
event-loop health
gateway heartbeats
queue leases
shutdown timing
```

Service SLOs and resource limits must be tested together.

---

## Security Hardening

Production containers should use:

```text
non-root user
read-only root filesystem where possible
no-new-privileges
minimal capabilities
explicit writable mounts
bounded resources
secret mounts
restricted networks
```

---

## Linux Capabilities

Most Node.js services require no extra Linux capabilities.

Drop all capabilities where supported.

Compose direction:

```yaml
cap_drop:
  - ALL
```

Add a capability only when the service has a documented requirement.

Binding to ports above `1024` avoids requiring privileged-port capabilities.

---

## Privileged Containers

Privileged containers are prohibited for Aerealith application services.

Avoid:

```yaml
privileged: true
```

An infrastructure exception requires:

```text
documented operational need
security review
isolated environment
replacement plan
```

---

## Docker Socket

Application containers must not mount:

```text
/var/run/docker.sock
```

The Docker socket provides powerful host control.

Build or deployment tooling that requires Docker access must run in a dedicated trusted job with explicit security controls.

---

## Host Filesystem Mounts

Production containers should not mount arbitrary host directories.

Avoid:

```yaml
volumes:
  - /:/host
  - /etc:/host-etc
```

Necessary mounts must be:

```text
narrow
read-only where possible
documented
reviewed
```

---

## Device Access

Application containers should not access host devices by default.

GPU access may be introduced for optional self-hosted AI inference.

A GPU profile must define:

```text
supported runtime
driver requirements
resource limits
model storage
security isolation
fallback behavior
```

GPU access must not become a requirement for core Aerealith operation.

---

## Seccomp and AppArmor

Production environments should use default or stricter container security profiles.

Custom profiles may be introduced for high-security deployments.

Do not disable seccomp merely to resolve a poorly understood runtime error.

---

## User Namespaces

Rootless Docker or user-namespace remapping is encouraged for self-hosting where operationally practical.

The application image must not depend on host-level root identity.

Numeric non-root UIDs support this direction.

---

## Supply-Chain Security

Container supply-chain controls include:

```text
pinned base images
frozen lockfile
dependency scanning
container scanning
SBOM generation
provenance
image signing
immutable tags
trusted registry
release traceability
```

---

## Container Scanning

Release images should be scanned with:

```text
Trivy
Snyk container scanning where configured
registry-native scanning
```

Scanning should cover:

```text
operating-system packages
Node.js dependencies
application configuration
secrets
misconfigurations
```

---

## Vulnerability Policy

A release should not proceed with an unreviewed:

```text
critical vulnerability
high vulnerability in reachable runtime code
known compromised package
secret in an image layer
```

Findings must be evaluated for:

```text
reachability
runtime exposure
available patch
base image update
application dependency update
mitigation
```

---

## False Positives

A finding may be documented as non-exploitable when:

```text
the vulnerable component is absent from runtime use
the affected feature is disabled
the image package is not reachable
the scanner matched an irrelevant artifact
```

Exceptions require:

```text
owner
reason
evidence
review date
expiration
```

---

## SBOM

Release images should include or publish an SBOM.

Preferred formats:

```text
CycloneDX
SPDX
```

The SBOM should identify:

```text
base image
operating-system packages
Node.js dependencies
workspace packages
versions
licenses
relationships
```

The SBOM should correspond to the exact image digest.

---

## Provenance

Release builds should produce provenance that connects:

```text
source repository
commit
build workflow
builder
image digest
release version
```

Release images should be built in trusted CI.

Developer-built images must not be promoted directly to production.

---

## Image Signing

Aerealith should adopt image signing for production releases.

The signing design should support:

```text
keyless CI signing where available
short-lived identity
verification during deployment
revocation
auditability
```

A deployment should eventually reject unsigned or untrusted production images.

---

## Registry

Approved image registries may include:

```text
GitHub Container Registry
approved cloud registry
private self-hosted registry
```

Registry access should use:

```text
read-only pull credentials
publish credentials limited to release jobs
short-lived credentials where possible
```

---

## Registry Permissions

Pull-request jobs should not receive production publishing credentials.

Release jobs should be the only jobs allowed to:

```text
push release tags
push production aliases
sign images
publish provenance
```

---

## Retention

Registry retention should preserve:

```text
production releases
recent staging releases
incident-relevant images
images referenced by active deployments
```

Temporary pull-request and branch images may use shorter retention.

Do not delete an image still required for rollback.

---

## Build Reproducibility

A release build should be reproducible from:

```text
source commit
Dockerfile
base-image digest
package manifests
pnpm lockfile
build arguments
build tooling version
```

Timestamps and nondeterministic generated content should be controlled where practical.

---

## Build Metadata

Build metadata should include:

```text
service version
commit SHA
build timestamp
repository URL
```

Runtime health may expose safe metadata.

Example:

```json
{
  "service": "service-api",
  "version": "0.6.0",
  "revision": "31ab47f",
  "environment": "production"
}
```

---

## Container Tests

Every deployable container should have automated tests.

Required test categories:

```text
build
startup
configuration failure
health
non-root
signal handling
production dependency pruning
secret absence
runtime smoke test
```

---

## Build Test

The image must build from a clean checkout using:

```text
pinned Node.js
pinned pnpm
frozen lockfile
declared build context
```

A build depending on local uncommitted files is invalid.

---

## Startup Test

The container should start with:

```text
minimum valid configuration
synthetic secrets
test dependencies
```

The test should verify:

```text
process remains running
startup logs are safe
health becomes ready
```

---

## Invalid Configuration Test

The container should fail safely when:

```text
required variable is missing
secret is missing
database dialect is invalid
development bypass is enabled in production
```

The process should:

```text
exit non-zero
avoid becoming ready
avoid printing secrets
```

---

## Non-Root Test

A container test should verify:

```bash
docker run --rm \
  --entrypoint id \
  <image>
```

Expected:

```text
uid is not 0
gid is not 0
```

---

## Read-Only Filesystem Test

Where supported:

```bash
docker run --rm \
  --read-only \
  --tmpfs /tmp \
  <image>
```

The service should start and operate without writing to the root filesystem.

---

## Signal Test

The test should:

```text
start the container
wait for readiness
send SIGTERM
observe readiness change
verify graceful exit
verify exit occurs within timeout
```

Worker tests should verify incomplete work remains retryable.

---

## Health Test

Health tests should verify:

```text
liveness before dependency readiness
readiness after dependencies initialize
readiness failure during required dependency outage
recovery after dependency restoration
```

---

## Secret Absence Test

Image inspection should verify known test-secret markers are absent.

Search:

```text
filesystem layers
image history
environment defaults
labels
build metadata
```

A synthetic marker may be used to detect accidental persistence.

---

## Production Dependency Test

The runtime image should start without:

```text
devDependencies
TypeScript compiler
Vitest
Playwright
ESLint
source test files
```

This validates dependency classification.

---

## Container Structure Test

Automated checks may verify:

```text
expected user
expected ports
expected entry point
required labels
forbidden files
file permissions
```

Potential tooling:

```text
container-structure-test
custom Node.js validation
shell-based inspection in CI
```

---

## Integration Tests

Compose-based integration tests may start:

```text
database
API
workers
fake providers
mail sink
telemetry collector
```

Tests should verify real container networking and startup behavior.

---

## End-to-End Container Tests

Release candidates should run selected E2E flows against built images rather than development servers.

Example flow:

```text
frontend container
→ API container
→ PostgreSQL
→ worker container
→ fake provider
→ audit record
→ notification
```

---

## Database Compatibility Tests

Container validation should cover:

```text
PostgreSQL
CockroachDB compatibility suite
migration job
repository behavior
transaction retry behavior
```

CockroachDB need not run in every fast pull-request build.

It should run in scheduled, main-branch, or release validation according to test policy.

---

## Compose Validation

CI should run:

```bash
docker compose config
```

This detects:

```text
invalid YAML
missing interpolation
invalid references
configuration merge errors
```

Secrets should not be required merely to parse the Compose file.

---

## Dockerfile Linting

Dockerfiles should be linted.

Potential checks include:

```text
unpinned packages
invalid instruction order
missing user
shell-form CMD
secret-like build arguments
large copy contexts
```

Hadolint or equivalent tooling may be used.

Scanner findings require review rather than blind suppression.

---

## CI Build Strategy

Recommended container CI stages:

```text
1. Validate Dockerfiles.
2. Validate Compose.
3. Build target images.
4. Run container unit smoke tests.
5. Run security scans.
6. Generate SBOM.
7. Run integration tests.
8. Publish immutable commit tags.
9. Publish release tags after approval.
10. Sign images and publish provenance.
```

---

## Pull Request Builds

Pull-request builds may:

```text
build affected images
run smoke tests
run scans
avoid publishing or publish short-lived internal tags
```

Untrusted pull requests must not receive:

```text
registry publish credentials
production secrets
signing authority
deployment credentials
```

---

## Main Branch Builds

Main branch builds may publish:

```text
immutable commit-SHA tags
development aliases
SBOMs
provenance
```

Promotion to staging or production should use an approved image digest.

---

## Release Builds

Release builds should publish:

```text
semantic version tag
commit SHA tag
image digest
SBOM
provenance
signature
release notes
```

Release builds must not mutate source or lockfiles.

---

## Affected Image Builds

Nx should identify affected applications.

Example:

```bash
pnpm nx affected -t container
```

Shared changes may require rebuilding many images.

Examples:

```text
core
contracts
observability
base TypeScript configuration
pnpm lockfile
shared Docker tooling
```

---

## Container Target

Every deployable Nx project should define a `container` target.

Conceptual example:

```json
{
  "targets": {
    "container": {
      "executor": "nx:run-commands",
      "options": {
        "command": "docker build --file apps/services/api/Dockerfile --tag aerealith/service-api:local ."
      }
    }
  }
}
```

A shared executor or script should eventually replace repeated command strings.

---

## Container Test Target

Recommended:

```text
container
container:test
container:scan
container:sbom
```

Example:

```bash
pnpm nx run service-api:container
pnpm nx run service-api:container:test
pnpm nx run service-api:container:scan
```

---

## Root Scripts

Recommended root script direction:

```json
{
  "scripts": {
    "container:build": "node tools/scripts/build-container.mjs",
    "container:test": "node tools/scripts/test-container.mjs",
    "container:scan": "node tools/scripts/scan-container.mjs",
    "container:sbom": "node tools/scripts/generate-container-sbom.mjs",
    "container:validate": "node tools/scripts/validate-containers.mjs",
    "compose:validate": "docker compose config --quiet"
  }
}
```

Exact commands should be finalized with the repository tooling implementation.

---

## Local Build Commands

Examples:

```bash
docker build \
  --file apps/services/api/Dockerfile \
  --tag aerealith/service-api:local \
  .
```

Through Nx:

```bash
pnpm nx run service-api:container
```

Build without cache for validation:

```bash
docker build \
  --no-cache \
  --file apps/services/api/Dockerfile \
  --tag aerealith/service-api:clean-test \
  .
```

---

## Local Runtime Commands

Example:

```bash
docker run --rm \
  --name aerealith-api \
  --env-file .env.local \
  --publish 127.0.0.1:8787:8787 \
  aerealith/service-api:local
```

Do not pass secrets directly on the command line when shell history or process inspection may expose them.

---

## Troubleshooting

Container troubleshooting should proceed from least destructive to most destructive.

Recommended order:

```text
1. Inspect container status.
2. Inspect health.
3. Inspect safe logs.
4. Validate runtime configuration.
5. Inspect networking.
6. Verify dependency health.
7. Verify image digest and version.
8. Recreate the container.
9. Rebuild without cache.
10. Remove local volumes only as a final step.
```

---

## Useful Commands

### List Containers

```bash
docker compose ps
```

### Inspect Logs

```bash
docker compose logs api
```

### Follow Logs

```bash
docker compose logs --follow api
```

### Inspect Container

```bash
docker inspect aerealith-api
```

### Inspect Image History

```bash
docker history aerealith/service-api:local
```

### Check Image Size

```bash
docker image inspect aerealith/service-api:local
```

### Enter a Development Container

```bash
docker compose exec api sh
```

A shell may not exist in the production image.

---

## Container Diagnostics

A diagnostic command may report:

```text
image version
image digest
runtime user
environment classification
service health
dependency health
filesystem mode
available memory
CPU limits
```

It must not report:

```text
secrets
full environment
database credentials
provider tokens
private keys
```

---

## Network Troubleshooting

Useful checks:

```bash
docker compose exec api \
  node -e "fetch('http://postgres:5432').catch(console.error)"
```

Database protocols should be tested through application-specific health tools rather than HTTP assumptions.

Prefer repository diagnostics such as:

```bash
pnpm diagnostics:container service-api
```

---

## Image Size

Image size should be monitored.

Large image size may indicate:

```text
devDependencies included
source files copied unnecessarily
pnpm store included
multiple applications included
build tools left in runtime
large native packages
```

Size is not the only concern.

A slightly larger well-supported image may be safer than an aggressively minimal but fragile image.

---

## Layer Inspection

Unexpected large layers should be investigated.

Common causes:

```text
COPY . .
install cache retained
apt metadata retained
build output duplicated
source and deployment copied together
```

---

## Cache Problems

When builds appear stale:

```text
verify Dockerfile inputs
verify Nx task inputs
verify build output
inspect build logs
rebuild the target stage
use --no-cache only when required
```

Do not disable all caching permanently to hide incorrect input declarations.

---

## Compose Data Reset

A local infrastructure reset may use:

```bash
docker compose down
```

To remove local volumes:

```bash
docker compose down --volumes
```

Volume deletion is destructive.

The repository should provide a guarded wrapper such as:

```bash
pnpm local:clean:data
```

---

## Production Rollback

Rollback should deploy a previously verified image digest.

Rollback requires:

```text
image retained in registry
database schema remains backward-compatible
configuration remains compatible
migration plan supports rollback or forward recovery
```

Do not rebuild an old version from mutable dependency ranges during an incident.

---

## Container Recovery

Container recovery should assume:

```text
containers are disposable
state is external
work is idempotent
leases expire or are released
queue delivery may repeat
```

Restarting a container must not duplicate completed user-visible actions.

---

## Kubernetes Compatibility

Docker images should be Kubernetes-ready.

They should support:

```text
non-root security context
read-only filesystem
liveness probe
readiness probe
startup probe
SIGTERM shutdown
resource limits
runtime configuration
secret files
service discovery
horizontal scaling where supported
```

---

## Kubernetes Security Context

Recommended direction:

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 10001
  runAsGroup: 10001
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL
```

Application images must function under these restrictions.

---

## Kubernetes Probes

Example:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: http

readinessProbe:
  httpGet:
    path: /health/ready
    port: http

startupProbe:
  httpGet:
    path: /health/live
    port: http
  failureThreshold: 30
  periodSeconds: 2
```

Probe values should reflect measured startup and recovery behavior.

---

## Kubernetes Jobs

Migration and maintenance containers should work as Kubernetes Jobs.

They should:

```text
exit successfully when complete
exit non-zero on failure
avoid starting long-running servers
support retries safely
emit structured logs
```

---

## Horizontal Scaling

A containerized service should avoid process-local assumptions that prevent scaling.

Examples:

```text
in-memory session truth
in-memory distributed locks
single-process scheduler ownership
local-only queue state
local rate-limit truth
```

Shared coordination should use:

```text
database
queue
distributed lease
provider-aware coordinator
```

---

## Discord Sharding

Future Discord scaling may require:

```text
shard assignment
session limits
resume state
distributed coordination
per-shard health
```

The Discord container should not assume it will always run as one replica.

The MVP may begin with one replica while preserving an upgrade path.

---

## Self-Hosting

Docker is a primary self-hosting mechanism.

A self-hosted Docker deployment should support:

```text
core platform
PostgreSQL
optional CockroachDB compatibility
Discord integration
workers
email adapter
AI disabled
optional AI provider
local observability
external observability
```

The core platform should not require:

```text
Aerealith-managed Cloudflare account
Aerealith-managed AI provider
Aerealith-managed email provider
production Datadog
production Grafana Cloud
```

---

## Self-Hosted Compose Bundle

A self-hosted bundle should eventually include:

```text
compose.yaml
.env.example
secret setup guide
database initialization guide
upgrade guide
backup guide
health guide
resource recommendations
```

The default bundle should use safe configuration and require users to provide real secrets explicitly.

---

## Self-Hosted Upgrades

A self-hosted upgrade should document:

```text
target image version
required migration
configuration changes
deprecated variables
backup recommendation
rollback compatibility
```

Images should not silently run destructive migrations during ordinary startup.

---

## Backups

Application containers do not own database backups.

Backup jobs may use dedicated containers.

Backup procedures should include:

```text
database backup
object-storage backup where needed
encryption
retention
restore testing
```

A backup process is incomplete until restoration is tested.

---

## Container Architecture Boundaries

Container boundaries should follow application boundaries.

Do not create a new container merely because a folder exists.

Create an independently deployable container when the runtime requires:

```text
independent scaling
persistent connection
different security boundary
different resource profile
different restart behavior
different deployment cadence
```

---

## Application-to-Application Communication

Containers should communicate through:

```text
HTTP contracts
queues
events
provider-neutral service interfaces
```

Applications must not share:

```text
in-process memory
private source imports
host filesystem state
container writable layers
```

---

## Database Access

Only approved backend containers may receive database credentials.

Frontend containers serving static assets must not receive:

```text
database URL
database password
migration credentials
```

Provider-specific runtimes should receive database access only when their architecture requires it.

---

## Least-Privilege Credentials

Each service should receive only the credentials it requires.

Examples:

```text
API database role
worker database role
migration database role
Discord token only in Discord runtime
Resend key only in email adapter
AI key only in AI provider adapter
```

Do not inject the full production secret set into every container.

---

## Container Secret Boundary Tests

Tests should verify:

```text
frontend image receives no server secrets
workflow worker receives no Discord bot token unless it owns the adapter
AI service receives no unrelated provider credentials
migration job receives no Discord or email credentials
```

---

## Container Anti-Patterns

Avoid:

```text
running as root
using latest in production
baking secrets into images
using ARG for secrets
copying the entire repository into runtime images
including devDependencies in production
running several unrelated services in one container
starting provider connections during module import
using host node_modules
writing durable state to the container layer
mounting the Docker socket
using privileged mode
binding debug ports publicly
using health checks that mutate state
running destructive migrations on every startup
rebuilding separately for each environment
using mutable production image tags
ignoring SIGTERM
logging to files inside the container
using wildcard network exposure
```

---

## Valid Container Example

A compliant service image:

```text
uses a pinned Node.js 24 base
installs through Corepack and frozen pnpm lockfile
builds one Nx application
creates a production deployment tree
copies only runtime output
runs as UID 10001
accepts configuration at runtime
exposes a health endpoint
writes logs to stdout
handles SIGTERM
works with a read-only filesystem
contains no secrets
is scanned
has an SBOM
is tagged with version and commit
```

---

## Invalid Container Example

```dockerfile
FROM node:latest

WORKDIR /app

COPY . .

RUN npm install

ENV AEREALITH_DATABASE_URL=postgresql://admin:password@production/database
ENV AEREALITH_DISCORD_BOT_TOKEN=real-token

RUN npm run build

EXPOSE 80

CMD npm start
```

Problems:

```text
unbounded mutable base image
wrong package manager
lockfile not frozen
entire repository copied
production secrets baked into layers
root runtime
shell-form CMD
unclear target application
development dependencies likely retained
no health check
no signal validation
no image metadata
no self-hosting safety
```

---

## Required Dockerfiles

Initial required Dockerfiles:

```text
apps/frontend/Dockerfile
apps/services/api/Dockerfile
apps/services/workers/Dockerfile
apps/services/scheduled/Dockerfile
apps/integrations/discord/Dockerfile
```

Future deployables should add a Dockerfile when created.

Shared logical libraries do not require Dockerfiles.

---

## Required Container Targets

Each deployable should support:

```text
build
container
container:test
container:scan
```

Release-capable applications should additionally support:

```text
container:sbom
container:publish
container:sign
```

Publishing and signing targets should run only in trusted CI.

---

## Container Error Codes

Potential operational error codes:

```text
CONTAINER_CONFIG_INVALID
CONTAINER_SECRET_MISSING
CONTAINER_DATABASE_UNAVAILABLE
CONTAINER_MIGRATION_INCOMPATIBLE
CONTAINER_PROVIDER_UNAVAILABLE
CONTAINER_SHUTDOWN_TIMEOUT
CONTAINER_HEALTH_CHECK_FAILED
CONTAINER_READINESS_FAILED
CONTAINER_FILESYSTEM_READ_ONLY_VIOLATION
CONTAINER_RUNTIME_USER_INVALID
```

Application errors should remain provider-neutral and usable outside Docker.

---

## File Structure

Recommended container tooling structure:

```text
docker/
├── compose/
│   ├── core.yaml
│   ├── integrations.yaml
│   ├── observability.yaml
│   └── test.yaml
├── health/
│   ├── check-http.mjs
│   └── check-worker.mjs
├── scripts/
│   ├── entrypoint.sh
│   └── wait-for-service.mjs
└── security/
    ├── allowed-base-images.json
    └── image-policy.json

tools/scripts/
├── build-container.mjs
├── test-container.mjs
├── scan-container.mjs
├── generate-container-sbom.mjs
├── validate-dockerfiles.mjs
└── validate-compose.mjs
```

Application Dockerfiles remain inside the owning application directories.

---

## Image Policy Registry

A machine-readable image policy may define:

```json
{
  "nodeRuntime": {
    "repository": "node",
    "tag": "24-bookworm-slim",
    "digest": "<approved-digest>",
    "owner": "Developer Experience"
  },
  "postgres": {
    "repository": "postgres",
    "tag": "<approved-version>",
    "digest": "<approved-digest>",
    "owner": "Data Platform"
  }
}
```

The registry supports:

```text
base-image updates
ownership
digest validation
security review
Compose consistency
```

---

## Dockerfile Validation

Automated validation should confirm:

```text
approved base image
approved Node.js version
multi-stage build
frozen pnpm install
non-root runtime
JSON-array command
required labels
no secret-like ENV or ARG
no host node_modules copy
no broad chmod
no privileged runtime assumptions
```

---

## Compose Validation

Automated Compose validation should confirm:

```text
pinned third-party images
localhost-only development port exposure where appropriate
health checks
named volumes
internal networks
no production secrets in plain text
no privileged application containers
no Docker socket mounts
resource guidance
```

---

## Testing Strategy

Docker-related testing should include:

```text
Dockerfile linting
clean image builds
container startup
health checks
readiness transitions
non-root execution
read-only filesystem
signal handling
secret absence
dependency pruning
Compose integration
database compatibility
container scanning
SBOM generation
multi-architecture builds
```

Coverage thresholds apply to repository scripts and container helper code.

Declarative Dockerfiles and Compose files require direct validation rather than code coverage.

---

## Critical Container Tests

Tests must prove:

```text
every deployable has a Dockerfile
every release image uses Node.js 24.x where applicable
every production service runs as non-root
every release build uses the frozen pnpm lockfile
production images do not contain development dependencies
production images do not contain known secret markers
containers handle SIGTERM
health endpoints work
invalid configuration prevents readiness
required dependencies affect readiness
optional provider failure degrades safely
read-only filesystem operation succeeds where required
release images are traceable to source commits
```

---

## Security Review Triggers

Additional security review is required when a Docker change:

```text
changes base image
adds operating-system packages
adds native modules
changes runtime user
adds filesystem mounts
adds device access
adds Linux capabilities
mounts host paths
adds build credentials
changes registry
changes signing
changes secret injection
adds network exposure
```

---

## Pull Request Checklist

A pull request changing a Dockerfile should verify:

```text
the correct application is built
the lockfile is frozen
the build context remains safe
the runtime image remains minimal
the runtime user is non-root
configuration remains runtime-injected
secrets remain absent
health behavior remains correct
signals remain handled
container tests pass
security scans are reviewed
image-size change is understood
```

---

## New Service Checklist

Before a new deployable service is accepted:

```text
add application Dockerfile
add .dockerignore coverage
add Nx container target
add runtime configuration schema
add non-root user
add health endpoints
add graceful shutdown
add container tests
add image name
add OCI labels
add scan target
add SBOM target
add Compose profile where required
add Kubernetes compatibility notes
add self-hosting documentation
```

---

## Release Checklist

Before publishing a release image:

```text
source commit is approved
lockfile is frozen
base image is approved
tests pass
container smoke tests pass
security scan is reviewed
SBOM is generated
provenance is generated
image is signed
immutable tags are published
image digest is recorded
rollback image exists
migration compatibility is confirmed
```

---

## Implementation Sequence

Recommended implementation order:

```text
1. Define approved base images.
2. Create the root .dockerignore.
3. Add Dockerfiles for every deployable.
4. Add non-root runtime users.
5. Add health endpoints.
6. Add graceful shutdown.
7. Add Nx container targets.
8. Add frozen pnpm installation.
9. Add production dependency pruning.
10. Add Compose core profile.
11. Add Discord and worker profiles.
12. Add observability profile.
13. Add container smoke tests.
14. Add non-root tests.
15. Add read-only filesystem tests.
16. Add signal tests.
17. Add image scanning.
18. Add SBOM generation.
19. Add OCI labels.
20. Add immutable release tagging.
21. Add multi-architecture builds.
22. Add provenance.
23. Add image signing.
24. Add Kubernetes security-context validation.
25. Publish the self-hosted Compose bundle.
```

---

## Required Decisions

Before this standard is considered stable, Aerealith must finalize:

```text
exact Node.js base-image tag and digest
Debian release policy
runtime UID and GID
image registry
image naming
image tagging
multi-architecture requirements
Dockerfile generator strategy
pnpm deploy strategy
Nx workspace-pruning strategy
health-check implementation
migration container strategy
image-signing mechanism
SBOM format
provenance mechanism
registry retention
self-hosted Compose support level
frontend container runtime
Cloudflare-to-container compatibility adapter
```

---

## Relationship to Monorepo Rules

Every deployable Nx application owns one container build.

Libraries are packaged only through their consuming applications unless intentionally published.

Container builds must follow public package boundaries and must not import unrelated application source.

---

## Relationship to Dependency Rules

Container images must include only dependencies permitted to the target application.

Provider SDKs remain inside provider containers or adapters.

Database packages must not enter frontend images.

Test-support packages must not enter runtime images.

---

## Relationship to Package Management

Container builds use:

```text
Corepack
the pinned pnpm version
the committed pnpm lockfile
frozen installation
workspace protocol
```

The image must not resolve dependencies differently from CI.

---

## Relationship to TypeScript Standards

Container builds must preserve:

```text
ESM behavior
NodeNext resolution
package exports
declaration-safe library boundaries
runtime-specific compilation
```

Type checking must occur before release images are published.

---

## Relationship to Environment Variables

Runtime configuration is injected after build.

Every container validates its own configuration schema.

Frontend-public build variables remain explicitly separated from server secrets.

---

## Relationship to Secrets

Secrets must not enter:

```text
build arguments
image layers
image labels
Dockerfiles
committed Compose files
```

Runtime secret access remains least-privileged and service-specific.

---

## Relationship to Testing

Container tests validate the built artifact rather than only the source process.

Release validation should include selected E2E flows running against production images.

---

## Relationship to Security Architecture

Container isolation is one security layer.

Aerealith also requires:

```text
authentication
authorization
approval
secret management
network policy
audit
dependency scanning
runtime monitoring
```

Containerization does not replace application security.

---

## Relationship to Observability Architecture

Containerized services emit the same structured telemetry as every other deployment target.

Docker-specific metadata may be added by the collector.

Feature code remains independent from the container runtime.

---

## Relationship to Data Architecture

Application containers remain stateless.

PostgreSQL and CockroachDB own durable relational state.

Migrations run through controlled jobs.

Application startup verifies compatibility without silently performing destructive schema changes.

---

## Relationship to Discord Architecture

The Discord integration runs as its own persistent container.

It owns gateway sessions, rate limits, provider permissions, and Discord-specific health.

Modules and workflows communicate through provider-neutral capabilities.

---

## Relationship to AI Architecture

AI providers remain optional.

Core containers must run without AI credentials or AI SDK initialization.

Self-hosted deployments may enable local or external AI adapters through configuration.

---

## Relationship to Self-Hosting

Every core Aerealith service must remain deployable through Docker without requiring Aerealith-managed cloud infrastructure.

Docker support is therefore part of the product's portability contract, not merely a local-development convenience.

---

## Success Criteria

The Docker standard is successful when:

```text
every deployable service has a Dockerfile
images build from clean checkouts
Node.js and pnpm versions match local development and CI
the lockfile is frozen
images run as non-root
runtime filesystems can be read-only
secrets never enter images
configuration is injected at runtime
images contain only required dependencies
health checks are meaningful
signals are handled
workers shut down safely
logs use stdout and stderr
containers are observable
Compose supports local and self-hosted operation
images are scanned
SBOMs are generated
release images are immutable
image digests map to source commits
the same image is promoted between environments
Kubernetes security contexts work
self-hosted deployments do not require Aerealith-managed providers
```

---

## Final Standard

Aerealith containers should be boring in the best possible way: predictable to build, minimal to inspect, difficult to misuse, easy to observe, and safe to replace.

The standard is:

> Every Aerealith deployable has a production-capable Dockerfile that builds from the pinned Node.js and pnpm toolchain, installs from the frozen workspace lockfile, packages only the target application's runtime dependency graph, contains no production secrets or development tooling, runs as a non-root user with minimal privileges and filesystem access, accepts validated configuration at runtime, exposes liveness and readiness, handles termination signals, writes structured logs to standard streams, survives container replacement without losing durable state, passes automated security and runtime tests, produces traceable and verifiable release artifacts, works in Docker Compose and Kubernetes, and preserves Aerealith's provider-neutral and self-hostable architecture.
