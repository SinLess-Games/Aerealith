# TypeScript Standards

Status: Draft
Owner: SinLess Games LLC
Last Updated: 2026-07-13
Security Classification: Internal Engineering
Primary Language: TypeScript
Primary Runtime: Node.js 24.x
Module Standard: ECMAScript Modules
Package Manager: pnpm
Build Orchestration: Nx

Related Engineering Documentation:

- `docs/engineering/Code Style.md`
- `docs/engineering/Testing.md`
- `docs/engineering/Local Development.md`
- `docs/engineering/Git Workflow.md`
- `docs/engineering/Dependency Management.md`
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

---

## Purpose

This document defines the TypeScript standards for Aerealith AI.

It governs how TypeScript is configured, written, compiled, validated, organized, reviewed, tested, and published throughout the Aerealith monorepo.

The TypeScript standard covers:

```text
compiler configuration
ECMAScript modules
project references
Nx project boundaries
source and declaration output
strictness
type inference
runtime validation
unknown input
interfaces
type aliases
unions
generics
readonly data
null and undefined
type guards
assertions
errors
results
async behavior
API contracts
database mapping
provider adapters
React
Hono
NestJS
Drizzle
events
workflows
modules
AI output
tests
generated code
```

The objective is to make TypeScript code:

```text
strict
explicit
portable
safe at runtime boundaries
easy to understand
easy to refactor
difficult to misuse
compatible across supported runtimes
```

The guiding rule is:

> TypeScript describes trusted program state, while runtime schemas establish whether external data is allowed to become trusted program state.

TypeScript types disappear at runtime.

A type declaration alone is never sufficient validation for:

```text
HTTP input
environment variables
database JSON
provider payloads
queue messages
webhooks
AI output
files
user configuration
```

---

## Core Principles

Aerealith TypeScript follows these principles:

```text
Strict mode is mandatory.
External input begins as unknown.
Runtime validation occurs at trust boundaries.
Public contracts are explicit.
Provider SDK types remain inside adapters.
Database rows remain inside the data layer.
Readonly data is preferred at public boundaries.
Discriminated unions model state.
Unsafe assertions are exceptional.
Expected failures use structured results.
Exceptions represent defects or unrecoverable conditions.
ES modules are the default.
Import boundaries are architecture boundaries.
Generated declarations must remain stable.
```

---

## Supported TypeScript Version

The repository should use one pinned TypeScript version.

The version is declared in the root workspace.

```json
{
  "devDependencies": {
    "typescript": "<pinned-version>"
  }
}
```

Rules:

```text
All projects use the workspace TypeScript version.
No project installs a private TypeScript compiler.
TypeScript upgrades occur through reviewed dependency changes.
Compiler-option changes are reviewed as architecture changes.
```

Major or behavior-changing TypeScript upgrades require:

```text
full type checking
full test suite
declaration validation
generated contract review
framework compatibility review
runtime build validation
```

---

## Runtime Targets

Aerealith supports several TypeScript execution targets.

| Target             | Typical Projects                                       | Compiler Direction               |
| ------------------ | ------------------------------------------------------ | -------------------------------- |
| Node.js 24.x       | Workers, Discord runtime, scripts, background services | `NodeNext`                       |
| Cloudflare Workers | API and edge-compatible services                       | `ESNext` with bundler resolution |
| Browser            | Frontend applications                                  | `ESNext` with bundler resolution |
| Shared Libraries   | Core, contracts, utilities                             | Runtime-neutral where practical  |
| Test Runtime       | Vitest and Playwright support code                     | Match the owning project         |

Shared libraries must not depend on runtime-specific globals unless the library explicitly declares that runtime.

---

## ECMAScript Modules

Aerealith uses ECMAScript modules.

Root `package.json`:

```json
{
  "type": "module"
}
```

Use:

```ts
import { createHash } from 'node:crypto'
import { z } from 'zod'

export function createFingerprint(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
```

Avoid:

```ts
const crypto = require('crypto')
module.exports = {}
```

CommonJS is permitted only when required by:

```text
legacy tooling
third-party configuration
framework interoperability
generated code
```

A CommonJS exception should remain isolated.

---

## Module Resolution

Node.js deployables should use:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

Bundled browser and Worker projects should use:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler"
  }
}
```

Do not mix resolution strategies casually inside one project.

The owning runtime determines the strategy.

---

## Node.js Imports

Use the `node:` prefix for Node.js built-ins.

Good:

```ts
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
```

Avoid:

```ts
import { randomUUID } from 'crypto'
import fs from 'fs'
```

The prefix makes runtime dependencies explicit.

---

## Runtime-Neutral Libraries

Libraries intended for:

```text
Node.js
Cloudflare Workers
browser
tests
```

should avoid runtime-specific APIs.

Prefer platform-neutral APIs such as:

```text
URL
URLSearchParams
fetch
Request
Response
Headers
TextEncoder
TextDecoder
crypto.getRandomValues
crypto.randomUUID
```

Do not import:

```text
node:fs
node:path
node:net
node:tls
```

inside runtime-neutral libraries.

Runtime-specific behavior belongs behind an adapter.

---

## Base Compiler Configuration

The repository should provide a strict base configuration.

Example:

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "lib": ["ES2024"],
    "strict": true,
    "noImplicitAny": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "useDefineForClassFields": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": true
  }
}
```

Exact options should be finalized in the root TypeScript configuration.

---

## Required Strictness

The following options are mandatory unless a narrowly documented exception exists:

```text
strict
noImplicitAny
noImplicitOverride
noImplicitReturns
noFallthroughCasesInSwitch
noUncheckedIndexedAccess
exactOptionalPropertyTypes
useUnknownInCatchVariables
forceConsistentCasingInFileNames
verbatimModuleSyntax
isolatedModules
```

Disabling one of these options for an entire project requires architecture review.

---

## `strict`

`strict` enables the baseline TypeScript safety model.

Do not weaken strictness to accommodate:

```text
old provider SDKs
poorly typed test utilities
temporary migration code
generated fixtures
```

Instead:

```text
isolate the boundary
add a local declaration
validate the value
create a narrow adapter
```

---

## `noUncheckedIndexedAccess`

Indexed access produces a possibly undefined value.

```ts
const firstPermission = permissions[0]
```

The type is:

```ts
string | undefined
```

Handle it explicitly.

```ts
const firstPermission = permissions[0]

if (!firstPermission) {
  return err(createPermissionListEmptyError())
}
```

Do not use a non-null assertion merely because the array is expected to contain data.

---

## `exactOptionalPropertyTypes`

Optional properties distinguish between:

```text
property not present
property present with undefined
```

Example:

```ts
interface UpdateProfileInput {
  readonly displayName?: string
}
```

This allows:

```ts
{
}
```

but should not automatically imply:

```ts
{
  displayName: undefined
}
```

Use explicit unions when `undefined` is a meaningful provided value.

---

## `noImplicitOverride`

Overridden methods require the `override` keyword.

```ts
export class DiscordProviderError extends Error {
  public override readonly name = 'DiscordProviderError'
}
```

This protects against accidental method shadowing after base-class changes.

---

## `useUnknownInCatchVariables`

Caught values are `unknown`.

Correct:

```ts
try {
  return await provider.execute(input)
} catch (error: unknown) {
  return err(mapProviderError(error))
}
```

Incorrect:

```ts
try {
  // ...
} catch (error) {
  return err({
    message: error.message,
  })
}
```

Not every thrown value is an `Error`.

---

## `verbatimModuleSyntax`

Use explicit type imports.

```ts
import type { ModuleManifest } from '@aerealith/contracts'
import { ModuleRegistry } from './module-registry.js'
```

This makes runtime imports visible and prevents compiler rewriting from hiding module-system problems.

---

## `isolatedModules`

Every file must be compilable independently.

This supports:

```text
bundlers
Workers
fast transpilation
test runners
incremental builds
```

Avoid TypeScript features that depend on whole-program emit behavior.

---

## Project Configuration Structure

Recommended configuration files:

```text
tsconfig.base.json
tsconfig.json
tsconfig.node.json
tsconfig.worker.json
tsconfig.browser.json
tsconfig.test.json
```

Projects extend the nearest valid shared configuration.

Example:

```json
{
  "extends": "../../../tsconfig.node.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "../../../dist/apps/integrations/discord"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.spec.ts"]
}
```

---

## Root Configuration

The root `tsconfig.json` should primarily define project references.

Example:

```json
{
  "files": [],
  "references": [
    {
      "path": "./apps/frontend"
    },
    {
      "path": "./apps/services/api"
    },
    {
      "path": "./apps/integrations/discord"
    },
    {
      "path": "./libs/core"
    },
    {
      "path": "./libs/contracts"
    },
    {
      "path": "./libs/db"
    }
  ]
}
```

Do not compile the entire monorepo as one undifferentiated project.

---

## Project References

Buildable libraries should use project references where practical.

Benefits include:

```text
incremental builds
clear dependency direction
declaration generation
faster type checking
stable library boundaries
```

A referenced library should generally enable:

```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true
  }
}
```

Deployable applications may consume referenced library output through Nx build orchestration.

---

## Incremental Compilation

TypeScript incremental output should be stored outside source directories.

Example:

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "../../../.cache/typescript/discord.tsbuildinfo"
  }
}
```

Build information must not be committed.

---

## Source Directories

Production TypeScript should normally live under:

```text
src/
```

Tests may live:

```text
beside source files
under tests/
```

Generated code should live in a clearly identified generated directory.

Avoid mixing:

```text
source
generated output
compiled JavaScript
declaration output
```

inside the same directory.

---

## Emission

Deployable applications may use:

```text
TypeScript compiler
Nx compiler
SWC
esbuild
framework compiler
```

depending on runtime requirements.

Type checking remains mandatory even when another tool performs JavaScript emission.

A fast transpiler is not a replacement for:

```bash
tsc --noEmit
```

or the equivalent Nx type-check target.

---

## `noEmit` Projects

Frontend and Worker projects that rely on framework or bundler emission may use:

```json
{
  "compilerOptions": {
    "noEmit": true
  }
}
```

Libraries intended to publish declarations should emit:

```text
JavaScript when required
.d.ts files
declaration maps
```

---

## Declaration Files

Public libraries should generate declaration files.

Declaration output should:

```text
expose only intentional public APIs
avoid provider SDK types
avoid Drizzle row types
avoid framework-private types
avoid deep internal paths
```

A public declaration that exposes an internal implementation type indicates a broken boundary.

---

## Declaration Maps

Enable declaration maps for buildable shared libraries.

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true
  }
}
```

Declaration maps improve navigation across workspace packages.

They should not expose production source maps publicly without review.

---

## `skipLibCheck`

`skipLibCheck` should not be used to hide Aerealith declaration errors.

Recommended direction:

```text
Shared contract and core libraries: false
Published or buildable libraries: false
Deployable applications: true only when necessary for third-party compatibility
CI declaration validation: false where practical
```

Any use of `skipLibCheck: true` should remain documented.

---

## Path Aliases

Workspace imports should use stable package aliases.

Examples:

```ts
import type { WorkflowDefinition } from '@aerealith/contracts/workflows'
import { createError } from '@aerealith/core/errors'
import { createLogger } from '@aerealith/observability'
```

Avoid aliases that expose internal file structure.

Bad:

```ts
import { mapRow } from '@aerealith/db/src/internal/mappers/map-row'
```

Good:

```ts
import { WorkflowRepository } from '@aerealith/db/workflows'
```

---

## Relative Imports

Use relative imports within the same feature or project when the path remains understandable.

```ts
import { createWorkflowFingerprint } from './create-workflow-fingerprint.js'
```

Use workspace package imports across project boundaries.

Avoid very deep paths:

```ts
../../../../../../shared/utils/helper
```

Deep relative paths usually indicate:

```text
poor project ownership
missing public boundary
incorrect directory structure
```

---

## File Extensions in Imports

NodeNext projects should follow the emitted JavaScript extension rules.

Source:

```ts
import { createError } from './create-error.js'
```

even when the source file is:

```text
create-error.ts
```

Bundler projects may follow bundler-supported extensionless imports.

The project configuration must be consistent.

---

## Public Package Boundaries

Each workspace library should define an intentional public API.

Example:

```text
libs/core/src/index.ts
libs/core/src/errors/index.ts
libs/core/src/workflows/index.ts
```

Consumers should not import private implementation paths.

Nx and ESLint should enforce package boundaries.

---

## Named Exports

Use named exports by default.

```ts
export interface WorkflowRepository {
  // ...
}

export function createWorkflowRepository(): WorkflowRepository {
  // ...
}
```

Default exports are allowed for framework-required files such as:

```text
Next.js pages
layouts
framework configuration
```

---

## Type-Only Exports

Use explicit type-only exports.

```ts
export type { WorkflowDefinition, WorkflowRun, WorkflowRunStatus }
```

Runtime values should use ordinary exports.

```ts
export { WorkflowStatus, createWorkflowId }
```

---

## External Input

External input begins as `unknown`.

Examples:

```ts
function parseWebhookPayload(
  payload: unknown,
): Result<WebhookEvent, AerealithError> {
  const parsed = WebhookEventSchema.safeParse(payload)

  if (!parsed.success) {
    return err(createWebhookPayloadInvalidError(parsed.error))
  }

  return ok(parsed.data)
}
```

Do not type external input directly as a trusted contract.

Incorrect:

```ts
async function handleWebhook(payload: DiscordWebhookEvent): Promise<void> {
  // payload was never validated
}
```

---

## Runtime Schemas

Use Zod or the approved runtime schema library.

A schema should be the authority for runtime shape.

```ts
export const IntegrationConnectionResponseSchema = z.object({
  id: z.string().min(1),
  provider: z.string().min(1),
  status: z.enum([
    'connected',
    'active',
    'degraded',
    'disconnected',
    'revoked',
  ]),
})

export type IntegrationConnectionResponse = z.infer<
  typeof IntegrationConnectionResponseSchema
>
```

Avoid manually maintaining a schema and interface that can drift.

---

## Schema Input and Output Types

When transformations occur, distinguish input and output types.

```ts
export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export type PaginationInput = z.input<typeof PaginationSchema>
export type Pagination = z.output<typeof PaginationSchema>
```

This is important when schemas:

```text
coerce
transform
default
normalize
```

---

## Strict Schemas

Public request schemas should usually use `.strict()`.

```ts
export const CreateWorkflowRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2_000).optional(),
  })
  .strict()
```

Unknown fields should be accepted only when compatibility requirements justify them.

---

## Validation at Boundaries

Validation should occur when data crosses:

```text
HTTP boundary
provider boundary
queue boundary
database JSON boundary
configuration boundary
AI boundary
file boundary
webhook boundary
```

Internal trusted objects should not be revalidated repeatedly without purpose.

---

## Type Inference

Prefer inference for obvious local values.

```ts
const maximumAttempts = 5
const enabledModuleIds = modules.map((module) => module.id)
```

Use explicit return types for exported functions.

```ts
export function createModuleId(value: string): ModuleId {
  return value as ModuleId
}
```

Public methods and interfaces should remain explicit.

---

## Function Return Types

Exported functions should normally declare return types.

```ts
export function mapConnectionStatus(
  value: ProviderConnectionStatus,
): IntegrationConnectionStatus {
  // ...
}
```

Benefits:

```text
stable public behavior
clear review
protection against accidental type widening
better declaration output
```

Internal one-line callbacks do not require explicit return types.

---

## Function Parameters

Public functions and methods require explicit parameter types.

```ts
export async function getWorkflowRun(
  input: GetWorkflowRunInput,
  context: RequestContext,
): Promise<Result<WorkflowRun, AerealithError>> {
  // ...
}
```

Avoid positional primitive overload.

Prefer an input object for several related values.

---

## Interfaces and Type Aliases

Use `interface` for object-shaped extensible contracts.

```ts
export interface NotificationChannelAdapter {
  readonly channel: NotificationChannel

  deliver(
    request: NotificationDeliveryRequest,
  ): Promise<Result<NotificationDeliveryResult, AerealithError>>
}
```

Use `type` for:

```text
unions
intersections
function signatures
mapped types
aliases
```

```ts
export type NotificationChannel = 'in-app' | 'email' | 'discord' | 'push'
```

---

## Interface Prefixes

Do not prefix interfaces with `I`.

Avoid:

```ts
interface IUserRepository {}
interface IModuleRegistry {}
```

Use:

```ts
interface UserRepository {}
interface ModuleRegistry {}
```

---

## Type Naming

Types use PascalCase.

Examples:

```text
WorkflowRun
IntegrationConnection
DiscordPermissionResult
AuditRecord
AIActionProposal
```

Type parameters should use descriptive names.

Preferred:

```ts
Result<TValue, TError>
Repository<TEntity, TId>
EventEnvelope<TPayload>
```

Avoid vague generic names when more than one parameter exists:

```ts
Manager<T, U, V>
```

---

## Discriminated Unions

Use discriminated unions to represent variant state.

```ts
export type WorkflowStepResult =
  | {
      readonly status: 'succeeded'
      readonly output: WorkflowStepOutput
    }
  | {
      readonly status: 'failed'
      readonly error: AerealithError
    }
  | {
      readonly status: 'waiting-for-approval'
      readonly approvalId: ApprovalId
      readonly expiresAt: string
    }
```

This is preferable to a structure containing many optional fields.

Avoid:

```ts
interface WorkflowStepResult {
  readonly status: string
  readonly output?: WorkflowStepOutput
  readonly error?: AerealithError
  readonly approvalId?: string
}
```

The invalid states are too easy to construct.

---

## State Modeling

Model lifecycle states with explicit unions.

```ts
export type IntegrationConnectionStatus =
  | 'connecting'
  | 'pending-authorization'
  | 'pending-verification'
  | 'connected'
  | 'active'
  | 'degraded'
  | 'disconnected'
  | 'revoked'
  | 'expired'
```

Do not use an unrestricted `string`.

---

## Exhaustive Switches

Switches over discriminated unions must be exhaustive.

```ts
export function getConnectionStatusLabel(
  status: IntegrationConnectionStatus,
): string {
  switch (status) {
    case 'connecting':
      return 'Connecting'
    case 'pending-authorization':
      return 'Pending authorization'
    case 'pending-verification':
      return 'Pending verification'
    case 'connected':
      return 'Connected'
    case 'active':
      return 'Active'
    case 'degraded':
      return 'Degraded'
    case 'disconnected':
      return 'Disconnected'
    case 'revoked':
      return 'Revoked'
    case 'expired':
      return 'Expired'
    default:
      return assertNever(status)
  }
}
```

Helper:

```ts
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`)
}
```

---

## Literal Objects

Prefer `as const` objects over TypeScript enums.

```ts
export const RiskLevel = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  Critical: 'critical',
} as const

export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel]
```

Benefits:

```text
plain JavaScript output
stable serialized values
easy iteration
easy schema integration
```

---

## Enums

Avoid TypeScript enums by default.

Enums are acceptable only when required by:

```text
provider SDK
framework
generated code
database generator
```

Map them at the boundary.

```ts
export function mapDiscordPermission(
  permission: Discord.PermissionFlagsBits,
): AerealithDiscordPermission {
  // ...
}
```

---

## `satisfies`

Use `satisfies` when an object should be checked without losing its narrow literal type.

```ts
export const WorkflowStatusLabels = {
  pending: 'Pending',
  running: 'Running',
  succeeded: 'Succeeded',
  failed: 'Failed',
  cancelled: 'Cancelled',
} satisfies Record<WorkflowRunStatus, string>
```

This is often preferable to a broad annotation.

---

## `as const`

Use `as const` for immutable literal definitions.

```ts
export const SupportedProviders = ['discord', 'github', 'google'] as const

export type SupportedProvider = (typeof SupportedProviders)[number]
```

Do not add `as const` mechanically to large mutable application state.

---

## Readonly Contracts

Public contracts should prefer readonly properties.

```ts
export interface WorkflowDefinition {
  readonly id: WorkflowId
  readonly name: string
  readonly version: number
  readonly steps: readonly WorkflowStepDefinition[]
}
```

Use:

```text
readonly T[]
ReadonlyArray<T>
Readonly<Record<K, V>>
```

when consumers should not mutate data.

---

## Mutable Internal State

Local mutation is acceptable when ownership is clear.

```ts
const missingPermissions: DiscordPermission[] = []

for (const permission of requiredPermissions) {
  if (!grantedPermissions.has(permission)) {
    missingPermissions.push(permission)
  }
}
```

Do not force complex immutable copying when a local mutable collection is clearer.

---

## Optional Properties

Use optional properties when the property may be absent.

```ts
export interface RequestContext {
  readonly requestId: RequestId
  readonly traceId?: TraceId
}
```

Do not use optional properties to represent incompatible state variants.

Use a discriminated union instead.

---

## Null and Undefined

Use `undefined` for:

```text
optional input
not supplied
not resolved
```

Use `null` for:

```text
explicit empty database value
external API null
public contract that intentionally permits null
```

Example:

```ts
export interface UserRecord {
  readonly displayName?: string
  readonly deletedAt: string | null
}
```

Avoid:

```ts
;string | null | undefined
```

unless all three states are genuinely meaningful.

---

## `NonNullable`

Use `NonNullable<T>` only after a runtime check or established invariant.

```ts
const actor = context.actor

if (!actor) {
  return err(createAuthenticationRequiredError())
}

type AuthenticatedActor = NonNullable<RequestContext['actor']>
```

Do not use utility types to pretend a runtime check occurred.

---

## Index Signatures

Avoid broad index signatures.

Bad:

```ts
interface Metadata {
  [key: string]: any
}
```

Prefer:

```ts
type MetadataValue = string | number | boolean | null | readonly string[]

type SafeMetadata = Readonly<Record<string, MetadataValue>>
```

For audited or public metadata, prefer a dedicated schema.

---

## Branded Identifiers

Use branded types for IDs when confusing identifiers would be dangerous.

```ts
declare const UserIdBrand: unique symbol

export type UserId = string & {
  readonly [UserIdBrand]: true
}
```

Factory:

```ts
export function createUserId(value: string): UserId {
  const parsed = UserIdSchema.safeParse(value)

  if (!parsed.success) {
    throw new Error('Invalid user ID')
  }

  return parsed.data as UserId
}
```

Potential branded identifiers:

```text
UserId
AccountId
OrganizationId
CommunityId
WorkflowId
WorkflowRunId
ApprovalId
RequestId
TraceId
```

Branding is most valuable where passing the wrong ID could create a security or scope error.

---

## Branded Type Boundaries

Branded IDs should be created only through:

```text
validated factories
runtime schemas
database mappers
trusted generators
```

Do not scatter assertions:

```ts
const userId = value as UserId
```

through application code.

---

## Opaque Values

Credentials and sensitive references may use opaque types.

```ts
declare const CredentialReferenceBrand: unique symbol

export type CredentialReference = string & {
  readonly [CredentialReferenceBrand]: true
}
```

Opaque typing does not replace secret handling.

It prevents accidental interchange with ordinary strings.

---

## Type Guards

Use type guards when narrowing a runtime value.

```ts
export function isError(value: unknown): value is Error {
  return value instanceof Error
}
```

For complex external values, prefer schemas over handwritten type guards.

Handwritten guards are appropriate for:

```text
simple internal unions
Error detection
framework-specific narrowing
small stable structures
```

---

## Assertion Functions

Assertion functions are allowed for internal invariants.

```ts
export function assertDefined<T>(
  value: T | null | undefined,
  message: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message)
  }
}
```

Do not use assertion functions to validate public input unless they produce the approved error model.

---

## Type Assertions

Type assertions are exceptional.

Avoid:

```ts
payload as WebhookEvent
value as unknown as ModuleManifest
connection!
```

An assertion is acceptable when:

```text
runtime validation already occurred
the framework has incomplete typing
generated code creates a verified mismatch
a branded value is created through a trusted factory
```

The assertion should remain narrow and documented when non-obvious.

---

## Double Assertions

Double assertions are prohibited in normal code.

```ts
value as unknown as TargetType
```

They bypass the type system almost completely.

A temporary migration exception requires:

```text
comment
tracked issue
narrow file scope
direct tests
```

---

## Non-Null Assertions

Avoid the `!` operator.

Bad:

```ts
const connection = connections[0]!
```

Good:

```ts
const connection = connections[0]

if (!connection) {
  return err(createConnectionNotFoundError())
}
```

Framework-required non-null assertions must be isolated.

---

## `any`

Explicit `any` is prohibited by default.

Prefer:

```text
unknown
generic parameter
narrow interface
schema output
provider adapter wrapper
```

An `any` exception requires a comment.

```ts
// The provider callback type is declared as `any` upstream.
// Validate before returning from this adapter.
const providerValue: any = callbackPayload
```

The value must not leave the boundary without validation.

---

## Implicit `any`

Implicit `any` is always prohibited.

Callback parameters, destructuring, and generic values should infer correctly or receive explicit types.

---

## Generic Functions

Use generics when they preserve meaningful relationships.

Good:

```ts
export function mapResult<TValue, TMapped>(
  result: Result<TValue, AerealithError>,
  mapper: (value: TValue) => TMapped,
): Result<TMapped, AerealithError> {
  if (!result.ok) {
    return result
  }

  return ok(mapper(result.value))
}
```

Avoid generics that merely obscure concrete domain behavior.

---

## Generic Constraints

Constrain generic parameters.

```ts
export interface EntityRepository<
  TEntity extends {
    readonly id: string
  },
> {
  findById(id: TEntity['id']): Promise<TEntity | null>
}
```

Do not use unconstrained generic values when implementation assumes specific fields.

---

## Default Generic Parameters

Default generic parameters are acceptable when the default is safe and obvious.

```ts
export interface EventEnvelope<TPayload = unknown> {
  readonly eventId: string
  readonly eventType: string
  readonly payload: TPayload
}
```

Using `unknown` is safer than `any`.

---

## Conditional Types

Use conditional types sparingly.

They are appropriate for:

```text
contract derivation
framework adapters
schema utilities
type-safe registries
```

Avoid deeply recursive conditional types that:

```text
slow the compiler
produce unreadable errors
hide domain meaning
```

Prefer a simpler explicit type when possible.

---

## Utility Types

Use built-in utility types intentionally.

Appropriate:

```text
Pick
Omit
Partial
Required
Readonly
Record
Extract
Exclude
ReturnType
Parameters
```

Avoid using `Partial<T>` for update commands without considering field semantics.

Bad:

```ts
type UpdateUserInput = Partial<User>
```

This may expose:

```text
id
createdAt
security state
internal flags
```

Prefer an explicit update contract.

```ts
interface UpdateUserProfileInput {
  readonly displayName?: string
  readonly locale?: string
}
```

---

## Deep Utility Types

Avoid broad custom types such as:

```text
DeepPartial
DeepReadonly
DeepRequired
```

unless the use case is narrowly understood.

Deep transformations often produce confusing contracts and invalid state.

---

## Object Construction

Construct public objects explicitly.

Good:

```ts
const response: IntegrationConnectionResponse = {
  id: connection.id,
  provider: connection.provider,
  status: connection.status,
  connectedAt: connection.connectedAt,
}
```

Avoid spreading untrusted or persistence objects.

```ts
const response = {
  ...row,
}
```

Explicit construction prevents accidental exposure of:

```text
credentials
internal flags
private metadata
database columns
```

---

## Function Overloads

Use overloads only when they improve caller type safety.

```ts
export function parseIdentifier(
  type: 'user',
  value: string,
): Result<UserId, AerealithError>

export function parseIdentifier(
  type: 'account',
  value: string,
): Result<AccountId, AerealithError>

export function parseIdentifier(
  type: 'user' | 'account',
  value: string,
): Result<UserId | AccountId, AerealithError> {
  // ...
}
```

Avoid overloads when a discriminated input object is clearer.

---

## Rest Parameters

Rest parameters should use explicit readonly arrays where appropriate.

```ts
export function createPermissionSet(
  ...permissions: readonly Permission[]
): ReadonlySet<Permission> {
  return new Set(permissions)
}
```

Avoid unbounded or unvalidated rest arguments at public boundaries.

---

## Classes

Use classes when they model:

```text
stateful service
owned dependency set
provider adapter
repository implementation
registry
coordinator
```

Use functions for:

```text
pure policy
mapping
validation
formatting
small factories
```

Do not create classes merely to group static functions.

---

## Class Fields

Use explicit visibility for public architecture-level classes.

```ts
export class ModuleRegistry {
  public constructor(
    private readonly manifests: ReadonlyMap<string, ModuleManifest>,
  ) {}

  public find(moduleId: string): ModuleManifest | undefined {
    return this.manifests.get(moduleId)
  }
}
```

Avoid TypeScript parameter properties in public contracts when they reduce readability.

They are acceptable for straightforward dependency injection.

---

## Private Fields

Use TypeScript `private` by default for service internals.

ECMAScript `#private` fields may be used when runtime privacy is required.

Be aware that `#private` fields may affect:

```text
testing
serialization
framework proxies
dependency injection
```

---

## Static Methods

Use static methods when behavior belongs to the type and does not require instance state.

Do not use static classes as global service containers.

---

## Abstract Classes

Prefer interfaces for architectural boundaries.

Use abstract classes when there is meaningful shared implementation.

Avoid abstract classes solely to force inheritance.

Composition is preferred over inheritance.

---

## Decorators

Decorators are permitted only within framework boundaries that require them.

Examples:

```text
NestJS controllers
NestJS providers
validation libraries when approved
```

Domain code, contracts, and core libraries should not depend on decorators.

Decorator metadata must not become the only source of runtime validation or authorization.

---

## Error Handling

Expected failures use:

```text
Result<TValue, AerealithError>
```

Example:

```ts
export type Result<TValue, TError> =
  | {
      readonly ok: true
      readonly value: TValue
    }
  | {
      readonly ok: false
      readonly error: TError
    }
```

Helpers:

```ts
export function ok<TValue>(value: TValue): Result<TValue, never> {
  return {
    ok: true,
    value,
  }
}

export function err<TError>(error: TError): Result<never, TError> {
  return {
    ok: false,
    error,
  }
}
```

---

## Result Narrowing

Use the discriminant.

```ts
const result = await repository.findById(id)

if (!result.ok) {
  return result
}

const entity = result.value
```

Do not access both `value` and `error` through optional fields.

---

## Error Contracts

Aerealith errors should use stable codes.

```ts
export interface AerealithError {
  readonly code: string
  readonly message: string
  readonly category: string
  readonly retryable: boolean
  readonly requestId?: RequestId
  readonly traceId?: TraceId
  readonly details?: SafeErrorDetails | null
}
```

Internal causes may be stored separately.

They must not enter public responses automatically.

---

## Throwing Errors

Throw for:

```text
violated internal invariant
programmer defect
invalid startup configuration
unrecoverable boot failure
framework interruption
```

Return structured errors for:

```text
not found
validation failure
permission denial
approval required
provider rejection
state conflict
rate limit
retryable infrastructure failure
```

---

## Error Subclasses

Custom `Error` subclasses should be rare.

When used:

```ts
export class ConfigurationError extends Error {
  public override readonly name = 'ConfigurationError'

  public constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
  }
}
```

Preserve stack and cause where supported.

---

## `cause`

Internal exceptions may use `cause`.

```ts
throw new ConfigurationError('The database configuration is invalid.', {
  cause: error,
})
```

Public error mapping must not serialize the cause automatically.

---

## Async Functions

Async functions return explicit promises.

```ts
export async function executeWorkflowAction(
  input: ExecuteWorkflowActionInput,
): Promise<Result<WorkflowActionResult, AerealithError>> {
  // ...
}
```

Avoid returning both:

```text
Promise<Result<T, E>>
and
throwing expected domain errors
```

from the same code path.

---

## Floating Promises

Floating promises are prohibited.

Bad:

```ts
eventPublisher.publish(event)
```

Good:

```ts
await eventPublisher.publish(event)
```

Intentionally detached operations require `void` and internal error handling.

```ts
void metricsPublisher.record(metric)
```

Detached operations must not be used for required:

```text
audit
state persistence
provider action
security notification
```

---

## Parallel Async Work

Use `Promise.all` only for independent work.

```ts
const [connectionResult, moduleResult] = await Promise.all([
  connectionRepository.findById(connectionId),
  moduleRepository.findInstallation(moduleInstallationId),
])
```

Do not parallelize:

```text
authorization after data loading
approval after permission checking
provider calls sharing a rate-limit bucket
writes requiring ordering
```

---

## `Promise.allSettled`

Use `Promise.allSettled` when partial outcomes are meaningful.

Example:

```ts
const results = await Promise.allSettled(
  notificationChannels.map((channel) => channel.deliver(deliveryRequest)),
)
```

The caller must map every fulfilled and rejected result explicitly.

---

## Timeouts

Async provider and network operations require timeouts.

The type should make timeout behavior explicit where practical.

```ts
export interface ProviderExecutionContext {
  readonly timeoutMs: number
  readonly signal: AbortSignal
}
```

Use `AbortController` for cancellable platform APIs.

---

## Cancellation

Cancellable methods should accept an `AbortSignal`.

```ts
export interface AIModelProvider {
  generate(
    request: AIModelRequest,
    options: {
      readonly signal: AbortSignal
    },
  ): Promise<Result<AIModelResponse, AerealithError>>
}
```

Do not invent incompatible cancellation mechanisms per provider.

---

## Dates and Times

Public TypeScript contracts should use ISO 8601 UTC strings.

```ts
export interface AuditRecord {
  readonly occurredAt: string
  readonly recordedAt: string
}
```

Internal persistence code may use `Date`.

Map explicitly at boundaries.

Avoid passing mutable `Date` objects through public contracts.

---

## Durations

Use numeric values with units in the name.

```ts
const timeoutMs = 30_000
const retentionDays = 90
const approvalExpirationMinutes = 15
```

Avoid ambiguous fields:

```ts
timeout
duration
retention
```

---

## Numeric Values

Use numeric separators.

```ts
const maximumPayloadBytes = 1_000_000
const providerTimeoutMs = 30_000
```

For money or provider billing:

```text
integer minor units
decimal string
bigint
```

Avoid floating-point currency values.

---

## BigInt

Use `bigint` for values exceeding safe integer precision.

Remember:

```text
JSON does not support bigint
```

Map it to:

```text
string
integer minor-unit contract within safe range
```

before serialization.

---

## API Contracts

API contracts belong under:

```text
libs/contracts
```

They should not expose:

```text
database rows
provider SDK types
framework request types
internal service classes
```

Example:

```ts
export const ModuleInstallationResponseSchema = z.object({
  id: z.string().min(1),
  moduleId: z.string().min(1),
  version: z.string().min(1),
  status: z.enum(['enabled', 'active', 'degraded', 'disabled', 'revoked']),
})

export type ModuleInstallationResponse = z.infer<
  typeof ModuleInstallationResponseSchema
>
```

---

## API Request Types

Request types should be inferred from schemas.

```ts
export const EnableModuleRequestSchema = z
  .object({
    scopeType: z.enum(['account', 'organization', 'community']),
    scopeId: z.string().min(1),
  })
  .strict()

export type EnableModuleRequest = z.infer<typeof EnableModuleRequestSchema>
```

Server-derived values such as actor and authorization scope should not be accepted from the request body.

---

## API Response Types

Responses should use the shared envelope.

```ts
export interface ApiSuccessResponse<TData> {
  readonly success: true
  readonly data: TData
  readonly requestId: RequestId
  readonly traceId?: TraceId
}

export interface ApiErrorResponse {
  readonly success: false
  readonly error: AerealithErrorResponse
}
```

Do not define feature-specific envelope shapes.

---

## Transport Types

Framework request and response types remain in transport layers.

Examples:

```text
Hono Context
NestJS Request
Cloudflare ExecutionContext
Next.js Request
```

Do not pass these objects into:

```text
domain policies
repositories
provider adapters
core libraries
```

Map them into Aerealith-owned context.

---

## Request Context

Use an explicit request context.

```ts
export interface RequestContext {
  readonly requestId: RequestId
  readonly traceId?: TraceId
  readonly actor?: AuthenticatedActor
  readonly scope?: AuthorizationScope
}
```

Do not hide identity or scope in ambient global state unless the runtime adapter owns that propagation intentionally.

---

## Hono Standards

Hono handlers should validate input before application service invocation.

```ts
router.post(
  '/api/V1/modules/:moduleId/enable',
  validateJson(EnableModuleRequestSchema),
  async (context) => {
    const body = context.req.valid('json')
    const requestContext = context.get('requestContext')

    const result = await enableModuleService.execute(
      {
        moduleId: context.req.param('moduleId'),
        ...body,
      },
      requestContext,
    )

    return mapResultToResponse(context, result)
  },
)
```

Avoid untyped context storage.

Define Hono variables explicitly.

---

## NestJS Standards

NestJS types should remain at the transport and dependency-wiring boundary.

Controllers should call typed application services.

```ts
@Controller('/api/V1/workflows')
export class WorkflowController {
  public constructor(
    private readonly createWorkflowService: CreateWorkflowService,
  ) {}

  @Post()
  public async create(
    @Body() body: CreateWorkflowRequest,
    @RequestContext() context: RequestContext,
  ): Promise<ApiSuccessResponse<WorkflowResponse>> {
    const result = await this.createWorkflowService.execute(body, context)

    return unwrapApiResult(result)
  }
}
```

Decorators do not replace runtime schema validation where external input is involved.

---

## React TypeScript Standards

React components use explicit props.

```tsx
export interface WorkflowStatusBadgeProps {
  readonly status: WorkflowRunStatus
  readonly label?: string
}

export function WorkflowStatusBadge(
  props: WorkflowStatusBadgeProps,
): React.ReactElement {
  const label = props.label ?? getWorkflowStatusLabel(props.status)

  return <span data-status={props.status}>{label}</span>
}
```

Do not use `React.FC` by default.

Explicit component signatures are clearer.

---

## React Children

Use `React.ReactNode` for ordinary children.

```ts
export interface PanelProps {
  readonly children: React.ReactNode
}
```

Use narrower types when the component requires a specific child structure.

---

## React Events

Use React event types.

```tsx
function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
  event.preventDefault()
}
```

Avoid `any` for event handlers.

---

## React Refs

Use explicit element types.

```ts
const inputRef = useRef<HTMLInputElement>(null)
```

Handle nullability.

```ts
inputRef.current?.focus()
```

Avoid:

```ts
inputRef.current!.focus()
```

---

## React State

Give state an explicit type when inference would be too narrow or ambiguous.

```ts
const [status, setStatus] = useState<WorkflowRunStatus>('pending')
```

For nullable state:

```ts
const [selectedWorkflow, setSelectedWorkflow] =
  useState<WorkflowSummary | null>(null)
```

---

## React Reducers

Use discriminated unions for reducer actions.

```ts
type ApprovalAction =
  | {
      readonly type: 'approve-started'
    }
  | {
      readonly type: 'approve-succeeded'
      readonly approvalId: ApprovalId
    }
  | {
      readonly type: 'approve-failed'
      readonly error: AerealithError
    }
```

Reducers should be exhaustive.

---

## React Query Keys

Query keys should remain readonly and structured.

```ts
export const workflowQueryKeys = {
  all: ['workflows'] as const,
  detail: (workflowId: WorkflowId) => ['workflows', workflowId] as const,
}
```

Avoid ad hoc string concatenation.

---

## Forms

Form values should use dedicated input types.

Do not reuse complete domain entities as editable form state.

```ts
export interface WorkflowFormValues {
  readonly name: string
  readonly description: string
}
```

Server validation remains authoritative.

---

## Drizzle Standards

Drizzle row types remain inside:

```text
libs/db
```

Infer row types near schema definitions.

```ts
export type WorkflowRunRow = typeof workflowRuns.$inferSelect

export type NewWorkflowRunRow = typeof workflowRuns.$inferInsert
```

Do not export these types to:

```text
API
core
frontend
modules
workflows
AI
```

Map them into domain entities.

---

## Database Mappers

Mappers should be explicit.

```ts
export function mapWorkflowRunRow(row: WorkflowRunRow): WorkflowRun {
  return {
    id: createWorkflowRunId(row.id),
    workflowId: createWorkflowId(row.workflowId),
    status: mapWorkflowRunStatus(row.status),
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  }
}
```

Mapping validates persistence assumptions.

---

## Database JSON

JSON columns are untrusted when read.

Validate them with a runtime schema.

```ts
const metadataResult = WorkflowRunMetadataSchema.safeParse(row.metadata)

if (!metadataResult.success) {
  return err(createStoredWorkflowMetadataInvalidError())
}
```

A TypeScript cast does not validate database JSON.

---

## Database Transactions

Transaction types remain inside the persistence layer.

Do not expose Drizzle transaction objects to application services unless an accepted unit-of-work abstraction requires it.

Application services should call repository operations through an explicit transaction boundary.

---

## Provider SDK Types

Provider SDK types must remain inside provider adapters.

Examples:

```text
Discord.js
GitHub SDK
Google SDK
Cloudinary SDK
Resend SDK
AI provider SDK
```

Map them before returning.

```ts
export function mapDiscordGuild(
  guild: Discord.Guild,
): CommunityProviderResource {
  return {
    provider: 'discord',
    resourceType: 'server',
    providerResourceId: guild.id,
    displayName: guild.name,
  }
}
```

---

## Provider Errors

Provider exceptions begin as `unknown`.

```ts
export function mapDiscordError(error: unknown): AerealithError {
  if (error instanceof DiscordAPIError) {
    return mapDiscordApiError(error)
  }

  if (error instanceof Error) {
    return createUnknownProviderError(error.message)
  }

  return createUnknownProviderError(
    'The Discord provider returned an unknown error.',
  )
}
```

Public errors must not expose raw provider objects.

---

## Event Contracts

Events use versioned typed payloads.

```ts
export interface EventEnvelope<TPayload> {
  readonly eventId: EventId
  readonly eventType: string
  readonly eventVersion: number
  readonly occurredAt: string
  readonly requestId?: RequestId
  readonly traceId?: TraceId
  readonly payload: TPayload
}
```

Every event type should have a runtime schema.

---

## Event Registries

A typed registry may map event types to payloads.

```ts
export interface AerealithEventMap {
  'module.enabled': ModuleEnabledEventPayload
  'workflow.run.failed': WorkflowRunFailedEventPayload
  'integration.disconnected': IntegrationDisconnectedEventPayload
}

export type AerealithEventType = keyof AerealithEventMap
```

Typed registries improve producer and consumer consistency.

---

## Event Versioning

Event version belongs in the runtime contract.

Do not encode version only in the TypeScript filename.

```ts
interface ModuleEnabledEventV1 {
  readonly eventType: 'module.enabled'
  readonly eventVersion: 1
  readonly payload: ModuleEnabledPayloadV1
}
```

Consumers must reject unsupported versions safely.

---

## Workflow Types

Persisted workflow definitions should remain data.

```ts
export interface WorkflowActionDefinition {
  readonly actionId: string
  readonly actionVersion: number
  readonly input: Readonly<Record<string, unknown>>
}
```

Do not persist:

```text
functions
class instances
provider SDK objects
AbortSignal
database transactions
```

---

## Module Types

Module manifests should be immutable typed data.

```ts
export interface ModuleManifest {
  readonly id: ModuleId
  readonly version: string
  readonly name: string
  readonly permissions: readonly Permission[]
  readonly capabilities: readonly ModuleCapabilityDefinition[]
}
```

Module implementations receive declared capabilities through typed interfaces.

---

## AI Output Types

AI output begins as `unknown`.

```ts
const parsed = AIActionProposalSchema.safeParse(providerResponse.output)

if (!parsed.success) {
  return err(createAIOutputSchemaInvalidError())
}
```

Do not trust:

```text
tool name
target ID
permission
risk level
approval claim
provider status
```

because a model included it in typed-looking JSON.

---

## AI Capability Types

AI capabilities should use stable identifiers and explicit contracts.

```ts
export interface AICapabilityDefinition<TInput, TOutput> {
  readonly id: string
  readonly inputSchema: z.ZodType<TInput>
  readonly outputSchema: z.ZodType<TOutput>
  readonly allowedTools: readonly string[]
  readonly riskLevel: RiskLevel
}
```

Avoid unrestricted generic agent interfaces.

---

## Configuration Types

Environment input begins as:

```ts
NodeJS.ProcessEnv
```

Treat values as untrusted strings.

```ts
export const ApiEnvironmentSchema = z.object({
  AEREALITH_ENVIRONMENT: z.enum([
    'local',
    'test',
    'preview',
    'staging',
    'production',
  ]),
  AEREALITH_DATABASE_URL: z.string().min(1),
  AEREALITH_AI_ENABLED: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true'),
})
```

Application code receives the validated output.

---

## Direct Environment Access

Only configuration-loading modules may access:

```ts
process.env
```

Feature code receives typed configuration through dependency injection.

ESLint should prohibit scattered direct access.

---

## Secret Types

Secret values should use narrow wrappers where useful.

```ts
export interface SecretValue {
  readonly reveal: () => string
  readonly redacted: '[REDACTED]'
}
```

Secret wrappers do not replace:

```text
secret storage
redaction
access control
rotation
```

They reduce accidental logging and string interpolation.

---

## Logging Types

Structured logs should use a safe field model.

```ts
export type LogFieldValue = string | number | boolean | null | readonly string[]

export type LogFields = Readonly<Record<string, LogFieldValue>>
```

Do not accept arbitrary nested objects in ordinary logging APIs.

---

## Telemetry Attributes

OpenTelemetry attributes should use supported primitive values.

```ts
export type TelemetryAttributeValue =
  | string
  | number
  | boolean
  | readonly string[]
  | readonly number[]
  | readonly boolean[]
```

Do not use private content or unbounded IDs as metric attributes.

---

## Testing Types

Tests use the same strictness as production code.

Do not relax TypeScript rules in tests globally.

Test utilities may use controlled helpers for:

```text
partial factories
fakes
fixtures
mock functions
```

---

## Test Factories

Factories should accept explicit partial overrides.

```ts
export function createIntegrationConnection(
  overrides: Partial<IntegrationConnection> = {},
): IntegrationConnection {
  return {
    id: createIntegrationConnectionId('int_test'),
    provider: 'discord',
    status: 'active',
    connectedAt: '2026-07-13T12:00:00.000Z',
    ...overrides,
  }
}
```

Do not use `Partial` as a production update contract merely because it is useful in tests.

---

## Mock Types

Prefer typed fakes implementing real interfaces.

```ts
export class FakeApprovalService implements ApprovalService {
  public async verify(
    input: VerifyApprovalInput,
  ): Promise<Result<VerifiedApproval, AerealithError>> {
    // ...
  }
}
```

Avoid broad cast-heavy mocks.

```ts
const service = {
  verify: vi.fn(),
} as unknown as ApprovalService
```

---

## Vitest Mocks

Use typed mock functions.

```ts
const publish = vi.fn<EventPublisher['publish']>()
```

Reset mocks between tests.

Tests should not rely on stale call history.

---

## Fixed Time

Inject a clock.

```ts
export interface Clock {
  now(): Date
}
```

Production:

```ts
export class SystemClock implements Clock {
  public now(): Date {
    return new Date()
  }
}
```

Tests:

```ts
export class FixedClock implements Clock {
  public constructor(private readonly value: Date) {}

  public now(): Date {
    return new Date(this.value)
  }
}
```

---

## ID Generators

Inject ID generators where deterministic tests or idempotency require control.

```ts
export interface IdGenerator<TId> {
  create(): TId
}
```

Avoid mocking global randomness.

---

## Generated Code

Generated TypeScript must be clearly identified.

```ts
// Generated file. Do not edit manually.
// Source: tools/contracts/generate-api-contracts.ts
```

Generated code should:

```text
pass formatting
pass lint where applicable
pass type checking
use stable deterministic output
avoid absolute machine paths
```

---

## Declaration Augmentation

Declaration augmentation should remain rare and isolated.

Appropriate examples:

```text
Hono context variables
framework environment bindings
third-party SDK corrections
```

Example:

```ts
declare module 'hono' {
  interface ContextVariableMap {
    requestContext: RequestContext
  }
}
```

Augmentations should live in dedicated files and include tests where behavior matters.

---

## Global Declarations

Avoid global declarations.

Do not add values to:

```text
globalThis
Window
NodeJS.ProcessEnv
```

without a clear runtime requirement.

Configuration should be validated rather than globally typed as guaranteed.

Typing an environment variable does not prove it exists.

---

## Ambient Environment Types

Avoid declarations like:

```ts
declare namespace NodeJS {
  interface ProcessEnv {
    AEREALITH_DATABASE_URL: string
  }
}
```

This creates false confidence.

Use runtime validation.

---

## JSON Imports

JSON imports are allowed when:

```text
the file is static
the shape is known
the runtime supports it
the imported value is validated where needed
```

Do not treat imported JSON as trusted merely because TypeScript inferred a structure.

---

## Dynamic Imports

Use dynamic imports for:

```text
code splitting
optional provider adapters
runtime-specific modules
large development-only tools
```

Example:

```ts
const adapterModule = await import('./providers/discord.adapter.js')
```

Dynamic imports must not bypass the module registry or capability allowlist.

---

## Lazy Provider Loading

Optional providers may be loaded lazily.

The loader should return an Aerealith-owned interface.

```ts
export async function loadProviderAdapter(
  provider: SupportedProvider,
): Promise<IntegrationProviderAdapter> {
  switch (provider) {
    case 'discord':
      return createDiscordProviderAdapter(await import('./discord/index.js'))
    case 'github':
      return createGitHubProviderAdapter(await import('./github/index.js'))
    case 'google':
      return createGoogleProviderAdapter(await import('./google/index.js'))
    default:
      return assertNever(provider)
  }
}
```

---

## Circular Types

Type-only circular references may still indicate architecture problems.

Avoid cycles between:

```text
core
contracts
db
applications
provider adapters
```

Resolve cycles by:

```text
moving shared primitives inward
splitting interfaces
using dependency inversion
narrowing contract ownership
```

---

## Compiler Performance

Type-level design affects compiler performance.

Avoid:

```text
deep recursive conditional types
huge unions generated repeatedly
very large inferred object literals
unbounded mapped-type recursion
giant root barrel files
```

Measure type-check time when introducing advanced type utilities.

A theoretically elegant type that makes the workspace painfully slow is not elegant.

---

## Type Error Quality

Prefer types that produce understandable errors.

Explicit domain types are often better than highly generic abstractions.

Reviewers should consider:

```text
Can a contributor understand the error?
Can the invalid state be fixed without decoding a type puzzle?
Does the type represent domain meaning?
```

---

## Library API Stability

Public library types become internal compatibility contracts.

Changes to exported types require review when they affect:

```text
applications
modules
provider adapters
events
API contracts
generated declarations
third-party developer APIs
```

Prefer additive changes where possible.

---

## Breaking Type Changes

Breaking changes include:

```text
removing exported property
changing required to optional
changing optional to required
changing union values
renaming error codes
changing event payload
changing capability identifier
```

A compile-time-only change may still create a runtime compatibility problem.

---

## Semantic Versioning

Buildable or externally consumed packages should follow semantic versioning.

Type-level breaking changes require a major version when the package is independently versioned.

Internal workspace libraries may version with the platform release while still documenting breaking changes.

---

## Deprecated Types

Use JSDoc deprecation.

```ts
/**
 * @deprecated Use `IntegrationConnectionStatus` instead.
 */
export type ProviderConnectionState = IntegrationConnectionStatus
```

A deprecated type should include:

```text
replacement
reason
removal plan
```

---

## Type Documentation

Document non-obvious public types.

```ts
/**
 * Fingerprint of the exact action, target, scope, and validated input
 * approved by a human approver.
 */
export type ApprovalFingerprint = string & {
  readonly __brand: 'ApprovalFingerprint'
}
```

Do not document obvious properties with repetitive comments.

---

## ESLint TypeScript Rules

Recommended rules include:

```text
no-explicit-any
no-floating-promises
no-misused-promises
consistent-type-imports
consistent-type-exports
no-unnecessary-type-assertion
no-non-null-assertion
switch-exhaustiveness-check
no-unnecessary-condition
require-await
prefer-readonly
```

Rules should be tuned carefully to avoid meaningless noise.

---

## Restricted Syntax

Potentially restricted syntax includes:

```text
TypeScript enum
namespace
non-null assertion
double assertion
direct process.env access
CommonJS require
module.exports
```

Generated code and framework boundaries may receive narrow exceptions.

---

## Import Restrictions

ESLint and Nx should restrict:

```text
frontend importing libs/db
core importing provider SDKs
contracts importing application implementations
modules importing raw Discord clients
workflows importing provider SDKs
AI importing credential stores
```

Type-only imports do not automatically make an architecture violation acceptable.

---

## Type Checking Commands

Recommended commands:

```bash
pnpm typecheck
pnpm nx affected -t typecheck
pnpm nx typecheck <project>
```

The type-check command should use project-specific configuration.

It should not emit JavaScript.

---

## Build Commands

Recommended commands:

```bash
pnpm build
pnpm nx build <project>
pnpm nx affected -t build
```

Build and type checking remain separate concerns where the runtime build tool does not perform full TypeScript validation.

---

## CI Requirements

Continuous integration should run:

```text
workspace type checking
affected project type checking
declaration generation
public contract validation
build
tests
lint
```

Type-check failure is a release blocker.

Do not allow:

```text
transpile-only production builds
ignored declaration errors
unchecked generated contracts
```

---

## Type Coverage Direction

Aerealith may later use type-coverage tooling to measure:

```text
explicit any
implicit any
untyped external boundaries
unsafe assertions
```

Type coverage does not replace code review.

The initial standard relies on strict compiler and ESLint enforcement.

---

## Security-Critical Type Rules

Security-sensitive code should use narrow types for:

```text
permissions
risk levels
approval states
scope
actor
provider capability
credential references
action fingerprints
```

Avoid ordinary strings where mixing values could create authorization mistakes.

Example:

```ts
export type Permission =
  | 'module.enable'
  | 'module.disable'
  | 'integration.disconnect'
  | 'workflow.execute'
  | 'moderation.timeout'
```

---

## Permission Types

Permission registries should be typed.

```ts
export const Permissions = {
  ModuleEnable: 'module.enable',
  ModuleDisable: 'module.disable',
  IntegrationDisconnect: 'integration.disconnect',
  WorkflowExecute: 'workflow.execute',
} as const

export type Permission = (typeof Permissions)[keyof typeof Permissions]
```

Unknown permissions must fail runtime validation.

---

## Scope Types

Authorization scope should use a discriminated union.

```ts
export type AuthorizationScope =
  | {
      readonly type: 'user'
      readonly userId: UserId
    }
  | {
      readonly type: 'account'
      readonly accountId: AccountId
    }
  | {
      readonly type: 'organization'
      readonly organizationId: OrganizationId
    }
  | {
      readonly type: 'community'
      readonly communityId: CommunityId
    }
```

Avoid generic structures with unrelated optional IDs.

---

## Approval Types

Approval state should remain explicit.

```ts
export type ApprovalStatus =
  'pending' | 'approved' | 'rejected' | 'expired' | 'revoked' | 'consumed'
```

A boolean such as:

```ts
approved: boolean
```

cannot represent the full lifecycle.

---

## Credential Types

Credentials should never use the same type as public identifiers.

```ts
export interface ProviderCredentialReference {
  readonly connectionId: IntegrationConnectionId
  readonly secretReference: SecretReference
}
```

Raw secret values should remain in the credential boundary.

---

## Hash and Fingerprint Types

Use distinct branded types.

```ts
export type ActionFingerprint = string & {
  readonly __brand: 'ActionFingerprint'
}

export type ContentHash = string & {
  readonly __brand: 'ContentHash'
}
```

This prevents accidentally using a content hash as an approval fingerprint.

---

## Serialization

Only serialize plain data.

Do not serialize:

```text
class instances
Error objects
Map
Set
Date
BigInt
AbortSignal
provider SDK objects
database transaction objects
```

Map them into explicit serializable contracts.

---

## Serializable Types

A shared JSON type may be used.

```ts
export type JsonPrimitive = string | number | boolean | null

export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | {
      readonly [key: string]: JsonValue
    }
```

Do not use `JsonValue` as a substitute for a real contract where the structure is known.

---

## Structured Clone

Cloudflare Workers and browser contexts may require structured-clone-compatible values.

Queue payloads and durable state should remain:

```text
plain
bounded
versioned
serializable
```

---

## Error Serialization

Map errors explicitly.

```ts
export function toErrorResponse(error: AerealithError): ApiErrorResponse {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      category: error.category,
      retryable: error.retryable,
      requestId: error.requestId,
      traceId: error.traceId,
      details: error.details ?? null,
    },
  }
}
```

Do not serialize an `Error` object directly.

---

## Configuration Validation Example

```ts
const EnvironmentSchema = z.enum([
  'local',
  'test',
  'preview',
  'staging',
  'production',
])

const ApiConfigSchema = z.object({
  environment: EnvironmentSchema,
  databaseUrl: z.string().url(),
  databaseDialect: z.enum(['postgresql', 'cockroachdb']),
  aiEnabled: z.boolean(),
  logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']),
})

export type ApiConfig = z.infer<typeof ApiConfigSchema>

export function loadApiConfig(environment: NodeJS.ProcessEnv): ApiConfig {
  return ApiConfigSchema.parse({
    environment: environment.AEREALITH_ENVIRONMENT,
    databaseUrl: environment.AEREALITH_DATABASE_URL,
    databaseDialect: environment.AEREALITH_DATABASE_DIALECT,
    aiEnabled: environment.AEREALITH_AI_ENABLED === 'true',
    logLevel: environment.AEREALITH_LOG_LEVEL ?? 'info',
  })
}
```

Startup should fail clearly when configuration is invalid.

---

## Service Example

```ts
export class DisableModuleService {
  public constructor(
    private readonly moduleRepository: ModuleRepository,
    private readonly authorizationService: AuthorizationService,
    private readonly approvalService: ApprovalService,
    private readonly eventPublisher: EventPublisher,
    private readonly clock: Clock,
  ) {}

  public async execute(
    input: DisableModuleInput,
    context: RequestContext,
  ): Promise<Result<ModuleInstallation, AerealithError>> {
    const installationResult = await this.moduleRepository.findInstallationById(
      input.installationId,
    )

    if (!installationResult.ok) {
      return installationResult
    }

    const installation = installationResult.value

    if (!installation) {
      return err(
        createError({
          code: 'MODULE_INSTALLATION_NOT_FOUND',
          message: 'The module installation could not be found.',
          category: 'module',
          retryable: false,
          requestId: context.requestId,
          traceId: context.traceId,
        }),
      )
    }

    const authorization = await this.authorizationService.authorize({
      actor: context.actor,
      permission: 'module.disable',
      scope: installation.scope,
    })

    if (!authorization.ok) {
      return authorization
    }

    const approval = await this.approvalService.verify({
      approvalId: input.approvalId,
      action: 'module.disable',
      actor: context.actor,
      target: {
        type: 'module-installation',
        id: installation.id,
      },
      scope: installation.scope,
      fingerprint: createDisableModuleFingerprint(input),
    })

    if (!approval.ok) {
      return approval
    }

    const disabledInstallation: ModuleInstallation = {
      ...installation,
      status: 'disabled',
      disabledAt: this.clock.now().toISOString(),
    }

    const persistenceResult =
      await this.moduleRepository.updateInstallation(disabledInstallation)

    if (!persistenceResult.ok) {
      return persistenceResult
    }

    const publicationResult = await this.eventPublisher.publish({
      eventId: createEventId(),
      eventType: 'module.disabled',
      eventVersion: 1,
      occurredAt: this.clock.now().toISOString(),
      actor: context.actor,
      target: {
        type: 'module-installation',
        id: installation.id,
      },
      scope: installation.scope,
      approvalId: input.approvalId,
      requestId: context.requestId,
      traceId: context.traceId,
      outcome: 'succeeded',
      payload: {
        moduleId: installation.moduleId,
        moduleVersion: installation.version,
      },
    })

    if (!publicationResult.ok) {
      return publicationResult
    }

    return ok(persistenceResult.value)
  }
}
```

This example demonstrates:

```text
explicit dependency injection
typed input
typed context
structured results
early returns
server-side authorization
approval verification
immutable state transition
event versioning
request and trace correlation
```

---

## TypeScript Anti-Patterns

Avoid:

```text
any
implicit any
double assertions
non-null assertions
unvalidated external input
ambient environment guarantees
TypeScript enums by default
provider SDK types in contracts
Drizzle rows outside libs/db
framework request objects in domain code
optional fields representing incompatible states
Partial<Entity> update contracts
unbounded Record<string, any>
untyped context storage
floating promises
mixed expected errors and thrown exceptions
serialization of class instances
giant generic utility types
deep barrel chains
cross-project private imports
CommonJS inside ESM projects
```

---

## Migration Standards

When converting JavaScript or weakly typed TypeScript:

```text
enable strictness incrementally by project
replace any with unknown
add boundary schemas
add explicit public return types
isolate provider SDK types
map database rows
add discriminated unions
remove unsafe assertions
add direct tests
```

Do not hide migration debt with:

```text
ts-ignore
ts-nocheck
broad ESLint disable
skipLibCheck everywhere
```

---

## `@ts-ignore`

`@ts-ignore` is prohibited by default.

Use `@ts-expect-error` only when:

```text
the error is intentional
the reason is documented
the behavior is tested
```

Example:

```ts
// @ts-expect-error Testing rejection of an invalid provider status.
mapProviderStatus('not-a-real-status')
```

The compiler will fail when the expected error disappears.

---

## `@ts-nocheck`

`@ts-nocheck` is prohibited in handwritten source code.

It may appear only in:

```text
generated code
vendored compatibility code
temporary migration files with a tracked removal issue
```

---

## ESLint Disable Comments

Disable comments must be narrow.

Good:

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Upstream callback is untyped; validated below.
const providerPayload: any = callbackValue
```

Avoid file-wide disabling unless the file is generated or an approved compatibility boundary.

---

## Testing Requirements

TypeScript-specific tests should verify:

```text
runtime schemas match expected contracts
provider mappings reject unknown values
database mappers reject invalid JSON
event versions remain explicit
discriminated unions remain exhaustive
generated declarations contain no private types
```

Compile-time tests may be used for important type contracts.

---

## Compile-Time Tests

Compile-time testing tools may verify:

```text
invalid identifier mixing
invalid permission values
invalid event payload mapping
invalid module manifest shape
invalid provider capability registration
```

Example direction:

```ts
expectTypeOf<UserId>().not.toEqualTypeOf<AccountId>()
```

Compile-time tests supplement runtime tests.

They do not replace them.

---

## Contract Drift Tests

The repository should detect drift between:

```text
runtime schema
TypeScript type
OpenAPI schema
event schema
generated client
```

Where possible, generate downstream contracts from one validated source.

Avoid maintaining several manually duplicated definitions.

---

## Type Declaration Tests

Buildable libraries should be tested by consuming their emitted declarations from a clean fixture project.

This catches:

```text
private type leakage
missing exports
incorrect package exports
module-resolution problems
NodeNext extension problems
```

---

## Tooling Files

Recommended TypeScript tooling structure:

```text
tsconfig.base.json
tsconfig.node.json
tsconfig.worker.json
tsconfig.browser.json
tsconfig.test.json
tools/typescript/
├── validate-project-references.mjs
├── validate-public-exports.mjs
├── validate-declarations.mjs
└── compile-fixtures/
```

---

## Implementation Sequence

Recommended implementation order:

```text
1. Pin the TypeScript version.
2. Set the repository to ESM.
3. Create the strict base configuration.
4. Create Node.js, Worker, browser, and test configurations.
5. Enable Nx project references where practical.
6. Add dedicated type-check targets.
7. Enable declaration generation for shared libraries.
8. Add consistent type-only imports.
9. Enforce no-explicit-any.
10. Enforce no-floating-promises.
11. Enforce exhaustive switches.
12. Add restricted process.env access.
13. Add provider SDK import restrictions.
14. Add database row import restrictions.
15. Introduce shared Result and error types.
16. Introduce branded security-sensitive identifiers.
17. Add runtime schema conventions.
18. Add declaration-consumer tests.
19. Add contract drift checks.
20. Remove unsafe assertions incrementally.
21. Validate Node.js, Worker, frontend, and test builds.
```

---

## Required Decisions

Before this standard is considered stable, Aerealith must finalize:

```text
exact TypeScript version
ES2024 target support
NodeNext import-extension policy
skipLibCheck policy
project-reference scope
declaration-emission scope
branded-ID implementation
Result implementation
error contract
runtime schema library
type-test tooling
React component return-type convention
exact ESLint TypeScript rules
package export-map conventions
```

---

## Relationship to Code Style

This document defines TypeScript-specific rules.

General naming, formatting, comments, imports, security, testing, and review behavior remain governed by:

```text
docs/engineering/Code Style.md
```

Where the documents overlap, the more specific TypeScript rule applies.

---

## Relationship to Testing

Tests use the same strict TypeScript configuration as production code.

Provider fakes, test factories, clocks, IDs, and queue harnesses should implement real typed interfaces.

Unsafe test casts must not become a back door around production architecture.

---

## Relationship to Monorepo Architecture

Nx project boundaries define which TypeScript imports are permitted.

TypeScript path aliases must not be used to bypass project ownership.

Public package entry points should remain intentional and declaration-safe.

---

## Relationship to API Architecture

API contracts use runtime schemas and inferred TypeScript types.

Transport types remain at the API boundary.

Application and domain services use Aerealith-owned request context and result types.

---

## Relationship to Data Architecture

Drizzle row types remain inside `libs/db`.

Database JSON is runtime-validated.

Repositories map persistence types into domain entities.

PostgreSQL and CockroachDB differences remain isolated in the data layer.

---

## Relationship to Auth Architecture

Security-sensitive identifiers, permissions, scopes, sessions, and approval states should use narrow explicit types.

TypeScript improves correctness.

Runtime authorization remains authoritative.

---

## Relationship to Integration Architecture

Provider SDK types remain inside adapters.

Provider responses are validated and normalized before entering shared contracts.

Credentials use protected references rather than ordinary public strings.

---

## Relationship to Workflow Architecture

Workflow definitions remain serializable data.

Workflow states use discriminated unions.

Actions, triggers, and events use stable typed identifiers and explicit versions.

---

## Relationship to AI Architecture

AI output is `unknown` until runtime validation succeeds.

Typed model output does not create:

```text
permission
approval
authority
provider truth
platform state
```

AI capabilities use explicit input, output, context, and tool contracts.

---

## Relationship to Security Architecture

TypeScript reduces accidental misuse.

It does not replace:

```text
runtime validation
authentication
authorization
encryption
approval
secret management
provider permission checks
```

Security-critical types should make invalid combinations difficult to express.

---

## Success Criteria

The TypeScript standard is successful when:

```text
strict mode is enabled everywhere
the repository uses one TypeScript version
Node.js projects use ESM
runtime targets use appropriate module resolution
external input begins as unknown
public input is schema-validated
any is rare and documented
non-null assertions are rare
double assertions are absent
public functions have explicit return types
state is modeled with discriminated unions
switches are exhaustive
provider SDK types remain isolated
database rows remain inside libs/db
environment access is centralized
expected failures use Result
errors use stable contracts
floating promises are rejected
shared libraries emit clean declarations
project references support incremental builds
tests use the same strictness as production
generated code is validated
Node.js, Cloudflare Workers, and browser builds remain compatible
```

---

## Final Standard

Aerealith TypeScript should make trusted state explicit, invalid state difficult to represent, external data impossible to trust accidentally, and architectural boundaries visible in every import and public contract.

The standard is:

> Every Aerealith TypeScript project uses strict compiler settings, explicit runtime ownership, ECMAScript modules, validated external input, narrow public contracts, discriminated state, readonly boundaries, structured results, exhaustive handling, safe asynchronous behavior, provider and persistence isolation, declaration-safe exports, and architecture-enforced imports. Type assertions, `any`, ambient guarantees, and compiler suppressions are exceptions that require proof—not conveniences used to avoid modeling the system correctly.
