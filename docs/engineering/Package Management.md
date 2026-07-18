# Package Management

Status: Draft
Implementation State: Draft standard; examples may describe target configuration
Current-State Source: [Current Architecture](../architecture/Current%20Architecture.md)
Owner: SinLess Games LLC
Last Updated: 2026-07-18
Security Classification: Internal Engineering
Primary Package Manager: pnpm
Primary Runtime: Node.js 24.x
Workspace Orchestration: Nx
Lockfile: `pnpm-lock.yaml`

Related Engineering Documentation:

- `docs/engineering/Code Style.md`
- `docs/engineering/Testing.md`
- `docs/engineering/TypeScript Standards.md`
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
- `docs/rfcs/0005-entity-schema-and-contract-strategy.md`
- `docs/rfcs/0008-configuration-and-secrets-model.md`
- `docs/rfcs/0013-provider-abstraction-and-integration-interface.md`
- `docs/rfcs/0014-module-registry-manifest-and-lifecycle.md`

---

## Purpose

This document defines the package-management and dependency-management standards for the Aerealith platform.

It governs how contributors:

```text
install dependencies
declare dependencies
organize workspace packages
pin toolchain versions
update packages
review lockfile changes
manage internal libraries
manage external packages
apply security overrides
patch dependencies
publish packages
authenticate to registries
build containers
cache dependencies
remove obsolete packages
respond to vulnerabilities
generate dependency inventories
```

The objective is to keep the Aerealith dependency graph:

```text
predictable
reproducible
secure
reviewable
minimal
portable
maintainable
compatible with supported runtimes
aligned with monorepo boundaries
```

The guiding rule is:

> Every dependency must have a clear owner, a documented purpose, an appropriate version policy, a valid architectural location, and a safe path for updates, security response, and removal.

A package being popular, convenient, or already installed somewhere in the repository is not sufficient justification for using it.

---

## Package-Management Standard

Aerealith uses:

```text
pnpm
```

The repository uses:

```text
one package manager
one committed lockfile
one pinned package-manager version
one workspace definition
```

The following are not supported:

```text
npm install
Yarn
Bun package management
multiple lockfiles
per-project package-manager versions
uncommitted dependency resolution
```

The canonical lockfile is:

```text
pnpm-lock.yaml
```

The canonical workspace file is:

```text
pnpm-workspace.yaml
```

The root `package.json` declares the package-manager version:

```json
{
  "packageManager": "pnpm@<pinned-version>",
  "engines": {
    "node": ">=24 <25"
  }
}
```

Corepack should be used to activate the pinned package manager.

```bash
corepack enable
pnpm --version
```

---

## Core Principles

Aerealith package management follows these principles:

```text
Use one package manager.
Commit the lockfile.
Install from the lockfile in CI.
Add dependencies to the package that owns them.
Keep runtime and development dependencies separate.
Prefer workspace libraries for shared Aerealith behavior.
Do not expose provider SDKs across architecture boundaries.
Pin critical tooling.
Use deliberate version ranges.
Review transitive dependency changes.
Treat lifecycle scripts as executable code.
Minimize dependency count.
Remove unused dependencies.
Automate routine updates.
Review major upgrades manually.
Respond quickly to security vulnerabilities.
Do not commit registry credentials.
```

---

## Package Manager Ownership

pnpm owns:

```text
dependency resolution
workspace linking
lockfile generation
package installation
package script execution
dependency overrides
package patching
workspace filtering
deployment pruning
```

Nx owns:

```text
project graph
task execution
task caching
affected-project detection
build orchestration
dependency-boundary enforcement
```

These responsibilities should not be confused.

pnpm determines which packages are installed.

Nx determines which projects depend on one another and which tasks must run.

---

## Repository Package Structure

The expected workspace structure is:

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
│   ├── scripts/
│   └── testing/
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── nx.json
```

Each independently owned project should have a `package.json` when it needs to declare:

```text
external dependencies
scripts
package exports
runtime metadata
publishing metadata
```

Nx project configuration may live in:

```text
project.json
package.json
inferred project configuration
```

The chosen model should remain consistent.

---

## Workspace Definition

Recommended `pnpm-workspace.yaml` direction:

```yaml
packages:
  - apps/*
  - apps/*/*
  - apps/*/*/*
  - libs/*
  - tools/*
  - tools/*/*
```

Workspace globs should be:

```text
explicit
stable
easy to review
broad enough for planned project locations
narrow enough to avoid accidental package inclusion
```

Avoid including:

```text
dist
coverage
temporary directories
generated deployment output
external vendor checkouts
```

---

## Root Package

The root package owns repository-wide tooling.

Appropriate root development dependencies include:

```text
TypeScript
Nx
ESLint
Prettier
Vitest workspace tooling
Playwright
shared code-quality plugins
shared build tooling
repository-wide security tooling
```

The root package should not own application runtime dependencies merely because several projects use them.

Bad root dependencies:

```text
Discord.js used only by the Discord runtime
Drizzle used only by libs/db
React used only by the frontend
Resend used only by the email adapter
an AI provider SDK used only by one provider adapter
```

Those packages belong to their owning project.

---

## Dependency Ownership

Every external dependency must have a clear owning package.

Examples:

| Dependency        | Expected Owner                                          |
| ----------------- | ------------------------------------------------------- |
| `react`           | Frontend application or shared UI library               |
| `next`            | Next.js frontend application                            |
| `vite`            | Vite application or build tooling project               |
| `hono`            | Hono API transport project                              |
| `@nestjs/common`  | NestJS service project                                  |
| `drizzle-orm`     | `libs/db`                                               |
| `discord.js`      | Discord integration runtime                             |
| `resend`          | Resend notification adapter                             |
| Cloudinary SDK    | Cloudinary media adapter                                |
| AI provider SDK   | Provider-specific AI adapter                            |
| OpenTelemetry SDK | Observability library or deployable runtime             |
| `zod`             | Contracts or boundaries that perform runtime validation |

A package should not rely on a dependency merely because pnpm made it available through the workspace installation.

---

## Adding Dependencies

Add a dependency to the project that imports it.

Examples:

```bash
pnpm add zod --filter @aerealith/contracts
pnpm add drizzle-orm --filter @aerealith/db
pnpm add discord.js --filter @aerealith/integration-discord
pnpm add react --filter @aerealith/frontend
```

Add development-only dependencies with:

```bash
pnpm add -D vitest --filter @aerealith/core
pnpm add -D @types/node --filter @aerealith/workers
```

Do not run:

```bash
pnpm add <package>
```

at the repository root unless the package is genuinely repository-wide tooling.

---

## Removing Dependencies

Remove a dependency from its owner.

```bash
pnpm remove discord.js --filter @aerealith/integration-discord
```

After removal:

```text
remove unused imports
remove configuration
remove type augmentations
remove patches and overrides
update documentation
review the lockfile
run affected tests
```

A package is not fully removed if stale configuration or transitive workarounds remain.

---

## Dependency Categories

Dependencies must be declared in the correct category.

### `dependencies`

Use for packages required when the built application or library runs.

Examples:

```text
web framework runtime
database client
provider SDK
runtime schema library
logging runtime
React runtime
```

### `devDependencies`

Use for packages needed only during development, testing, compilation, or packaging.

Examples:

```text
TypeScript
Vitest
Playwright
ESLint
Prettier
test utilities
code generators
type-only packages
```

### `peerDependencies`

Use when a reusable package expects its consumer to provide a compatible dependency.

Examples:

```text
shared React component library expecting React
framework integration package expecting a framework runtime
plugin package expecting an Aerealith host API
```

### `optionalDependencies`

Use only when the package is genuinely optional at runtime and the application handles its absence safely.

Optional dependencies must not be used as a substitute for incorrect dependency ownership.

---

## Runtime Versus Development Dependencies

A package used in production code belongs in `dependencies`, even when TypeScript or a bundler may inline part of it.

A package used only in:

```text
tests
linting
code generation
build scripts
type checking
```

belongs in `devDependencies`.

Container and deployment builds must verify that production dependencies are sufficient after development dependencies are removed.

---

## Type Packages

Use `@types/*` packages only when the dependency does not provide its own types.

Before adding an `@types` package:

```text
check whether the package includes declarations
check whether the declarations match the installed runtime version
verify that the type package is maintained
```

A stale `@types` package can create false confidence.

Provider-specific type corrections should remain isolated in adapter declarations rather than globally weakening type safety.

---

## Peer Dependencies

Peer dependencies should be used carefully.

A package should declare a peer dependency when:

```text
the host must share one runtime instance
the consumer controls the version
duplicate copies would be harmful
the package is an extension of another framework
```

Typical examples:

```text
React
React DOM
framework plugin APIs
Aerealith module host contracts
```

Reusable libraries should also include peer dependencies in `devDependencies` for local builds and tests.

Example:

```json
{
  "peerDependencies": {
    "react": "^19.0.0"
  },
  "devDependencies": {
    "react": "^19.0.0"
  }
}
```

The exact supported range must follow the repository's selected React version.

---

## Optional Peer Dependencies

Optional peer dependencies may be used for narrowly optional integrations.

Example:

```json
{
  "peerDependencies": {
    "@opentelemetry/api": "^1.0.0"
  },
  "peerDependenciesMeta": {
    "@opentelemetry/api": {
      "optional": true
    }
  }
}
```

The code must check that the integration exists before using it.

Do not mark a required runtime package optional to suppress installation warnings.

---

## Internal Workspace Dependencies

Internal workspace packages should use the workspace protocol.

Example:

```json
{
  "dependencies": {
    "@aerealith/contracts": "workspace:*",
    "@aerealith/core": "workspace:*",
    "@aerealith/observability": "workspace:*"
  }
}
```

Benefits include:

```text
guaranteed local linking
prevention of accidental registry resolution
clear monorepo ownership
consistent publishing replacement
```

---

## Workspace Range Policy

Recommended internal dependency policy:

```text
Private workspace packages: workspace:*
Versioned publishable packages: workspace:^
Exact release-coupled packages: workspace:*
```

The final choice should align with whether packages are:

```text
private
published independently
published as one release set
```

Do not use ordinary registry versions for internal packages during local development.

---

## Internal Package Names

Internal packages should use the Aerealith namespace.

Examples:

```text
@aerealith/api
@aerealith/contracts
@aerealith/core
@aerealith/db
@aerealith/flags
@aerealith/observability
@aerealith/ui
@aerealith/testing
```

Deployable packages may use names such as:

```text
@aerealith/frontend
@aerealith/service-api
@aerealith/service-workers
@aerealith/integration-discord
```

Package names should be:

```text
lowercase
hyphenated
stable
purpose-oriented
```

---

## Private Packages

Internal packages should declare:

```json
{
  "private": true
}
```

unless they are intentionally published.

This prevents accidental publication.

Publishable packages require:

```text
explicit package exports
license metadata
repository metadata
files allowlist
versioning policy
release process
security review
```

---

## Package Exports

Packages should define intentional exports.

Example:

```json
{
  "name": "@aerealith/core",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./errors": {
      "types": "./dist/errors/index.d.ts",
      "import": "./dist/errors/index.js"
    },
    "./workflows": {
      "types": "./dist/workflows/index.d.ts",
      "import": "./dist/workflows/index.js"
    }
  }
}
```

Exports should prevent consumers from importing private implementation paths.

Avoid:

```text
@aerealith/core/src/internal/...
@aerealith/db/src/schema/...
```

---

## Package Files

Publishable packages should declare a `files` allowlist.

```json
{
  "files": ["dist", "README.md", "LICENSE"]
}
```

Do not publish:

```text
source maps without review
tests
fixtures
local configuration
coverage
secrets
temporary files
unnecessary source
```

---

## Side Effects

Packages should declare side-effect behavior accurately.

Example:

```json
{
  "sideEffects": false
}
```

Use `false` only when importing a module cannot:

```text
register global behavior
modify globals
load CSS
initialize telemetry
register decorators
perform provider setup
```

Packages containing required side-effect imports should use an explicit allowlist.

```json
{
  "sideEffects": ["./dist/styles.css", "./dist/register.js"]
}
```

Incorrect `sideEffects` metadata can cause bundlers to remove required behavior.

---

## Package Scripts

Package scripts should expose stable project tasks.

Common script names:

```text
build
dev
lint
typecheck
test
test:coverage
clean
```

Scripts should normally call Nx targets or project-local tooling.

Example:

```json
{
  "scripts": {
    "build": "nx build service-api",
    "lint": "nx lint service-api",
    "typecheck": "nx typecheck service-api",
    "test": "nx test service-api"
  }
}
```

Avoid scripts that duplicate significant orchestration logic across packages.

Shared behavior belongs in:

```text
Nx target defaults
tools/scripts
shared executors
```

---

## Lifecycle Scripts

Package lifecycle scripts execute code during installation or publication.

Potentially dangerous lifecycle scripts include:

```text
preinstall
install
postinstall
prepare
prepublishOnly
```

Aerealith should minimize lifecycle-script use.

Any lifecycle script must be:

```text
owned
reviewed
documented
required
safe in CI
safe in containers
safe without production credentials
```

Do not use `postinstall` for ordinary build steps that belong in Nx.

---

## Dependency Lifecycle Scripts

Third-party dependency lifecycle scripts are executable supply-chain code.

Installation policy should consider:

```text
whether scripts are required
whether the package is trusted
whether CI should allow scripts
whether a build image can install with scripts disabled
```

Critical environments may use:

```bash
pnpm install --ignore-scripts
```

followed by explicit allowlisted build steps when compatible.

The final CI policy should be documented and tested.

---

## Root Install

The standard installation command is:

```bash
pnpm install
```

Continuous integration uses:

```bash
pnpm install --frozen-lockfile
```

Release and container builds should also use a frozen lockfile.

A lockfile modification during CI is a failure.

---

## Frozen Lockfile

`--frozen-lockfile` guarantees that:

```text
package.json files and lockfile agree
dependency resolution is reproducible
CI does not silently choose new versions
```

When installation fails because the lockfile is stale:

```text
update dependencies locally
review the resulting lockfile
commit package manifests and lockfile together
```

Do not disable frozen-lockfile validation to make CI pass.

---

## Lockfile Ownership

`pnpm-lock.yaml` is a first-class source file.

It must be:

```text
committed
reviewed
kept consistent
generated only through pnpm
protected from manual conflict damage
```

The lockfile records:

```text
resolved versions
integrity hashes
peer dependency contexts
transitive dependency graph
workspace dependency state
```

---

## Lockfile Review

Lockfile review should verify:

```text
expected direct package changes
unexpected transitive packages
unexpected registry sources
integrity entries
peer dependency changes
large dependency-tree expansion
duplicate major versions
new lifecycle-script packages
```

A small package-manifest edit can produce a large transitive change.

Review the meaning, not merely the line count.

---

## Lockfile Conflicts

When resolving lockfile conflicts:

```text
resolve package.json conflicts first
use the pinned pnpm version
regenerate the lockfile
review the result
run installation and validation
```

Avoid hand-editing complex lockfile sections.

Recommended recovery:

```bash
pnpm install --lockfile-only
pnpm install --frozen-lockfile
```

Deleting the lockfile should be a last resort and requires full dependency review.

---

## Lockfile-Only Updates

Use lockfile-only installation when appropriate.

```bash
pnpm install --lockfile-only
```

This may be useful for:

```text
resolving manifest changes
reviewing dependency resolution
updating CI metadata
```

A lockfile-only update still requires tests before merging.

---

## Version Policy

Aerealith should use deliberate version ranges.

Recommended direction:

| Package Type               | Version Direction                   |
| -------------------------- | ----------------------------------- |
| Core runtime and framework | Exact or controlled minor range     |
| Security-sensitive package | Exact or controlled patch range     |
| Build tooling              | Exact or controlled minor range     |
| Stable utility             | Compatible range after review       |
| Internal workspace package | `workspace:*` or `workspace:^`      |
| Provider SDK               | Controlled range with adapter tests |

The exact policy may vary by package risk.

---

## Exact Versions

Exact versions are appropriate for:

```text
TypeScript
pnpm
Nx
critical build tooling
provider SDKs with unstable behavior
security-sensitive libraries
packages whose minor updates frequently break behavior
```

Example:

```json
{
  "devDependencies": {
    "typescript": "6.0.0"
  }
}
```

The actual repository version must be selected and pinned deliberately.

---

## Compatible Ranges

Compatible ranges may be appropriate for mature libraries with strong semantic-versioning behavior.

Example:

```json
{
  "dependencies": {
    "zod": "^4.0.0"
  }
}
```

The lockfile still pins the resolved version.

Range selection determines which updates automation may propose without changing the manifest.

---

## Tilde Ranges

Tilde ranges limit automatic resolution to patch updates.

```json
{
  "dependencies": {
    "some-sensitive-package": "~3.4.2"
  }
}
```

Use when:

```text
patch updates are trusted
minor updates require deliberate review
```

---

## Wildcards

Avoid dependency versions such as:

```text
*
latest
next
beta
workspace without protocol
```

Prerelease versions require:

```text
clear purpose
isolated scope
review
rollback plan
```

---

## Prerelease Packages

Prerelease packages include:

```text
alpha
beta
rc
canary
nightly
next
```

They may be used only when:

```text
a required feature is unavailable in stable releases
the risk is understood
the package is isolated
tests cover the behavior
a stable migration path exists
```

Do not introduce prerelease core frameworks casually.

---

## Package Deduplication

pnpm may install multiple versions when dependency ranges require them.

Multiple versions are acceptable when necessary.

They should be reviewed when they affect:

```text
bundle size
React singleton behavior
provider SDK behavior
OpenTelemetry APIs
security vulnerabilities
database drivers
```

Useful commands:

```bash
pnpm list --depth 10
pnpm why <package>
pnpm dedupe
```

Do not force deduplication when versions are incompatible.

---

## Dependency Inspection

Use:

```bash
pnpm why <package>
```

to determine:

```text
which project depends on a package
whether it is direct or transitive
which version introduced it
why several versions exist
```

Use:

```bash
pnpm list --recursive
```

for workspace inspection.

---

## Dependency Graph Review

Dependency review should consider both:

```text
pnpm package graph
Nx project graph
```

pnpm answers:

```text
Which npm packages are installed?
```

Nx answers:

```text
Which Aerealith projects depend on one another?
```

Useful command:

```bash
pnpm nx graph
```

A package dependency that creates an invalid project import remains prohibited even if installation succeeds.

---

## Dependency Selection

Before adding a package, evaluate:

```text
maintenance activity
release history
security history
license
ownership
download integrity
transitive dependency count
bundle size
runtime support
Node.js 24 compatibility
Cloudflare Worker compatibility
browser compatibility
ESM support
TypeScript declarations
tree-shaking
provider lock-in
```

---

## Build Versus Buy Decision

Before adding a dependency, ask:

```text
Is the required behavior small enough to implement safely?
Is this behavior security-sensitive?
Does an existing Aerealith library already provide it?
Will this package become a foundational dependency?
Can it run in every required runtime?
Can it be replaced later?
```

Do not add a large package for a trivial helper.

Do not reimplement complex cryptography, parsers, or security protocols merely to avoid a dependency.

---

## Dependency Approval Levels

Suggested approval levels:

### Routine

Examples:

```text
small maintained utility
test helper
type package
lint plugin
```

Requires:

```text
normal code review
license review
security scan
```

### Significant

Examples:

```text
runtime framework
database package
provider SDK
observability SDK
authentication package
```

Requires:

```text
architecture review
security review
compatibility tests
dependency-tree review
```

### Critical

Examples:

```text
cryptography
session handling
authorization engine
sandbox
code execution
package loader
```

Requires:

```text
security review
architecture decision
threat analysis
direct tests
rollback plan
```

---

## License Review

Every dependency must use a license compatible with Aerealith's distribution and business model.

Review should identify:

```text
license type
copyleft obligations
source-distribution obligations
attribution requirements
commercial restrictions
patent terms
```

Unknown or missing licenses require review before adoption.

Potentially restrictive licenses must not be accepted through automation without human review.

---

## Dependency Metadata

A dependency inventory should include:

```text
package
version
license
owner
purpose
runtime
source
direct or transitive
security status
```

This information may be generated into:

```text
SBOM
license report
dependency report
release artifact metadata
```

---

## Software Bill of Materials

Release builds should generate a software bill of materials when practical.

Preferred formats may include:

```text
CycloneDX
SPDX
```

The SBOM should identify:

```text
direct dependencies
transitive dependencies
versions
integrity information
licenses
package relationships
```

SBOM artifacts should be associated with the exact release.

---

## Security Scanning

Dependency security is evaluated through:

```text
Snyk
GitHub Dependabot alerts
GitHub dependency review
Renovate
pnpm audit as supplemental information
container scanning
SBOM scanning
```

No single scanner is authoritative for every vulnerability.

Findings should be reviewed in context.

---

## `pnpm audit`

`pnpm audit` may provide local vulnerability information.

```bash
pnpm audit
```

It should not be the only security gate.

Audit findings may be:

```text
directly exploitable
not reachable
development-only
false positive
fixed by update
fixed only through override
```

Every exception requires documented reasoning.

---

## Vulnerability Severity

Suggested response targets:

| Severity | Expected Response                                   |
| -------- | --------------------------------------------------- |
| Critical | Immediate triage and emergency update or mitigation |
| High     | Prompt triage and prioritized patch                 |
| Medium   | Scheduled remediation                               |
| Low      | Routine update or documented acceptance             |

Actual urgency also depends on:

```text
reachability
exposure
runtime
data access
exploit maturity
available mitigation
```

---

## Vulnerability Triage

For each finding, determine:

```text
Which package introduced it?
Is the vulnerable code reachable?
Is it present in production output?
Is it only used in tests?
Which environments are affected?
Is a fixed version available?
Can the package be removed?
Can the vulnerable feature be disabled?
```

Record exceptions with:

```text
finding
affected package
reachability
mitigation
owner
expiration date
review date
```

---

## Renovate

Renovate is the primary automated dependency-update system.

Renovate should:

```text
open reviewed pull requests
group related packages
respect repository schedules
separate major upgrades
preserve the pnpm lockfile
run validation
label security updates
```

Recommended grouping examples:

```text
Nx packages
TypeScript and ESLint tooling
React ecosystem
OpenTelemetry packages
Drizzle packages
Discord packages
testing packages
```

---

## Dependabot

Dependabot may provide:

```text
security alerts
security update pull requests
dependency review integration
```

Avoid having Renovate and Dependabot open duplicate routine update pull requests.

Recommended direction:

```text
Renovate handles routine version updates.
Dependabot remains enabled for security alerts and selected security fixes.
```

The exact division should be configured explicitly.

---

## Automated Update Policy

Automated updates may merge only when:

```text
the update class is approved
all tests pass
security scans pass
lockfile review passes
no architecture boundary changes occur
```

Potential auto-merge candidates:

```text
patch updates
development-only patch updates
non-breaking type packages
```

Do not auto-merge by default:

```text
major updates
framework updates
database driver updates
provider SDK updates
security-sensitive packages
packages with lifecycle scripts
```

---

## Update Cadence

Recommended cadence:

```text
security updates: immediately
patch updates: continuously or weekly
minor updates: weekly or scheduled
major updates: planned
framework upgrades: planned migration
```

Avoid allowing dependency updates to accumulate for months.

Large stale jumps are harder to review and recover from.

---

## Update Pull Requests

A dependency update pull request should include:

```text
package names
old and new versions
release notes
breaking changes
migration requirements
security impact
affected projects
test results
lockfile change
```

Provider SDK updates should include provider contract testing.

Framework updates should include build and E2E testing.

---

## Manual Updates

To update a package within its existing range:

```bash
pnpm update <package> --filter <project>
```

To select a new version:

```bash
pnpm add <package>@<version> --filter <project>
```

Interactive update:

```bash
pnpm update --interactive --recursive
```

After updates:

```text
review manifests
review lockfile
run affected validation
run provider contract tests where relevant
run full validation for foundational packages
```

---

## Major Upgrades

Major dependency upgrades require:

```text
migration plan
release-note review
deprecated API review
runtime compatibility review
type declaration review
security review
test plan
rollback plan
```

Examples:

```text
Node.js major upgrade
TypeScript major upgrade
Nx major upgrade
React major upgrade
Next.js major upgrade
Drizzle major upgrade
Discord.js major upgrade
OpenTelemetry major upgrade
```

Do not mix several unrelated major upgrades in one pull request.

---

## Framework Upgrades

Framework upgrades must verify:

```text
runtime behavior
configuration changes
routing behavior
build output
server and client boundaries
middleware behavior
security defaults
container builds
deployment compatibility
```

Framework changelogs are not a substitute for application testing.

---

## Provider SDK Upgrades

Provider SDK updates require:

```text
adapter compilation
provider contract tests
error-mapping review
rate-limit review
permission behavior review
payload-shape review
sandbox validation when practical
```

Provider SDK types must remain inside adapters after the upgrade.

---

## Database Package Upgrades

Database dependency updates require:

```text
Drizzle schema validation
migration generation review
PostgreSQL repository tests
CockroachDB compatibility tests
transaction behavior review
driver configuration review
```

A type-safe compilation does not prove database compatibility.

---

## Security Overrides

pnpm overrides may temporarily force a dependency version.

Example:

```json
{
  "pnpm": {
    "overrides": {
      "vulnerable-transitive-package": "4.2.1"
    }
  }
}
```

An override requires:

```text
reason
affected package
compatibility validation
tracking issue
removal condition
review date
```

Overrides are temporary controls.

They must not become invisible permanent configuration.

---

## Override Documentation

Recommended comment location:

```text
docs/engineering/dependency-overrides.md
```

Each override should document:

```text
package
forced version
introduced date
reason
upstream issue
tests performed
owner
removal target
```

JSON does not support comments.

Do not rely on tribal memory to explain overrides.

---

## Package Extensions

pnpm package extensions may correct incomplete dependency metadata.

Example direction:

```yaml
packageExtensions:
  some-package@1:
    peerDependencies:
      some-peer: '^2.0.0'
```

Use only when:

```text
upstream metadata is incorrect
the correction is verified
the behavior is documented
an upstream issue exists where appropriate
```

Do not use package extensions to conceal incompatible versions.

---

## Patching Dependencies

pnpm patching may be used for urgent, narrowly scoped fixes.

Typical flow:

```bash
pnpm patch <package>@<version>
pnpm patch-commit <temporary-directory>
```

A patch requires:

```text
reason
upstream issue or pull request
tests
security review when relevant
removal plan
```

Patch files should be committed.

---

## Patch Policy

Patches are appropriate when:

```text
an upstream fix is not yet released
a critical compatibility issue blocks development
a security mitigation is urgently required
```

Patches are not appropriate for:

```text
large forks
permanent product customization
avoiding contribution upstream
changing a package's fundamental behavior
```

Large changes should use:

```text
an internal adapter
a maintained fork
a replacement package
```

---

## Maintained Forks

A maintained fork requires:

```text
clear repository ownership
security patch responsibility
versioning
release process
upstream tracking
license compliance
documented reason
```

Forking a dependency creates long-term maintenance responsibility.

It should not be treated as a quick fix.

---

## Registry Configuration

Public packages should resolve from the approved npm registry.

Private packages may resolve from an approved private registry.

Registry configuration may live in:

```text
.npmrc
environment variables
CI secret configuration
```

Committed configuration must not contain credentials.

---

## `.npmrc`

Recommended committed `.npmrc` direction:

```ini
engine-strict=true
save-exact=false
strict-peer-dependencies=true
auto-install-peers=false
```

Exact settings should be finalized after testing framework compatibility.

Registry credentials must use environment interpolation.

Example:

```ini
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

Do not commit the actual token.

---

## Strict Peer Dependencies

Strict peer dependency behavior is preferred.

It reveals:

```text
incompatible framework versions
missing runtime peers
duplicated host runtimes
incorrect plugin installation
```

If strict peer dependencies must be relaxed for a package:

```text
document the package
document the upstream issue
add compatibility tests
keep the exception narrow
```

---

## Registry Authentication

Registry tokens should be:

```text
scoped
short-lived where possible
read-only for installation
publish-only for release jobs
environment-specific
stored in secret management
```

Developer machines should not require publish credentials for ordinary installation.

---

## Publishing Credentials

Publishing credentials must not be available to:

```text
pull request builds
ordinary development
preview environments
test jobs
```

Publishing should occur only through an approved release workflow.

Use:

```text
trusted publishing
OIDC
short-lived tokens
```

where supported.

---

## Package Publication

Only intentionally public packages may be published.

Before publication, verify:

```text
package is not marked private
package name is correct
version is correct
exports are correct
files allowlist is correct
license is present
README is current
declarations build
no secrets are included
no internal paths are exposed
```

---

## Dry-Run Publication

Use a dry run before publishing.

```bash
pnpm pack
```

Inspect the archive contents.

Verify that it excludes:

```text
.env files
credentials
test artifacts
coverage
local paths
internal documentation
unnecessary source maps
```

---

## Package Versioning

Internal private packages may be versioned with the platform release.

Externally consumed packages should follow semantic versioning.

Version meanings:

```text
patch: compatible fixes
minor: compatible features
major: breaking changes
```

Public type changes and contract changes may be breaking even when runtime code changes little.

---

## Release Sets

If several packages must remain version-aligned, define a release set.

Potential release sets:

```text
core and contracts
module SDK packages
developer API packages
frontend design-system packages
```

Do not independently version packages that cannot operate independently.

---

## Changesets Direction

A package-versioning tool such as Changesets may be introduced when Aerealith begins publishing multiple packages.

A changeset should describe:

```text
affected packages
version impact
change summary
migration guidance
```

Changesets are not required for private packages that release only with the platform.

---

## Package Deprecation

Deprecated packages should provide:

```text
replacement
reason
migration instructions
removal schedule
```

Registry deprecation messages should be applied when a published package must no longer be used.

A deprecated package should not remain in the workspace indefinitely without a removal plan.

---

## Package Removal

Removing a package requires review of:

```text
workspace references
Nx dependencies
package exports
build targets
test targets
deployment manifests
Dockerfiles
documentation
registry publication
data migrations
```

After removal:

```bash
pnpm install
pnpm nx graph
pnpm validate
```

---

## Unused Dependency Detection

The repository should detect:

```text
unused direct dependencies
undeclared imports
unused workspace packages
unused exports
```

Potential tooling may include:

```text
Knip
ESLint import rules
Nx graph validation
pnpm dependency checks
```

Findings require human review because dynamic imports and framework conventions may produce false positives.

---

## Phantom Dependencies

A phantom dependency occurs when a package imports a dependency it did not declare.

Phantom dependencies are prohibited.

Example:

```text
@aerealith/workflows imports zod
but zod is declared only in the root package
```

Each importing project must declare its dependency.

pnpm's isolated dependency model helps expose these errors.

---

## Hoisting

Aerealith should not depend on broad package hoisting.

Avoid configuration that makes every root dependency available to every package.

Hoisting exceptions require:

```text
tooling compatibility reason
narrow pattern
documentation
test coverage
```

Phantom dependency bugs are not solved by adding more hoisting.

---

## pnpm Store

pnpm uses a content-addressable store.

Useful commands:

```bash
pnpm store path
pnpm store status
pnpm store prune
```

Do not prune the store as a routine development step.

Use it when:

```text
disk usage is excessive
store integrity is suspect
old versions are no longer needed
```

---

## Cache Strategy

Dependency caching may include:

```text
pnpm store
Nx task cache
Docker build cache
CI package cache
```

Caches must be:

```text
rebuildable
version-aware
lockfile-aware
non-authoritative
```

A cache hit must not bypass:

```text
lockfile validation
security scanning
required tests
```

---

## CI Cache Keys

CI package caches should consider:

```text
operating system
Node.js version
pnpm version
pnpm-lock.yaml hash
architecture
```

A stale cache should not affect the resolved dependency graph.

The lockfile remains authoritative.

---

## Offline and Network-Constrained Installs

pnpm may support cached installation when package content already exists.

Useful modes may include:

```bash
pnpm install --offline
pnpm install --prefer-offline
```

Offline installation is a convenience.

Release builds should still verify dependency integrity through approved infrastructure.

---

## Docker Dependency Installation

Docker builds should use the pinned Node.js and pnpm versions.

Example direction:

```dockerfile
FROM node:24-bookworm-slim AS dependencies

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/services/api/package.json apps/services/api/package.json
COPY libs/core/package.json libs/core/package.json
COPY libs/contracts/package.json libs/contracts/package.json

RUN pnpm install --frozen-lockfile
```

The exact copy strategy depends on workspace build tooling.

---

## Docker Layer Caching

Dockerfiles should copy package manifests and lockfiles before source files where practical.

This allows dependency layers to remain cached when application source changes.

Do not sacrifice correctness for cache efficiency.

All required workspace manifests must be present before installation.

---

## Production Pruning

Production images should contain only required runtime dependencies and build output.

Potential approaches:

```text
pnpm deploy
multi-stage build
workspace package pruning
Nx-generated project graph
```

Production images should exclude:

```text
development dependencies
tests
source fixtures
local tooling
coverage
Git metadata
registry credentials
```

---

## `pnpm deploy`

`pnpm deploy` may create a portable package deployment directory for a workspace project.

Example direction:

```bash
pnpm --filter @aerealith/service-api deploy --prod /deployment/api
```

Deployment behavior must be tested for:

```text
workspace dependencies
ESM exports
native packages
declaration-only packages
runtime configuration
```

---

## Native Dependencies

Packages containing native binaries require extra review.

Examples may include:

```text
image processing
cryptography bindings
database drivers
profiling agents
```

Review must consider:

```text
supported operating systems
CPU architecture
container base image
glibc versus musl
build tools
prebuilt binaries
supply-chain origin
Cloudflare incompatibility
```

Prefer pure JavaScript or WebAssembly when it satisfies performance and security needs.

---

## Cloudflare Worker Compatibility

Cloudflare-compatible packages must not rely on unsupported Node.js APIs unless the selected runtime compatibility mode provides them safely.

Before adding a package to Worker code, verify:

```text
bundle compatibility
Node.js built-in usage
dynamic code execution
filesystem assumptions
native bindings
bundle size
runtime globals
```

A package working in Node.js does not guarantee Worker compatibility.

---

## Browser Compatibility

Frontend dependencies should be reviewed for:

```text
bundle size
tree-shaking
browser support
server-only imports
Node.js polyfills
side effects
accessibility
security
```

Avoid packages that pull server-only behavior into client bundles.

---

## Bundle Size

Significant frontend dependencies require bundle-impact review.

Potential checks:

```text
build analyzer
compressed size
client/server split
tree-shaking
duplicate framework copies
```

A package used only on one route should be lazy-loaded when appropriate.

---

## Provider SDK Isolation

Provider SDK packages should exist only in their provider adapter or integration project.

Examples:

```text
discord.js -> Discord runtime
GitHub SDK -> GitHub adapter
Google SDK -> Google adapter
Resend SDK -> email adapter
AI SDK -> model adapter
```

Shared contracts must not depend on provider SDK packages.

---

## Security-Sensitive Packages

Security-sensitive dependencies include:

```text
authentication libraries
session libraries
cryptography
JWT libraries
OAuth libraries
HTML sanitizers
URL parsers
webhook signature libraries
file parsers
archive libraries
```

They require:

```text
active maintenance
security history review
direct tests
controlled update policy
```

---

## Cryptography Packages

Prefer:

```text
Node.js cryptography APIs
Web Crypto
well-reviewed established libraries
```

Do not add packages that implement custom or obscure cryptographic behavior without security review.

A package advertising “military-grade encryption” earns immediate suspicion, not bonus points.

---

## HTML and Markdown Packages

Rendering libraries should be reviewed for:

```text
XSS behavior
HTML sanitization
link handling
embedded content
plugin execution
```

Markdown parsing and sanitization are separate responsibilities.

Do not assume a Markdown renderer produces safe HTML.

---

## File-Parsing Packages

File parsers increase attack surface.

Before adding one, review:

```text
supported formats
resource limits
malformed input behavior
archive bombs
path traversal
memory usage
security history
```

Parsing untrusted files should occur in a controlled boundary.

---

## AI SDK Packages

AI provider SDKs should remain optional to the core platform.

The AI architecture should continue to work through provider-neutral contracts.

An AI SDK must not become a dependency of:

```text
core
contracts
auth
modules
workflows
audit
notifications
```

unless the package is a provider-neutral Aerealith abstraction.

---

## Observability Packages

Observability packages can add substantial transitive weight.

Review:

```text
runtime support
automatic instrumentation
private-data collection
bundle size
Node.js hooks
Worker compatibility
native profiling components
```

Instrumentation packages should be owned by the observability boundary.

---

## Testing Packages

Testing packages belong in development dependencies.

Testing libraries should not appear in production bundles.

Build and container validation should detect accidental runtime imports from:

```text
Vitest
Playwright
testing-library
fixture utilities
mock libraries
```

---

## Package Scripts and Security

Never pass untrusted input into package scripts or shell commands without validation.

Bad:

```json
{
  "scripts": {
    "generate": "node tools/generate.js $USER_INPUT"
  }
}
```

Repository scripts should parse and validate arguments explicitly.

Destructive scripts must verify targets.

---

## Environment Variables

Package-manager and registry configuration may use:

```text
NPM_TOKEN
NODE_AUTH_TOKEN
PNPM_HOME
COREPACK_HOME
```

Application secrets should not be stored in package-manager configuration.

Avoid placing tokens directly in commands because shell history may retain them.

---

## Registry Secret Redaction

CI logs must not display:

```text
registry tokens
authorization headers
private registry URLs containing credentials
publish tokens
```

Package-manager debug logging should be controlled in release jobs.

---

## Supply-Chain Security

Package-management security should account for:

```text
dependency confusion
typosquatting
malicious maintainer updates
compromised package accounts
install-script execution
registry compromise
lockfile tampering
package replacement
```

Controls include:

```text
workspace protocol
scoped internal packages
lockfile integrity
frozen installs
dependency review
security scanning
registry controls
minimal lifecycle scripts
package provenance
SBOM generation
```

---

## Dependency Confusion

Internal packages should use:

```text
@aerealith scope
workspace protocol
private registry controls when published
```

Do not create unscoped internal package names that could resolve from the public registry.

CI should fail if an internal workspace dependency resolves externally.

---

## Typosquatting

Before adding a package:

```text
verify package spelling
verify publisher
verify repository
verify download source
verify documentation
```

A package name differing by one character from a common dependency deserves extra scrutiny.

---

## Package Provenance

Published Aerealith packages should use registry provenance or trusted publishing where supported.

Provenance should connect:

```text
published artifact
source repository
commit
release workflow
```

Release jobs should not publish artifacts built on an untrusted developer machine.

---

## Integrity Verification

The lockfile contains package integrity data.

Installations should use approved registries and frozen lockfiles.

Unexpected integrity changes require investigation.

Do not manually replace integrity entries.

---

## Dependency Quarantine

A dependency may be temporarily quarantined when:

```text
a critical vulnerability is disclosed
maintainer compromise is suspected
package behavior changes unexpectedly
registry provenance fails
```

Quarantine actions may include:

```text
block new installs
pin current known-good version
disable automated updates
replace the package
vendor a reviewed temporary copy
```

A quarantine decision should be documented and time-bounded.

---

## Incident Response

A dependency incident response should include:

```text
identify affected versions
identify affected projects
determine production reachability
stop vulnerable deployments
rotate exposed credentials if necessary
apply update, override, patch, or removal
run targeted tests
generate new release artifacts
update SBOM
document the incident
```

A package update alone may not be sufficient if credentials or data were exposed.

---

## Dependency Rollback

A dependency update should be reversible.

Rollback requires:

```text
known previous manifest
known previous lockfile
compatible database state
compatible generated output
release artifact traceability
```

Do not regenerate an old lockfile from ranges during an incident.

Use the exact prior committed lockfile.

---

## Automated Checks

Continuous integration should validate:

```text
pnpm version
Node.js version
lockfile consistency
workspace package declarations
undeclared imports
duplicate lockfiles
registry configuration
dependency vulnerabilities
license policy
build compatibility
```

---

## Duplicate Lockfile Detection

CI should reject unexpected files such as:

```text
package-lock.json
yarn.lock
bun.lock
bun.lockb
npm-shrinkwrap.json
```

Exception:

```text
a vendored third-party fixture intentionally containing one
```

Such fixtures must remain isolated and documented.

---

## Package Manifest Validation

Each `package.json` should be validated for:

```text
name
private status
type module
engines
scripts
exports
dependencies
peer dependencies
files
license
repository metadata
```

Internal packages should not accidentally become publishable.

---

## Dependency Boundary Validation

Tooling should detect when:

```text
a project imports an undeclared package
a frontend imports a server-only package
core imports a provider SDK
contracts import a database package
a module imports another module's private implementation
```

Enforcement may use:

```text
Nx project tags
ESLint restricted imports
package manifest validation
TypeScript project references
```

---

## Recommended Project Tags

Potential Nx tags:

```text
type:app
type:library
type:tool
scope:frontend
scope:api
scope:core
scope:data
scope:discord
scope:integration
scope:observability
runtime:browser
runtime:node
runtime:worker
```

Dependency constraints should align with these tags.

---

## Clean Install Validation

CI and release validation should periodically perform a clean install.

```bash
rm -rf node_modules
pnpm install --frozen-lockfile
```

This detects accidental dependence on:

```text
stale local packages
undeclared dependencies
generated files
old build output
hoisted packages
```

---

## Store Integrity Troubleshooting

When package installation behaves unexpectedly:

```text
1. Verify Node.js version.
2. Verify pnpm version.
3. Verify package manifests.
4. Verify the lockfile.
5. Run pnpm store status.
6. Remove node_modules.
7. Reinstall with the frozen lockfile.
8. Prune or repair the store only if necessary.
```

Deleting the lockfile is not an early troubleshooting step.

---

## Common Commands

### Install

```bash
pnpm install
```

### Frozen Install

```bash
pnpm install --frozen-lockfile
```

### Add Runtime Dependency

```bash
pnpm add <package> --filter <project>
```

### Add Development Dependency

```bash
pnpm add -D <package> --filter <project>
```

### Remove Dependency

```bash
pnpm remove <package> --filter <project>
```

### Update Dependency

```bash
pnpm update <package> --filter <project>
```

### Explain Dependency

```bash
pnpm why <package>
```

### List Workspace Dependencies

```bash
pnpm list --recursive
```

### Deduplicate

```bash
pnpm dedupe
```

### Audit

```bash
pnpm audit
```

### Prune Store

```bash
pnpm store prune
```

### Package Archive Preview

```bash
pnpm pack
```

---

## Root Script Direction

Recommended root scripts:

```json
{
  "scripts": {
    "deps:check": "node tools/scripts/check-dependencies.mjs",
    "deps:unused": "node tools/scripts/check-unused-dependencies.mjs",
    "deps:licenses": "node tools/scripts/check-licenses.mjs",
    "deps:sbom": "node tools/scripts/generate-sbom.mjs",
    "deps:audit": "pnpm audit",
    "deps:why": "pnpm why",
    "validate:lockfile": "node tools/scripts/validate-lockfile.mjs"
  }
}
```

Exact scripts should be finalized with the repository tooling implementation.

---

## Dependency Review Checklist

Before approving a new dependency, verify:

```text
purpose is clear
owner is clear
package is maintained
license is acceptable
security history is acceptable
transitive dependency count is reasonable
runtime is compatible
ESM support is acceptable
TypeScript support is acceptable
bundle impact is acceptable
provider lock-in is controlled
tests exist
removal path is understood
```

---

## Update Review Checklist

Before approving an update, verify:

```text
release notes reviewed
breaking changes reviewed
lockfile reviewed
new transitive dependencies reviewed
lifecycle scripts reviewed
security changes reviewed
affected projects tested
build passes
provider behavior remains compatible
database behavior remains compatible
```

---

## Publish Review Checklist

Before publishing, verify:

```text
release source is trusted
version is correct
package is intended to be public
exports are correct
declarations compile
archive contents are reviewed
license and README are present
no secrets are included
provenance is enabled
SBOM is generated when required
```

---

## Testing Strategy

Package-management testing should include:

```text
clean installation
frozen-lockfile installation
workspace linking
undeclared dependency detection
package export tests
declaration consumer tests
production dependency pruning
container builds
registry authentication
publishing dry run
license validation
SBOM generation
```

---

## Critical Package Tests

Tests must prove:

```text
CI refuses a stale lockfile
CI refuses an unsupported pnpm version
CI rejects extra lockfiles
internal packages resolve through workspace links
frontend packages cannot import server-only dependencies
provider SDKs remain inside adapters
production images start without devDependencies
published packages exclude secrets and internal files
private packages cannot be published accidentally
```

---

## Package Export Tests

Buildable packages should be tested through their declared exports.

A test fixture should import:

```text
package root
documented subpath exports
types
runtime values
```

It should not use source paths.

This detects:

```text
missing export entries
invalid ESM paths
private type leakage
NodeNext extension problems
```

---

## Production Pruning Tests

A production dependency test should:

```text
build the project
produce a production deployment directory
remove development dependencies
start the runtime
run health checks
execute a smoke test
```

This confirms runtime dependencies are classified correctly.

---

## Container Dependency Tests

Container tests should verify:

```text
frozen install
no registry credentials remain in layers
no development dependency is required at runtime
non-root execution
runtime startup
SBOM generation where configured
```

---

## Registry Tests

Private registry tests should verify:

```text
read-only install token works
missing token fails safely
publish token is unavailable to ordinary CI
package scope resolves to the correct registry
```

Tests must not print tokens.

---

## Dependency Failure Tests

Testing should simulate:

```text
registry unavailable
package integrity mismatch
stale lockfile
missing workspace package
peer dependency mismatch
revoked registry token
corrupted pnpm store
```

Errors should be clear and actionable.

---

## File Structure

Recommended dependency tooling structure:

```text
tools/
├── scripts/
│   ├── check-dependencies.mjs
│   ├── check-unused-dependencies.mjs
│   ├── check-licenses.mjs
│   ├── generate-sbom.mjs
│   ├── validate-lockfile.mjs
│   ├── validate-package-manifests.mjs
│   └── validate-package-exports.mjs
└── dependency-policy/
    ├── approved-licenses.json
    ├── denied-packages.json
    ├── dependency-overrides.json
    └── package-owners.json
```

Documentation may include:

```text
docs/engineering/
├── Package Management.md
├── Dependency Overrides.md
├── Package Publishing.md
└── Dependency Incident Response.md
```

---

## Package Owner Registry

A package-owner registry may identify responsibility for important dependencies.

Example:

```json
{
  "discord.js": {
    "owner": "Discord Integration",
    "risk": "significant",
    "purpose": "Discord gateway and REST provider adapter"
  },
  "drizzle-orm": {
    "owner": "Data Platform",
    "risk": "significant",
    "purpose": "PostgreSQL and CockroachDB persistence"
  }
}
```

This registry is optional for routine packages but useful for foundational dependencies.

---

## Denied Packages

The repository may maintain a denied-package list for packages that are:

```text
malicious
abandoned
license-incompatible
security-prohibited
architecture-breaking
unnecessary duplicates
```

A denied package should include:

```text
reason
replacement
review date
```

---

## Approved Licenses

The license policy should define:

```text
automatically approved licenses
licenses requiring review
denied licenses
unknown-license behavior
```

Unknown licenses should fail review rather than pass silently.

---

## Package Management Anti-Patterns

Avoid:

```text
using npm, Yarn, or Bun alongside pnpm
committing multiple lockfiles
adding application dependencies to the root package
relying on phantom dependencies
using latest or wildcard versions
deleting the lockfile to resolve routine conflicts
manually editing lockfile internals
ignoring peer dependency warnings
letting provider SDKs leak across boundaries
keeping unused dependencies
using overrides without documentation
maintaining permanent patches without upstream tracking
committing registry tokens
running publish commands from developer machines
auto-merging major framework upgrades
trusting one vulnerability scanner
using production credentials during package installation
```

---

## Relationship to Monorepo Architecture

Package ownership must match project ownership.

pnpm workspace dependencies and Nx project boundaries should describe the same architecture.

A package should not import across a prohibited Nx boundary merely because the dependency can be installed.

---

## Relationship to Code Style

Code style requires:

```text
explicit imports
intentional package boundaries
no provider SDK leakage
no persistence leakage
```

Package manifests must support those rules.

---

## Relationship to TypeScript Standards

TypeScript package configuration must preserve:

```text
ESM behavior
project references
declaration output
package exports
runtime compatibility
```

Dependency changes that affect declarations or module resolution require TypeScript validation.

---

## Relationship to Testing

Every dependency update must run appropriate tests.

Provider SDK, framework, database, security, and build-tool updates require deeper suites than routine development utilities.

---

## Relationship to Local Development

Local development uses:

```text
Corepack
the pinned pnpm version
the committed lockfile
workspace links
```

A clean local install should match CI dependency resolution.

---

## Relationship to Security Architecture

Package management is part of the software supply chain.

Security controls include:

```text
frozen installs
lockfile integrity
security scanning
license review
registry controls
credential isolation
minimal lifecycle scripts
SBOM generation
provenance
```

---

## Relationship to Integration Architecture

Provider SDK packages belong inside provider-specific adapters.

An integration package must not expose raw SDK types through public contracts.

---

## Relationship to Module Architecture

Modules should depend on:

```text
Aerealith module contracts
approved capabilities
provider-neutral interfaces
```

They should not declare unrestricted access to core infrastructure or provider clients.

---

## Relationship to Self-Hosting

Self-hosted builds must be reproducible from:

```text
repository source
package manifests
pnpm lockfile
documented Node.js and pnpm versions
```

Self-hosted users should not require private Aerealith registry credentials unless they intentionally use a private package distribution.

---

## Implementation Sequence

Recommended implementation order:

```text
1. Pin the pnpm version.
2. Enable Corepack documentation.
3. Finalize pnpm-workspace.yaml.
4. Remove duplicate lockfiles.
5. Add engine validation.
6. Move runtime dependencies to owning projects.
7. Add workspace protocol for internal packages.
8. Add package manifest validation.
9. Add undeclared dependency detection.
10. Add Nx and ESLint dependency constraints.
11. Configure Renovate.
12. Define Dependabot responsibility.
13. Add license scanning.
14. Add vulnerability scanning.
15. Add dependency-owner metadata for critical packages.
16. Add override documentation.
17. Add patch documentation.
18. Add SBOM generation.
19. Add package export tests.
20. Add production pruning tests.
21. Add trusted package publishing.
22. Add package provenance.
23. Add dependency incident-response documentation.
```

---

## Required Decisions

Before this standard is considered stable, Aerealith must finalize:

```text
exact pnpm version
exact Node.js engine policy
workspace protocol policy
version range policy
strict peer dependency policy
auto-install peer policy
hoisting policy
Renovate grouping
Dependabot responsibility
auto-merge policy
approved license list
SBOM format
package provenance mechanism
private registry strategy
public package versioning strategy
changeset tooling
override review interval
patch review interval
```

---

## Success Criteria

The package-management standard is successful when:

```text
pnpm is the only package manager
the pnpm version is pinned
Node.js 24.x is enforced
one lockfile is committed
CI uses frozen installs
workspace packages use workspace links
dependencies belong to importing projects
phantom dependencies are rejected
provider SDKs remain isolated
runtime and development dependencies are classified correctly
security scanning is automated
license review is automated
Renovate handles routine updates
Dependabot security alerts remain active
major updates receive manual review
overrides and patches are documented
production images exclude unnecessary packages
package exports are tested
published packages contain only intended files
registry credentials remain secret
SBOMs can be produced for releases
dependency incidents have a documented response path
```

---

## Final Standard

Aerealith package management should make every dependency intentional, reproducible, inspectable, replaceable, and secure throughout its full lifecycle.

The standard is:

> Every Aerealith package is installed through the pinned pnpm version, resolved through the committed lockfile, owned by the project that imports it, constrained by monorepo architecture, reviewed for maintenance, licensing, security, runtime compatibility, and transitive impact, updated through controlled automation, tested at the level of its risk, isolated from production credentials, reproducible in clean and containerized builds, and removable without hidden coupling. No dependency may bypass Aerealith's security, provider, module, runtime, or package-boundary standards merely because the package manager can install it.
