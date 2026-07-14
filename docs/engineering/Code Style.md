# Code Style

Status: Draft
Owner: Tim Pierce / SinLess Games
Last Updated: 2026-07-13
Security Classification: Internal Engineering
Primary Language: TypeScript
Primary Runtime: Node.js 24.x
Primary Package Manager: pnpm
Primary Build System: Nx

Related Engineering Documentation:

- `docs/engineering/Local Development.md`
- `docs/engineering/Testing.md`
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
- `docs/rfcs/0010-api-envelope-request-and-trace-id-propagation.md`
- `docs/rfcs/0011-event-envelope-audit-model-and-idempotency.md`

---

## Purpose

This document defines the code-style standards for Aerealith AI.

It governs how contributors write, organize, name, format, validate, test, document, review, and maintain source code throughout the Aerealith monorepo.

The code-style standard covers:

```text
TypeScript
JavaScript
React
Next.js
Vite
Hono
NestJS
Drizzle
SQL migrations
configuration
tests
scripts
Dockerfiles
shell scripts
Markdown
JSON
YAML
imports
naming
errors
results
logging
security
documentation
```

The objective is to make Aerealith code:

```text
readable
predictable
secure
testable
maintainable
portable
reviewable
observable
easy to refactor
difficult to misuse
```

The guiding rule is:

> Code should communicate its purpose clearly, preserve architectural boundaries, make unsafe behavior difficult, and remain understandable to someone who did not write it.

Formatting is automated.

Style discussions should focus on correctness, clarity, maintainability, security, and architecture rather than personal preference.

---

## Core Principles

Aerealith code follows these principles:

```text
Clarity is more important than cleverness.
Correct architecture is part of code style.
Public contracts are explicit.
Runtime input is validated.
Errors are structured.
Secrets never enter logs.
Authorization is enforced server-side.
Side effects are visible.
Dependencies point inward.
Functions should do one understandable thing.
Names should explain purpose.
Comments should explain why.
Tests should describe behavior.
Generated code should be identifiable.
Framework conventions should be respected.
Production behavior must not depend on local shortcuts.
```

---

## Automated Enforcement

Code style is enforced through:

```text
Prettier
ESLint
TypeScript strict mode
Nx project-boundary rules
Vitest
Playwright
Semgrep
Snyk
SonarLint and SonarQube where configured
Codecov
Meticulous AI
Gitleaks
Trivy
```

Automated tools are responsible for:

```text
formatting
basic syntax consistency
import ordering
unused code
type safety
dependency boundaries
common security defects
test coverage
```

Human review is responsible for:

```text
architecture
correctness
security assumptions
domain behavior
maintainability
data ownership
permission boundaries
risk
approval behavior
privacy
```

Passing automation does not prove that code is correct.

---

## Formatting Standard

Aerealith uses Prettier as the authoritative formatter.

Recommended Prettier configuration:

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

Formatting rules:

```text
Use two spaces.
Do not use tabs.
Do not use semicolons unless required by syntax.
Use single quotes in JavaScript and TypeScript.
Use double quotes in JSON.
Use trailing commas where supported.
Use LF line endings.
Allow Prettier to wrap long expressions.
Do not manually align columns with spaces.
```

Formatting command:

```bash
pnpm format
```

Formatting validation:

```bash
pnpm format:check
```

---

## Editor Configuration

The repository should include:

```text
.editorconfig
.vscode/settings.json
.vscode/extensions.json
```

Recommended `.editorconfig`:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
```

Editors should format on save where supported.

The repository formatter remains authoritative.

---

## TypeScript Standard

TypeScript is the primary application language.

All TypeScript projects should use strict compiler settings.

Recommended baseline:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true
  }
}
```

Exceptions require:

```text
documented reason
narrow scope
code review
follow-up issue when temporary
```

Do not disable strictness for an entire project to avoid fixing a localized type problem.

---

## Type Inference

Use type inference when the type is obvious.

Good:

```ts
const retryCount = 3;
const isEnabled = true;
const moduleIds = ['aerealith.discord-moderation'];
```

Avoid unnecessary annotation:

```ts
const retryCount: number = 3;
const isEnabled: boolean = true;
```

Require explicit types for:

```text
exported functions
public methods
public contracts
repository interfaces
service interfaces
provider adapters
event handlers
API handlers where useful
complex configuration objects
```

Example:

```ts
export function createRequestId(): string {
  return `req_${crypto.randomUUID()}`;
}
```

---

## Avoid `any`

Do not use `any` unless interacting with an unavoidable external boundary.

Prefer:

```text
unknown
generic parameters
discriminated unions
runtime validation
narrow interfaces
```

Bad:

```ts
export function parsePayload(payload: any) {
  return payload.user.id;
}
```

Good:

```ts
export function parsePayload(payload: unknown): Result<ProviderPayload, AerealithError> {
  const result = ProviderPayloadSchema.safeParse(payload);

  if (!result.success) {
    return err(
      createError({
        code: 'PROVIDER_PAYLOAD_INVALID',
        message: 'The provider payload was invalid.',
        category: 'integration',
        retryable: false,
      }),
    );
  }

  return ok(result.data);
}
```

An unavoidable `any` must include a reason:

```ts
// The upstream library exposes this callback as `any`.
// Validate the value before it crosses this adapter boundary.
```

---

## Avoid Unsafe Assertions

Avoid:

```text
as SomeType
as unknown as SomeType
!
```

Bad:

```ts
const user = payload as User;
const email = user.email!;
```

Good:

```ts
const result = UserSchema.safeParse(payload);

if (!result.success) {
  return err(createValidationError(result.error));
}

const email = result.data.email;
```

Type assertions are acceptable only when:

```text
the runtime invariant is already verified
the framework requires the assertion
the assertion remains narrow
the reason is documented
```

---

## Use `unknown` for External Input

External data starts as `unknown`.

This includes:

```text
HTTP request bodies
query parameters
environment variables
provider payloads
webhook payloads
database JSON
AI model output
queue messages
file contents
user configuration
```

External input must be validated before use.

---

## Runtime Validation

Aerealith uses runtime schemas for untrusted input.

Preferred validation library:

```text
Zod
```

Schema names use PascalCase followed by `Schema`.

```ts
export const EnableModuleRequestSchema = z.object({
  moduleId: z.string().trim().min(1),
  scopeType: z.enum(['account', 'organization', 'community']),
  scopeId: z.string().trim().min(1),
});

export type EnableModuleRequest = z.infer<typeof EnableModuleRequestSchema>;
```

Do not manually duplicate a TypeScript interface when it can be inferred safely from the schema.

---

## Schema Ownership

Schemas should live near the contract or boundary they validate.

Examples:

```text
libs/contracts/src/api/V1/modules/
apps/services/api/src/features/modules/transport/
apps/integrations/discord/src/events/
apps/services/api/src/config/
```

Do not place every schema in one global `schemas.ts` file.

---

## Validation Rules

Validation should include:

```text
shape
required fields
allowed values
length
format
range
maximum collection size
nested depth where needed
unknown-field behavior
```

Example:

```ts
export const CreateTicketRequestSchema = z
  .object({
    subject: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(10_000),
    categoryId: z.string().trim().min(1),
  })
  .strict();
```

Use `.strict()` at public boundaries unless forward compatibility requires unknown fields.

---

## Types and Interfaces

Use `interface` for:

```text
object-shaped public contracts
service interfaces
repository interfaces
provider adapter interfaces
objects intended for extension
```

Use `type` for:

```text
unions
intersections
aliases
mapped types
function signatures
discriminated unions
```

Example:

```ts
export interface WorkflowActionExecutor {
  execute(input: WorkflowActionInput, context: WorkflowExecutionContext): Promise<Result<WorkflowActionOutput, AerealithError>>;
}

export type WorkflowRunStatus = 'pending' | 'running' | 'waiting-for-approval' | 'succeeded' | 'failed' | 'cancelled';
```

---

## Interface Naming

Do not prefix interfaces with `I`.

Bad:

```ts
interface IUserRepository {}
interface IDiscordClient {}
```

Good:

```ts
interface UserRepository {}
interface DiscordClient {}
```

The name should describe the role, not the TypeScript construct.

---

## Enums

Prefer string unions or `as const` objects over TypeScript enums.

Preferred:

```ts
export const ModuleStatus = {
  Available: 'available',
  Enabled: 'enabled',
  Active: 'active',
  Degraded: 'degraded',
  Disabled: 'disabled',
  Revoked: 'revoked',
} as const;

export type ModuleStatus = (typeof ModuleStatus)[keyof typeof ModuleStatus];
```

Avoid:

```ts
enum ModuleStatus {
  Available,
  Enabled,
  Active,
}
```

An enum may be used when required by:

```text
generated code
provider SDK
framework
database tooling
```

Map provider enums into Aerealith-owned types at the boundary.

---

## Readonly by Default

Public contracts should prefer immutable data.

```ts
export interface ModuleManifest {
  readonly id: string;
  readonly version: string;
  readonly permissions: readonly string[];
}
```

Prefer:

```ts
readonly string[]
Readonly<Record<string, unknown>>
```

when callers should not mutate the data.

Do not spread `readonly` mechanically into internal mutable implementation state where it makes code harder to understand.

---

## Null and Undefined

Use `undefined` for values that are:

```text
optional
not provided
not yet resolved
```

Use `null` only when:

```text
the database represents an explicit empty value
an external API requires null
a public contract explicitly defines null
```

Avoid mixing `null` and `undefined` for the same concept.

Example:

```ts
export interface UserProfile {
  readonly displayName?: string;
  readonly deletedAt: string | null;
}
```

---

## Boolean Naming

Boolean names should communicate a yes-or-no question.

Preferred prefixes:

```text
is
has
can
should
was
did
supports
requires
allows
```

Good:

```ts
const isActive = module.status === 'active';
const hasPermission = permissions.includes(requiredPermission);
const requiresApproval = riskLevel === 'high';
```

Bad:

```ts
const active = true;
const permission = false;
const approval = true;
```

---

## Function Naming

Functions should begin with a verb.

Good:

```text
createModule
validateConfiguration
resolveRecipient
publishEvent
findAccountById
listAuditRecords
executeWorkflowAction
```

Avoid vague names:

```text
handle
process
doThing
manage
run
execute
```

Generic verbs may be used when the owning type provides sufficient context.

Example:

```ts
workflowCoordinator.execute(...)
notificationConsumer.process(...)
```

---

## Variable Naming

Use descriptive names.

Good:

```ts
const integrationConnection = await repository.findById(connectionId)
const missingProviderPermissions = resolveMissingPermissions(...)
```

Avoid abbreviations that require guessing:

```ts
const conn = ...
const perms = ...
const cfg = ...
const res = ...
```

Common, established abbreviations are acceptable:

```text
id
url
api
http
html
json
sql
jwt
oauth
mfa
ai
```

---

## Identifier Naming

Use consistent identifier suffixes.

Examples:

```text
userId
accountId
organizationId
communityId
serverId
connectionId
moduleInstallationId
workflowId
workflowRunId
requestId
traceId
approvalId
```

Do not use:

```text
userID
UserId
uid
userIdentifier
```

unless mapping a provider contract.

---

## Constants

Use `UPPER_SNAKE_CASE` only for true module-level constants.

```ts
const MAX_RETRY_ATTEMPTS = 5;
const DEFAULT_PAGE_SIZE = 50;
```

Use camelCase for ordinary immutable variables.

```ts
const retryPolicy = createRetryPolicy();
```

Do not capitalize every `const`.

---

## Class Naming

Classes use PascalCase.

Examples:

```text
ModuleRegistry
WorkflowCoordinator
DiscordRateLimitManager
AuditEventConsumer
```

Avoid suffixes such as:

```text
Manager
Helper
Utils
Service
```

unless they accurately describe the responsibility.

Prefer names describing behavior:

```text
ModuleManifestValidator
WorkflowStepExecutor
NotificationRecipientResolver
```

---

## File Naming

TypeScript and JavaScript filenames use kebab-case.

Examples:

```text
module-registry.ts
workflow-coordinator.ts
discord-rate-limit-manager.ts
notification-recipient-resolver.ts
```

Tests:

```text
module-registry.spec.ts
workflow-coordinator.spec.ts
```

React components may use either:

```text
module-health-card.tsx
```

or PascalCase only where the framework generator requires it.

The repository should prefer kebab-case consistently.

---

## Suffix Conventions

Recommended suffixes:

| Responsibility      | Suffix                     |
| ------------------- | -------------------------- |
| Application service | `.service.ts`              |
| Repository          | `.repository.ts`           |
| Policy              | `.policy.ts`               |
| Adapter             | `.adapter.ts`              |
| Consumer            | `.consumer.ts`             |
| Coordinator         | `.coordinator.ts`          |
| Resolver            | `.resolver.ts`             |
| Mapper              | `.mapper.ts`               |
| Schema              | `.schema.ts`               |
| Contract            | `.contract.ts` when needed |
| Configuration       | `.config.ts`               |
| Factory             | `.factory.ts`              |
| Test                | `.spec.ts`                 |
| End-to-end test     | `.e2e-spec.ts`             |

Do not add suffixes mechanically if the filename is already clear.

---

## Directory Naming

Directories use kebab-case.

Good:

```text
provider-adapters
action-proposals
role-hierarchy
```

Avoid:

```text
ProviderAdapters
provider_adapters
providerAdapters
```

Framework-required directories are exceptions.

---

## Export Style

Use named exports by default.

Preferred:

```ts
export function createModuleRegistry(): ModuleRegistry {
  return new ModuleRegistry();
}
```

Avoid:

```ts
export default function createModuleRegistry() {}
```

Default exports are allowed where required or strongly conventional:

```text
Next.js pages
Next.js layouts
framework configuration files
lazy-loaded route components where needed
```

Named exports improve:

```text
refactoring
searchability
auto-import accuracy
consistency
```

---

## Barrel Files

Use `index.ts` only at intentional public boundaries.

Good:

```text
libs/contracts/src/modules/index.ts
libs/core/src/workflows/index.ts
```

Avoid deep barrel chains such as:

```text
feature/index.ts
feature/domain/index.ts
feature/domain/entities/index.ts
```

Large barrel graphs can create:

```text
circular dependencies
unclear ownership
slow builds
accidental public APIs
```

Internal files should import directly when appropriate.

---

## Import Ordering

Imports should be grouped in this order:

```text
Node.js built-ins
external packages
workspace libraries
same-project absolute imports
relative imports
type-only imports where configured
```

Example:

```ts
import { randomUUID } from 'node:crypto';

import { z } from 'zod';

import { createError, err, ok, type Result } from '@aerealith/core';
import type { ModuleManifest } from '@aerealith/contracts';

import { ModuleRepository } from '../persistence/module.repository';
```

Import sorting should be automated by ESLint or Prettier tooling.

---

## Type-Only Imports

Use `import type` for types.

```ts
import type { ModuleManifest } from '@aerealith/contracts';
import { ModuleRegistry } from './module-registry';
```

This makes runtime dependencies visible and supports isolated module compilation.

---

## Import Boundaries

Imports must respect Nx and architecture boundaries.

Examples:

```text
frontend may import contracts, UI, flags, and approved API clients
frontend may not import db
core may not import provider SDKs
contracts may not import application implementations
modules may not import another module's private implementation
workflows may not import raw provider clients
AI may not import unrestricted integration credentials
```

A valid TypeScript path does not mean an import is architecturally valid.

---

## Circular Dependencies

Circular dependencies are prohibited.

Do not fix a circular dependency with:

```text
dynamic require
late imports
global registries
duplicated types
```

Instead:

```text
move shared contracts inward
introduce an interface
invert the dependency
split responsibilities
```

---

## Function Size

Functions should remain small enough to understand without excessive scrolling.

There is no universal line limit.

A function should usually have one primary responsibility.

Extract behavior when a function contains several distinct phases:

```text
validation
authorization
data loading
domain decision
persistence
event publication
response mapping
```

Example:

```ts
export async function enableModule(input: EnableModuleInput, context: RequestContext): Promise<Result<ModuleInstallation, AerealithError>> {
  const authorization = await authorizeModuleEnablement(input, context);

  if (!authorization.ok) {
    return authorization;
  }

  const manifest = moduleRegistry.find(input.moduleId);

  if (!manifest) {
    return err(createModuleNotFoundError(input.moduleId));
  }

  const validation = await validateModuleEnablement(input, manifest);

  if (!validation.ok) {
    return validation;
  }

  return persistEnabledModule(input, manifest, context);
}
```

---

## Parameter Count

Prefer a single input object when a function requires several related parameters.

Avoid:

```ts
function createAuditRecord(eventId: string, actionId: string, actorId: string, targetId: string, scopeId: string, outcome: string) {}
```

Prefer:

```ts
interface CreateAuditRecordInput {
  readonly eventId: string;
  readonly actionId: string;
  readonly actor: AuditActor;
  readonly target: AuditResourceReference;
  readonly scope: AuditScope;
  readonly outcome: AuditOutcome;
}

function createAuditRecord(input: CreateAuditRecordInput): AuditRecord {}
```

A function with two or three obvious primitive arguments does not require an object automatically.

---

## Return Early

Prefer early returns to deeply nested conditions.

Bad:

```ts
if (connection) {
  if (connection.status === 'active') {
    if (hasPermission) {
      return executeAction();
    }
  }
}

return failure;
```

Good:

```ts
if (!connection) {
  return err(createConnectionNotFoundError());
}

if (connection.status !== 'active') {
  return err(createConnectionNotActiveError());
}

if (!hasPermission) {
  return err(createPermissionMissingError());
}

return executeAction();
```

---

## Conditionals

Prefer clear conditions over compressed expressions.

Avoid:

```ts
return user && user.active && perms.includes('admin') ? run() : deny();
```

Prefer:

```ts
if (!user?.isActive) {
  return denyInactiveUser();
}

if (!permissions.includes('admin')) {
  return denyMissingPermission();
}

return run();
```

---

## Complex Conditions

Name complex conditions.

Bad:

```ts
if (module.status === 'active' && connection.status === 'active' && permissions.includes('moderation.timeout') && providerPermissions.includes('ModerateMembers')) {
  // ...
}
```

Good:

```ts
const canExecuteTimeout = module.status === 'active' && connection.status === 'active' && permissions.includes('moderation.timeout') && providerPermissions.includes('ModerateMembers');

if (!canExecuteTimeout) {
  return err(createModerationUnavailableError());
}
```

For repeated logic, create a policy function.

---

## Switch Statements

Use exhaustive switches for discriminated unions.

```ts
export function getRunStatusLabel(status: WorkflowRunStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'running':
      return 'Running';
    case 'waiting-for-approval':
      return 'Waiting for approval';
    case 'succeeded':
      return 'Succeeded';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return assertNever(status);
  }
}
```

Helper:

```ts
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
```

Do not use a `default` branch that silently hides a missing case.

---

## Arrays and Collections

Prefer expressive array operations when they remain readable.

Good:

```ts
const activeModules = modules.filter((module) => module.status === 'active');
const moduleIds = activeModules.map((module) => module.id);
```

Use loops when they improve clarity, support early exit, or avoid unnecessary allocations.

```ts
for (const permission of requiredPermissions) {
  if (!grantedPermissions.has(permission)) {
    missingPermissions.push(permission);
  }
}
```

Do not force functional chains into unreadable one-liners.

---

## Maps and Sets

Use `Map` and `Set` when modeling:

```text
unique membership
keyed lookup
deduplication
rate-limit buckets
registry entries
```

Example:

```ts
const grantedPermissions = new Set(connection.permissions);
```

Do not repeatedly scan arrays when the code clearly represents a set.

---

## Objects

Prefer explicit object construction.

Good:

```ts
const record: AuditRecord = {
  id: createAuditId(),
  eventId: event.eventId,
  actionId: policy.actionId,
  category: policy.category,
  outcome: event.outcome,
  occurredAt: event.occurredAt,
  recordedAt: now.toISOString(),
};
```

Avoid uncontrolled spreading of untrusted objects.

Bad:

```ts
const record = {
  ...request.body,
  id: createAuditId(),
};
```

Object spreading can accidentally copy:

```text
secrets
unknown fields
private metadata
provider payloads
```

---

## Mutation

Prefer immutable transformations at public boundaries.

Local mutation is acceptable when it improves clarity and remains contained.

Good:

```ts
const missingPermissions: string[] = [];

for (const permission of requiredPermissions) {
  if (!grantedPermissions.has(permission)) {
    missingPermissions.push(permission);
  }
}
```

Avoid shared mutable module-level state unless the component explicitly owns it.

---

## Global State

Avoid global mutable state.

Exceptions may include carefully owned:

```text
application registries
provider connection pools
telemetry providers
immutable configuration
```

Global state must have:

```text
clear ownership
startup initialization
shutdown behavior
test reset behavior
concurrency safety
```

---

## Side Effects

Side effects should be explicit and occur through owned interfaces.

Examples:

```text
database write
provider call
event publication
notification delivery
file write
queue publication
cache mutation
```

Domain policies should remain pure where practical.

Bad:

```ts
export function validateModule(module: ModuleManifest): boolean {
  database.insert(module);
  return true;
}
```

Good:

```ts
export function validateModule(module: ModuleManifest): Result<ValidatedModuleManifest, AerealithError> {
  // Pure validation
}
```

Persistence occurs in the application layer after validation.

---

## Async Code

Use `async` and `await` for asynchronous control flow.

Good:

```ts
const connection = await connectionRepository.findById(connectionId);
```

Avoid unnecessary promise wrapping:

```ts
return new Promise((resolve) => {
  resolve(value);
});
```

Return the value or promise directly.

---

## Parallel Work

Use `Promise.all` only when operations are independent.

```ts
const [connection, moduleInstallation] = await Promise.all([connectionRepository.findById(connectionId), moduleRepository.findInstallation(moduleInstallationId)]);
```

Do not parallelize operations when:

```text
ordering matters
one result determines whether another operation is authorized
provider rate limits require coordination
a later operation should not run after an earlier failure
```

---

## Unhandled Promises

Do not intentionally discard a promise without marking the intent.

Bad:

```ts
publishEvent(event);
```

Acceptable:

```ts
void publishOperationalMetric(metric);
```

Use `void` only when:

```text
the operation is intentionally detached
errors are handled internally
failure semantics are documented
```

Most meaningful side effects should be awaited or queued.

---

## Promise Error Handling

Do not mix `await` and `.then()` chains without a clear reason.

Avoid:

```ts
await service.execute().then(handleSuccess).catch(handleFailure);
```

Prefer:

```ts
const result = await service.execute();

if (!result.ok) {
  return handleFailure(result.error);
}

return handleSuccess(result.value);
```

---

## Result Model

Expected failures should use the shared result model.

Conceptual form:

```ts
export type Result<TValue, TError> =
  | {
      readonly ok: true;
      readonly value: TValue;
    }
  | {
      readonly ok: false;
      readonly error: TError;
    };
```

Helpers:

```ts
return ok(value);
return err(error);
```

Use results for:

```text
validation failure
not found
authorization denial
provider rejection
configuration error
business-rule conflict
rate limits
expected infrastructure failure
```

---

## Exceptions

Exceptions are appropriate for:

```text
programmer defects
violated internal invariants
unrecoverable startup failure
framework-level interruption
```

Do not throw ordinary business errors from deep inside domain code when the caller is expected to handle them.

Avoid:

```ts
throw new Error('User not found');
```

Prefer:

```ts
return err(
  createError({
    code: 'USER_NOT_FOUND',
    message: 'The user could not be found.',
    category: 'identity',
    retryable: false,
  }),
);
```

---

## Catching Unknown Errors

Caught errors are `unknown`.

```ts
try {
  return await provider.execute(input);
} catch (error: unknown) {
  return err(mapProviderError(error));
}
```

Do not assume:

```ts
catch (error) {
  return error.message
}
```

Use safe error normalization.

---

## Aerealith Error Model

Errors should include:

```text
stable code
safe message
category
retryable
request ID when available
trace ID when available
safe details
cause internally where supported
```

Example:

```ts
export interface AerealithError {
  readonly code: string;
  readonly message: string;
  readonly category: string;
  readonly retryable: boolean;
  readonly requestId?: string;
  readonly traceId?: string;
  readonly details?: Readonly<Record<string, unknown>>;
}
```

Public error messages must not expose:

```text
credentials
stack traces
SQL
provider secrets
internal file paths
private payloads
```

---

## Error Codes

Error codes use uppercase snake case.

Examples:

```text
MODULE_NOT_FOUND
WORKFLOW_APPROVAL_REQUIRED
INTEGRATION_CONNECTION_REVOKED
DISCORD_ROLE_HIERARCHY_BLOCKED
AUDIT_EVENT_VERSION_UNSUPPORTED
```

Codes become compatibility-sensitive when exposed publicly.

Do not rename them casually.

---

## Error Messages

Error messages should be:

```text
plain language
specific
safe
actionable where possible
```

Good:

```text
The Discord bot cannot moderate this member because the member's highest role is above the bot's highest role.
```

Bad:

```text
Something went wrong.
```

Internal logs may include safe technical details under the same error code.

---

## Logging

Use structured logging.

Good:

```ts
logger.info('Module enabled', {
  moduleId: installation.moduleId,
  installationId: installation.id,
  scopeType: installation.scope.type,
  scopeId: installation.scope.id,
  requestId: context.requestId,
  traceId: context.traceId,
});
```

Avoid interpolated logs:

```ts
logger.info(`Module ${installation.moduleId} enabled for ${installation.scope.id}`);
```

Structured fields improve:

```text
search
filtering
alerts
dashboards
correlation
```

---

## Log Levels

Use levels consistently.

| Level   | Use                                                       |
| ------- | --------------------------------------------------------- |
| `trace` | Extremely detailed local diagnostics.                     |
| `debug` | Developer diagnostics not normally enabled in production. |
| `info`  | Normal meaningful operational behavior.                   |
| `warn`  | Recoverable issue or degraded behavior.                   |
| `error` | Failed operation requiring attention.                     |
| `fatal` | Process cannot safely continue.                           |

Do not log ordinary validation failures as `error`.

Do not log successful routine requests at `warn`.

---

## Log Messages

Log messages use sentence case without trailing punctuation.

Good:

```text
Discord gateway connected
Workflow action failed
Module configuration rejected
```

Avoid:

```text
DISCORD GATEWAY CONNECTED!!!
workflow_action_failed
Error happened.
```

---

## Secret Logging

Never log:

```text
passwords
session tokens
API keys
OAuth access tokens
OAuth refresh tokens
bot tokens
webhook secrets
authorization headers
cookies
private keys
recovery codes
database passwords
```

Redaction must exist at:

```text
logger
HTTP instrumentation
provider adapter
error mapping
observability exporter
```

---

## Private Data in Logs

Avoid logging:

```text
full Discord messages
ticket transcripts
email bodies
AI prompts
AI responses
uploaded documents
moderation evidence
```

Prefer identifiers:

```text
messageId
ticketId
conversationId
documentId
moderationCaseId
```

Log content only when a documented diagnostic or security need exists.

---

## Request and Trace Context

Request and trace context should be propagated explicitly.

```ts
export interface RequestContext {
  readonly requestId: string;
  readonly traceId?: string;
  readonly actor?: AuthenticatedActor;
  readonly scope?: AuthorizationScope;
}
```

Do not use hidden global request state when explicit context is practical.

---

## Comments

Comments should explain:

```text
why a decision exists
which invariant is protected
which provider behavior is unusual
which security concern applies
why a non-obvious workaround is required
```

Bad:

```ts
// Increment retry count
retryCount += 1;
```

Good:

```ts
// Discord may redeliver the same interaction after a gateway reconnect.
// Keep the receipt until the interaction token expires.
retryCount += 1;
```

---

## Stale Comments

A wrong comment is worse than no comment.

When code changes, update or remove related comments.

Do not leave commented-out code.

Version control already preserves history.

---

## TODO Comments

TODO comments must include enough context to act on.

Preferred:

```ts
// TODO(AER-142): Replace the in-memory lease with the shared database lease
// before enabling horizontal worker scaling.
```

Avoid:

```ts
// TODO: fix later
```

TODOs that affect:

```text
security
privacy
data loss
authorization
production readiness
```

must have a tracked issue.

---

## JSDoc

Use JSDoc for public or non-obvious APIs.

```ts
/**
 * Evaluates whether the bot can moderate the target member.
 *
 * This checks provider permissions and Discord role hierarchy. It does not
 * check Aerealith authorization, which must occur before this policy runs.
 */
export function evaluateDiscordModerationAuthority(input: DiscordModerationAuthorityInput): DiscordModerationAuthorityResult {
  // ...
}
```

Do not add JSDoc that merely repeats the signature.

---

## Documentation References

Link complex behavior to architecture or RFC documentation when useful.

```ts
/**
 * See docs/rfcs/0011-event-envelope-audit-model-and-idempotency.md.
 */
```

Do not use documentation links as a substitute for understandable code.

---

## Domain Code

Domain code should:

```text
use Aerealith-owned types
avoid framework dependencies
avoid provider SDK types
avoid database row types
avoid HTTP concepts
avoid environment access
remain testable
```

Good:

```ts
export function canTransitionModuleStatus(current: ModuleStatus, next: ModuleStatus): boolean {
  // ...
}
```

Bad:

```ts
export function canTransitionModuleStatus(request: HonoRequest, row: DrizzleModuleRow): boolean {
  // ...
}
```

---

## Application Services

Application services coordinate:

```text
validation
authorization
domain policies
repositories
provider capabilities
events
audit
notifications
```

They should not contain:

```text
raw HTTP response construction
provider SDK payload mapping
SQL
React state
```

Example structure:

```ts
export class EnableModuleService {
  public constructor(
    private readonly moduleRegistry: ModuleRegistry,
    private readonly moduleRepository: ModuleRepository,
    private readonly authorizationService: AuthorizationService,
    private readonly eventPublisher: EventPublisher,
  ) {}

  public async execute(input: EnableModuleInput, context: RequestContext): Promise<Result<ModuleInstallation, AerealithError>> {
    // ...
  }
}
```

---

## Dependency Injection

Use explicit constructor or factory injection.

Preferred:

```ts
const service = new EnableModuleService(moduleRegistry, moduleRepository, authorizationService, eventPublisher);
```

Avoid service-locator patterns:

```ts
const service = globalContainer.resolve('enableModule');
```

Framework-managed dependency injection is acceptable inside framework boundaries.

Domain behavior should remain framework-neutral where practical.

---

## Repository Style

Repositories own persistence behavior.

Repository interfaces should use domain-oriented inputs and outputs.

```ts
export interface ModuleRepository {
  findInstallationById(id: string): Promise<Result<ModuleInstallation | null, AerealithError>>;

  insertInstallation(installation: ModuleInstallation): Promise<Result<ModuleInstallation, AerealithError>>;
}
```

Repositories should not expose:

```text
raw Drizzle rows
SQL fragments
database connection objects
provider types
HTTP errors
```

---

## Database Rows

Database row types remain inside `libs/db`.

Map rows explicitly.

```ts
export function mapModuleInstallationRow(row: ModuleInstallationRow): ModuleInstallation {
  return {
    id: row.id,
    moduleId: row.moduleId,
    version: row.moduleVersion,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}
```

Avoid:

```ts
return row;
```

at domain or API boundaries.

---

## Drizzle Style

Drizzle schemas should use:

```text
clear table names
clear column names
explicit constraints
explicit indexes
explicit references
timestamps
```

Example:

```ts
export const moduleInstallations = pgTable(
  'module_installations',
  {
    id: text('id').primaryKey(),
    moduleId: text('module_id').notNull(),
    moduleVersion: text('module_version').notNull(),
    status: text('status').notNull(),
    scopeType: text('scope_type').notNull(),
    scopeId: text('scope_id').notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    scopeModuleUnique: uniqueIndex('module_installations_scope_module_unique').on(table.scopeType, table.scopeId, table.moduleId),
  }),
);
```

---

## Database Naming

Database identifiers use snake_case.

Examples:

```text
module_installations
workflow_runs
created_at
scope_id
provider_resource_id
```

TypeScript properties use camelCase.

Mapping should remain explicit.

---

## Database Constraints

Prefer database constraints for invariants that must survive concurrency.

Examples:

```text
unique event ID
one installation per scope and module
one idempotency receipt per action
foreign key ownership
non-null required state
```

Application validation does not replace database constraints.

---

## Database Transactions

Transactions should have clear boundaries.

Use transactions for:

```text
related state changes
state change plus outbox event
idempotency receipt plus result
```

Avoid:

```text
network requests inside database transactions
waiting for approval inside transactions
long-running AI calls inside transactions
provider API calls inside transactions
```

---

## SQL Migrations

Migration filenames should be generated consistently.

Generated migrations require review.

Migration comments should explain:

```text
risky transformations
backfill assumptions
compatibility behavior
manual operational steps
```

Do not edit migrations that have already been applied to shared environments.

---

## Date and Time

Store and transmit timestamps in UTC.

Public contracts should use ISO 8601 strings.

Example:

```text
2026-07-13T18:42:00.000Z
```

Use clear names:

```text
createdAt
updatedAt
expiresAt
revokedAt
occurredAt
recordedAt
```

Avoid ambiguous names:

```text
date
time
timestamp
```

unless the context is truly generic.

---

## Time Durations

Use explicit units in variable names.

Good:

```ts
const timeoutMs = 5_000;
const retentionDays = 30;
const approvalExpirationMinutes = 15;
```

Bad:

```ts
const timeout = 5;
const retention = 30;
```

---

## Numeric Separators

Use numeric separators for readability.

```ts
const timeoutMs = 30_000;
const maximumFileSizeBytes = 10_000_000;
```

---

## Money and Precise Values

Do not use floating-point values for money.

Use:

```text
integer minor units
decimal type
provider-defined precise string
```

Example:

```ts
interface Money {
  readonly currency: string;
  readonly amountMinor: bigint;
}
```

---

## IDs

Aerealith IDs should be opaque.

Preferred forms may use prefixes:

```text
usr_
acc_
org_
com_
int_
mod_
wfl_
run_
aud_
ntf_
req_
```

IDs should not encode:

```text
private information
authorization
mutable names
timestamps requiring parsing
```

Do not infer resource ownership from an ID prefix alone.

---

## API Route Style

Public API routes use:

```text
/api/V1/
```

Routes use lowercase path segments and hyphenated compound words.

Examples:

```text
/api/V1/module-installations
/api/V1/workflow-runs
/api/V1/integration-connections
```

Path parameters use camelCase in code:

```text
workflowId
connectionId
```

---

## API Handlers

Handlers should remain thin.

A handler should:

```text
read the request
validate transport input
resolve authentication context
call an application service
map the result to an API response
```

A handler should not:

```text
write SQL
call provider SDKs
implement authorization rules
perform domain transitions directly
construct audit rows
```

---

## Hono Style

Hono route modules should group related endpoints.

```ts
export function createModuleRoutes(dependencies: ModuleRouteDependencies): Hono {
  const router = new Hono();

  router.post('/api/V1/modules/:moduleId/enable', validateJson(EnableModuleRequestSchema), async (context) => {
    const requestContext = context.get('requestContext');
    const input = context.req.valid('json');

    const result = await dependencies.enableModuleService.execute(
      {
        ...input,
        moduleId: context.req.param('moduleId'),
      },
      requestContext,
    );

    return mapResultToResponse(context, result);
  });

  return router;
}
```

Middleware should own cross-cutting concerns.

---

## NestJS Style

NestJS controllers should remain transport adapters.

```ts
@Controller('/api/V1/modules')
export class ModuleController {
  public constructor(private readonly enableModuleService: EnableModuleService) {}

  @Post(':moduleId/enable')
  public async enable(@Param('moduleId') moduleId: string, @Body() body: EnableModuleRequest, @RequestContext() context: RequestContext): Promise<ApiResponse<ModuleInstallationResponse>> {
    const result = await this.enableModuleService.execute(
      {
        moduleId,
        ...body,
      },
      context,
    );

    return mapResultToApiResponse(result);
  }
}
```

Do not bury domain logic in decorators, guards, or interceptors.

---

## Framework Boundaries

A service should use one primary HTTP framework.

Do not mix Hono and NestJS inside the same deployable unless an accepted architecture decision requires it.

Framework-specific code should remain near the transport boundary.

---

## API Response Envelopes

Success responses:

```ts
export interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly requestId: string;
  readonly traceId?: string;
}
```

Error responses:

```ts
export interface ApiErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly category: string;
    readonly retryable: boolean;
    readonly requestId: string;
    readonly traceId?: string;
    readonly details?: Readonly<Record<string, unknown>> | null;
  };
}
```

Do not invent a different envelope per feature.

---

## HTTP Status Codes

Use status codes consistently.

| Status | Use                                                 |
| ------ | --------------------------------------------------- |
| `200`  | Successful read or action.                          |
| `201`  | Resource created.                                   |
| `202`  | Accepted for asynchronous processing.               |
| `204`  | Successful response with no body where appropriate. |
| `400`  | Invalid request.                                    |
| `401`  | Missing or invalid authentication.                  |
| `403`  | Authenticated but unauthorized.                     |
| `404`  | Resource not found or intentionally concealed.      |
| `409`  | State conflict.                                     |
| `422`  | Semantically invalid input where used consistently. |
| `429`  | Rate limited.                                       |
| `500`  | Unexpected internal failure.                        |
| `502`  | Upstream provider failure.                          |
| `503`  | Temporarily unavailable.                            |

Do not use `200` for failed operations.

---

## Frontend Components

React component names use PascalCase.

```tsx
export function ModuleHealthCard(props: ModuleHealthCardProps) {
  // ...
}
```

Props interfaces use the component name followed by `Props`.

```ts
export interface ModuleHealthCardProps {
  readonly module: ModuleHealthSummary;
  readonly onReview: (moduleId: string) => void;
}
```

---

## Component Responsibility

Components should have one clear responsibility.

Prefer:

```text
ModuleHealthCard
ModuleHealthBadge
ModulePermissionList
ModuleRemediationActions
```

over:

```text
ModuleEverythingPanel
```

Split a component when it owns unrelated:

```text
data fetching
complex form state
large presentation
business decisions
provider-specific formatting
```

---

## Server and Client Components

In Next.js applications, prefer server components by default.

Use client components only when required for:

```text
state
effects
browser APIs
event handlers
interactive controls
```

Client component files should include:

```ts
'use client';
```

at the top.

Do not mark a large subtree as client-side merely because one button is interactive.

---

## React Hooks

Hooks must follow React hook rules.

Custom hook names begin with `use`.

Examples:

```text
useModuleHealth
useWorkflowRun
useNotificationPreferences
```

Custom hooks should encapsulate reusable stateful behavior.

They should not hide broad unrelated application logic.

---

## Effects

Use `useEffect` only for synchronization with external systems.

Appropriate uses:

```text
browser event listener
subscription
imperative library
analytics event
external DOM integration
```

Do not use effects for:

```text
derived state
ordinary calculations
copying props into state
server data transformation
```

Bad:

```tsx
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```

Good:

```tsx
const fullName = `${firstName} ${lastName}`;
```

---

## Frontend State

Separate:

```text
server state
URL state
form state
local UI state
global application state
```

Do not store server data in several competing global stores.

Use the approved query library for server state.

Use URL parameters for shareable filter and navigation state.

Use local component state for local interaction.

---

## Data Fetching

Frontend data fetching should use approved API clients and typed contracts.

Avoid direct ad hoc `fetch()` calls scattered through components.

Prefer:

```ts
const query = useQuery({
  queryKey: ['module-health', moduleId],
  queryFn: () => moduleApi.getHealth(moduleId),
});
```

API clients should own:

```text
base URL
headers
request ID handling
error-envelope mapping
authentication behavior
```

---

## React Event Handlers

Event handlers use `handle` internally.

```tsx
function handleApprove(): void {
  approveMutation.mutate(proposal.id);
}
```

Callback props use `on`.

```ts
interface ApprovalCardProps {
  readonly onApprove: () => void;
  readonly onReject: () => void;
}
```

---

## JSX Style

Prefer readable JSX.

Good:

```tsx
<ModuleHealthCard module={module} onReview={handleReview} />
```

Avoid large inline expressions.

Bad:

```tsx
<Component label={module.status === 'degraded' && missing.length > 0 ? `${missing.length} missing` : module.status} />
```

Prefer a named value:

```tsx
const statusLabel = getModuleStatusLabel(module)

<Component label={statusLabel} />
```

---

## Conditional Rendering

Use clear conditional rendering.

```tsx
if (query.isLoading) {
  return <ModuleHealthSkeleton />;
}

if (query.isError) {
  return <ModuleHealthError error={query.error} />;
}

if (!query.data) {
  return <ModuleHealthEmptyState />;
}

return <ModuleHealthCard module={query.data} />;
```

Avoid deeply nested ternaries.

---

## Component Accessibility

Interactive components must support:

```text
keyboard use
visible focus
screen readers
semantic HTML
labels
status announcements
reduced motion
non-color indicators
```

Prefer native HTML elements.

Use:

```tsx
<button type="button">Approve</button>
```

instead of:

```tsx
<div role="button" onClick={handleApprove}>
  Approve
</div>
```

---

## Forms

Forms should use:

```text
runtime validation
clear labels
field-level errors
submission errors
disabled states
loading states
accessible descriptions
```

Client validation improves UX.

Server validation remains authoritative.

Do not trust hidden form fields for:

```text
user ID
scope
permission
risk level
approval status
```

---

## CSS and Styling

Use the established design system and shared UI components.

Avoid:

```text
duplicated component styles
one-off colors
hardcoded spacing without tokens
inline styles for ordinary layout
provider-branded styles leaking into shared components
```

Security or error states must not rely on color alone.

---

## Frontend Error Messages

Frontend errors should display safe API messages.

Do not display:

```text
stack traces
raw exceptions
SQL errors
provider payloads
internal service names
```

Include the request ID for support where appropriate.

---

## Loading States

Every asynchronous interface should consider:

```text
initial loading
background refresh
empty state
error state
partial data
stale data
disabled state
```

Avoid indefinite spinners without explanation.

---

## Provider Adapter Style

Provider adapters should:

```text
validate provider responses
map provider types
normalize errors
apply timeouts
respect rate limits
redact credentials
preserve request and trace IDs
```

Provider SDK objects must not escape the adapter.

---

## Adapter Naming

Examples:

```text
DiscordConnectionAdapter
DiscordCapabilityAdapter
ResendNotificationAdapter
OpenAIModelAdapter
CloudinaryMediaAdapter
```

Avoid names such as:

```text
DiscordUtil
ProviderHelper
ApiManager
```

---

## Webhook Handlers

Webhook handlers should:

```text
read the raw body where required
verify signatures
verify timestamps
check replay protection
validate schemas
record receipt
queue normalized work
respond promptly
```

Do not perform long-running business behavior inside webhook intake.

---

## Event Style

Event types use lowercase dot-separated identifiers.

Examples:

```text
module.enabled
workflow.run.failed
integration.connection.degraded
notification.delivery.failed
audit.record.created
```

Event payloads should be:

```text
versioned
schema-validated
provider-neutral where practical
minimal
scope-bound
```

---

## Event Names

Event names should describe facts that occurred.

Good:

```text
module.enabled
workflow.run.cancelled
integration.disconnected
```

Avoid commands disguised as events:

```text
enable.module
cancel.workflow
disconnect.integration
```

---

## Event Handlers

Event handlers must be idempotent.

A handler should:

```text
validate the envelope
validate the event version
check the receipt or idempotency key
perform the owned action
record the result
acknowledge safely
```

---

## Commands and Events

Commands request behavior.

Events describe completed or observed behavior.

Examples:

```text
Command: EnableModule
Event: module.enabled

Command: DisconnectIntegration
Event: integration.disconnected
```

Do not use events as hidden commands without documenting the semantics.

---

## AI Code Style

AI-related code should use explicit capability names.

Good:

```text
summarize-ticket
explain-permission-error
suggest-workflow
```

Avoid generic names:

```text
run-agent
ask-ai
execute-prompt
```

AI output must be treated as `unknown` until validated.

---

## AI Prompts

Prompt templates should:

```text
have stable identifiers
have versions
separate trusted instructions from untrusted context
declare output schemas
avoid embedding secrets
remain testable
```

Do not construct large prompts through scattered string concatenation.

Prefer a prompt builder with explicit blocks.

---

## AI Tool Execution

Models may propose tool calls.

Platform code validates and executes them.

Do not write:

```ts
if (modelResponse.tool === 'ban-member') {
  await discord.banMember(modelResponse.arguments);
}
```

Required flow:

```text
parse
validate schema
check allowlist
resolve scope
authorize
evaluate risk
require approval
execute capability
audit
```

---

## Discord Code Style

Discord-specific code should remain under the Discord integration boundary.

Prefer normalized internal types:

```ts
interface CommunityMemberReference {
  readonly provider: 'discord';
  readonly serverId: string;
  readonly memberId: string;
}
```

Avoid passing raw Discord.js objects into:

```text
workflows
modules
audit
notifications
AI
API contracts
```

---

## Discord Permission Checks

Discord actions must make the permission chain explicit.

Example:

```ts
const authorization = await moderationAuthorizationPolicy.evaluate({
  actor,
  targetMember,
  server,
  botMember,
  requiredAerealithPermission: 'moderation.timeout',
  requiredDiscordPermission: 'ModerateMembers',
});
```

Do not hide permission or role-hierarchy checks inside an unreviewed generic helper.

---

## Module Code Style

Every module should expose an explicit manifest.

Recommended export:

```ts
export const DiscordModerationModuleManifest: ModuleManifest = {
  id: 'aerealith.discord-moderation',
  name: 'Discord Moderation',
  version: '0.1.0',
  // ...
};
```

Module implementation should not construct:

```text
database clients
provider clients
global service containers
```

It receives declared capabilities.

---

## Workflow Code Style

Workflow actions should use stable IDs and explicit versions.

```ts
export const TimeoutCommunityMemberAction: WorkflowActionDefinition = {
  id: 'community.member.timeout',
  version: 1,
  // ...
};
```

Workflow definitions should remain data.

Do not embed arbitrary executable functions inside persisted workflow definitions.

---

## Notification Code Style

Notification types use stable IDs.

```ts
export const IntegrationConnectionDegradedNotification: NotificationTypeDefinition = {
  id: 'integration.connection-degraded',
  category: 'integrations',
  // ...
};
```

Templates receive validated values.

Do not pass entire domain objects into templates.

---

## Audit Code Style

Audit records are created from normalized events.

Services should publish:

```text
actual outcome events
```

They should not call:

```ts
auditRepository.insert(...)
```

directly during ordinary domain behavior.

Audit metadata must use allowlisted schemas.

---

## Configuration Code Style

Configuration is loaded once and validated.

Good:

```ts
export const config = loadApiConfiguration(process.env);
```

Feature code receives typed configuration.

Bad:

```ts
if (process.env.AEREALITH_AI_ENABLED === 'true') {
  // ...
}
```

inside route handlers.

---

## Environment Access

Direct `process.env` access is allowed only inside configuration-loading modules.

ESLint should restrict direct access elsewhere.

This ensures:

```text
validation
testability
environment separation
consistent defaults
secret handling
```

---

## Feature Flags

Feature flags should use typed identifiers.

```ts
export const FeatureFlag = {
  DiscordTickets: 'discord-tickets',
  WorkflowApprovals: 'workflow-approvals',
  AiSuggestions: 'ai-suggestions',
} as const;
```

Feature flags must not replace:

```text
authorization
provider permission
risk evaluation
approval
```

---

## Security-Sensitive Code

Security-sensitive code should favor:

```text
explicit branches
clear names
narrow interfaces
deterministic behavior
direct tests
```

Avoid clever abstractions around:

```text
authorization
cryptography
session validation
webhook verification
approval binding
secret handling
```

Security code should be boring enough to review.

---

## Cryptography

Use established platform or library primitives.

Do not invent:

```text
hash algorithms
encryption formats
token schemes
signature formats
random generators
```

Use cryptographically secure randomness:

```ts
crypto.randomUUID()
crypto.getRandomValues(...)
```

Do not use:

```ts
Math.random();
```

for:

```text
tokens
IDs requiring unpredictability
state values
nonces
secrets
```

---

## Tokens

Tokens should be:

```text
random
short-lived when possible
single-use where appropriate
hashed before persistence when verification does not require recovery
scope-bound
purpose-bound
```

Token variable names should explain purpose:

```text
passwordResetToken
emailVerificationToken
oauthState
webhookSignature
```

Avoid generic:

```text
token
secret
key
```

when several credentials exist in the same scope.

---

## Authorization

Authorization calls should be visible.

Good:

```ts
const authorization = await authorizationService.authorize({
  actor: context.actor,
  permission: 'module.enable',
  scope: input.scope,
});
```

Avoid hidden authorization in:

```text
frontend visibility
database query assumptions
provider permission checks
route names
```

Provider authorization does not replace Aerealith authorization.

---

## Approval

Approval-required behavior should use the shared approval primitive.

Do not represent approval as:

```text
a boolean request field
a frontend confirmation only
a model-generated claim
a provider permission
```

Example:

```ts
const approval = await approvalService.verify({
  approvalId: input.approvalId,
  action: 'moderation.ban',
  actor: context.actor,
  target: input.target,
  fingerprint: createActionFingerprint(input),
});
```

---

## Input Limits

All untrusted input should have limits.

Examples:

```text
string length
array length
file size
JSON depth
request body size
pagination size
AI token budget
webhook payload size
```

Do not accept unbounded collections.

---

## Pagination

List APIs should use explicit bounded pagination.

```ts
export const ListAuditRecordsRequestSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
```

Do not expose unbounded `listAll` endpoints for large resources.

---

## URLs

Validate external URLs.

Controls may include:

```text
allowed protocol
allowed host
redirect restrictions
private-network blocking
length limits
```

Never use user-provided URLs directly in server-side fetches without SSRF protection.

---

## File Handling

Files should be treated as untrusted.

Validate:

```text
declared content type
detected content type
extension
size
malware scan result
storage scope
```

Do not trust a filename to determine safety.

---

## Shell Commands

Avoid constructing shell commands with user input.

Bad:

```ts
exec(`convert ${filename} output.png`);
```

Prefer argument arrays:

```ts
spawn('convert', [inputPath, outputPath], {
  shell: false,
});
```

Use allowlists and controlled paths.

---

## Test Style

Tests should describe behavior.

Good:

```ts
describe('ModuleManifestValidator', () => {
  it('rejects a manifest with an unknown permission', () => {
    // ...
  });
});
```

Avoid:

```ts
describe('test validator', () => {
  it('works', () => {
    // ...
  });
});
```

---

## Test Structure

Prefer:

```text
Arrange
Act
Assert
```

Example:

```ts
it('blocks moderation when the bot is below the target role', async () => {
  const policy = createModerationPolicy();
  const input = createModerationInput({
    botHighestRolePosition: 10,
    targetHighestRolePosition: 20,
  });

  const result = await policy.evaluate(input);

  expect(result).toEqual({
    allowed: false,
    reason: 'role-hierarchy-blocked',
  });
});
```

Comments for Arrange, Act, Assert are optional when the structure is already clear.

---

## Test Names

Test names should state:

```text
condition
behavior
outcome
```

Examples:

```text
rejects an expired approval
does not duplicate a notification after queue redelivery
preserves configuration when a module is disabled
blocks cross-community audit access
```

---

## Test Data Builders

Use builders or factories for complex test data.

```ts
const connection = createIntegrationConnection({
  status: 'active',
  provider: 'discord',
});
```

Builders should provide safe defaults and allow focused overrides.

Avoid giant inline fixtures in every test.

---

## Test Isolation

Tests must not depend on execution order.

Each test should own:

```text
data
mocks
clock
environment
provider state
```

Reset shared fakes between tests.

---

## Deterministic Tests

Tests should avoid:

```text
real network calls
real time
random unseeded data
production credentials
provider availability
```

Inject:

```text
clock
ID generator
provider adapter
queue
repository
```

where needed.

---

## Time in Tests

Use a controlled clock.

```ts
const clock = new FixedClock('2026-07-13T18:42:00.000Z');
```

Avoid assertions based on the current wall clock.

---

## Snapshot Tests

Use snapshots sparingly.

Appropriate uses:

```text
stable rendered templates
small serialized contracts
generated documentation fragments
```

Avoid large snapshots that reviewers cannot reasonably inspect.

Prefer direct assertions for business behavior.

---

## Mocking

Mock interfaces at architectural boundaries.

Good mocks:

```text
FakeDiscordCapabilityAdapter
InMemoryModuleRepository
FakeApprovalService
FixedClock
TestEventPublisher
```

Avoid mocking implementation details of the function under test.

---

## Integration Tests

Integration tests should use real implementations for the boundary being tested.

Examples:

```text
real Drizzle repository against PostgreSQL
real webhook signature verifier
real API routing with fake provider
real event consumer with test queue
```

Do not label a test integration-level when every dependency is mocked.

---

## End-to-End Tests

End-to-end tests should verify user-visible behavior and security boundaries.

They should not depend on:

```text
production providers
production data
manual setup
test order
```

Use stable selectors based on:

```text
role
label
accessible name
test ID only when necessary
```

---

## Coverage

Required minimum:

```text
80% statements
80% branches
80% functions
80% lines
```

Coverage is not the objective.

Important behavior must have direct tests even when the file already meets the threshold.

Priority test areas:

```text
authorization
approval
idempotency
event versioning
credential handling
provider error mapping
workflow transitions
module lifecycle
audit redaction
notification recipient scope
AI tool boundaries
Discord role hierarchy
```

---

## Test File Placement

Tests should usually live next to the implementation.

```text
module-registry.ts
module-registry.spec.ts
```

Larger integration and end-to-end tests may live under:

```text
tests/integration/
tests/e2e/
```

Follow the owning project convention consistently.

---

## Fixtures

Fixtures must be:

```text
synthetic
small
documented
safe to commit
free of production data
free of secrets
```

Do not commit captured production webhooks, messages, tickets, prompts, or provider responses.

---

## Generated Code

Generated code must be clearly marked.

Preferred header:

```ts
// Generated file. Do not edit manually.
// Source: libs/contracts/src/...
```

Generated code should live in dedicated directories.

Generated files should not contain manually maintained logic.

---

## Code Generation

Generators should produce code that already passes:

```text
formatting
lint
typecheck
tests where templates include tests
Nx boundary validation
```

Generated code should follow the same standards as handwritten code.

---

## Scripts

Repository scripts should use:

```text
Node.js
portable APIs
clear error codes
argument validation
safe defaults
```

Prefer `.mjs` or TypeScript scripts over complex shell logic when portability matters.

---

## Shell Scripts

Shell scripts must use safe modes where compatible.

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
```

Quote variables:

```bash
rm -rf -- "${TARGET_DIR}"
```

Avoid:

```bash
rm -rf $TARGET_DIR
```

Destructive scripts must validate targets.

---

## PowerShell

PowerShell scripts should use:

```powershell
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
```

Use:

```text
approved verbs
named parameters
error handling
path validation
```

PowerShell scripts should not become the only implementation of a cross-platform repository task unless Windows is the intended platform.

---

## Dockerfile Style

Dockerfiles should:

```text
use pinned base images
use multi-stage builds
run as non-root
copy only required files
avoid embedding secrets
include health behavior where appropriate
minimize layers without sacrificing readability
```

Example:

```dockerfile
FROM node:24-bookworm-slim AS build

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm nx build api

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production

WORKDIR /app

RUN useradd --system --uid 10001 aerealith

COPY --from=build --chown=aerealith:aerealith /workspace/dist/apps/services/api ./

USER aerealith

CMD ["node", "main.js"]
```

---

## YAML Style

YAML uses two-space indentation.

Avoid complex YAML anchors that obscure configuration.

Sensitive values should use secret references, not literals.

---

## JSON Style

JSON uses:

```text
double quotes
two-space indentation
no comments
no trailing commas
```

Do not manually edit generated lockfile sections.

---

## Markdown Style

Markdown documents should use:

```text
one H1 title
sentence-case headings
blank lines around blocks
fenced code blocks with language labels
relative repository links
clear tables
```

Avoid:

```text
HTML for ordinary layout
very deep heading nesting
undocumented abbreviations
massive unbroken paragraphs
```

Architecture documents may use Mermaid diagrams.

---

## Documentation Language

Documentation should be:

```text
direct
specific
factual
actionable
consistent with implemented behavior
```

Avoid vague claims:

```text
enterprise-grade
military-grade
perfectly secure
exactly once
AI-powered magic
```

Use precise descriptions of what the system actually guarantees.

---

## Deprecation Style

Deprecated APIs should include:

```text
replacement
reason
removal version or timeline
migration guidance
```

Example:

```ts
/**
 * @deprecated Use `findInstallationByScope` instead.
 * This method does not enforce scope ownership.
 */
```

Do not leave deprecated behavior indefinitely without tracking removal.

---

## Backward Compatibility

Publicly exposed behavior includes:

```text
API routes
response envelopes
error codes
event types
event versions
module IDs
capability IDs
workflow action IDs
notification type IDs
audit action IDs
```

Changes require compatibility review.

Internal refactoring should preserve public contracts unless the version changes intentionally.

---

## Feature Removal

Removing a feature should include:

```text
usage review
dependency review
migration path
data-retention decision
configuration cleanup
documentation update
event and audit review
```

Do not delete code while leaving:

```text
database tables
feature flags
dead routes
stale documentation
unused permissions
```

---

## Dead Code

Delete dead code.

Do not preserve it through comments or unused flags.

Version control retains history.

Unused code increases:

```text
review cost
security surface
maintenance burden
confusion
```

---

## Dependency Use

Before adding a dependency, consider:

```text
Can the platform already do this?
Is the package maintained?
Is the license acceptable?
Is the package secure?
Is the bundle cost acceptable?
Is the runtime compatible?
Does the dependency expose provider types across boundaries?
```

Dependencies should be added to the owning project.

---

## Utility Libraries

Avoid generic dumping grounds such as:

```text
utils.ts
helpers.ts
common.ts
misc.ts
```

Prefer focused files:

```text
create-request-id.ts
normalize-provider-error.ts
validate-redirect-url.ts
```

Shared utilities should have a clear owner and purpose.

---

## Abstractions

Create an abstraction when it represents:

```text
a stable concept
a repeated policy
a meaningful boundary
a replaceable provider
a testable capability
```

Do not abstract solely because two blocks currently look similar.

Premature abstraction can hide important differences.

---

## Generic Types

Use generics when they preserve meaningful type relationships.

Good:

```ts
export interface Repository<TEntity, TId> {
  findById(id: TId): Promise<Result<TEntity | null, AerealithError>>;
}
```

Avoid generic designs so broad that meaning disappears:

```ts
class Manager<T, U, V, W> {}
```

Specific domain interfaces are often clearer.

---

## Naming Architecture Layers

Recommended names:

```text
transport
application
domain
infrastructure
persistence
policies
adapters
consumers
registry
configuration
observability
```

Avoid arbitrary mixtures such as:

```text
controllers
handlers
services
managers
processors
logic
```

without a defined distinction.

---

## Framework Generated Names

Framework-required names are allowed.

Examples:

```text
page.tsx
layout.tsx
route.ts
middleware.ts
project.json
```

Framework convention overrides the general filename rule when necessary.

---

## Review Guidelines

Reviewers should evaluate:

```text
correctness
architecture
security
data ownership
runtime validation
error behavior
test quality
observability
readability
maintainability
```

Review comments should explain the concern.

Prefer:

```text
This route calls the Discord SDK directly, which bypasses the provider adapter and rate-limit coordinator. Please move the call into the Discord capability adapter.
```

Avoid:

```text
I don't like this.
```

---

## Pull Request Expectations

Code should be ready for review before requesting review.

The author should verify:

```text
formatting passes
lint passes
type checking passes
tests pass
coverage passes
build passes
documentation is updated
migrations are reviewed
generated code is current
security scans are reviewed
```

---

## Review Scope

Large changes should be split when practical.

A pull request should have one coherent purpose.

Avoid mixing:

```text
feature work
dependency upgrades
large formatting changes
unrelated refactors
migration rewrites
```

unless the changes are inseparable.

---

## Refactoring

Refactoring should preserve behavior unless behavior change is explicit.

Refactoring pull requests should include tests proving preserved behavior.

Do not hide behavior changes inside a cleanup commit.

---

## Security Review Triggers

Additional security review is required for changes involving:

```text
authentication
authorization
sessions
credentials
cryptography
webhooks
provider scopes
approval
administrator access
data export
data deletion
AI tools
prompt handling
audit integrity
```

---

## Performance Style

Write clear code first.

Optimize after measurement.

When optimization is required:

```text
record the measurement
explain the bottleneck
add regression tests or benchmarks
preserve readability where practical
```

Avoid speculative micro-optimization.

---

## Database Performance

Database queries should:

```text
select only required fields
use indexes supported by real query patterns
avoid N+1 behavior
use bounded pagination
avoid unbounded JSON scans
```

Performance changes should be verified against PostgreSQL and CockroachDB compatibility where applicable.

---

## Frontend Performance

Frontend performance should consider:

```text
bundle size
server versus client rendering
query caching
image optimization
large list virtualization
unnecessary rerenders
```

Do not use memoization everywhere by default.

Use it when profiling or stable behavior demonstrates value.

---

## Provider Performance

Provider clients should use:

```text
timeouts
bounded concurrency
rate-limit coordination
connection reuse where safe
retry policy
```

Do not create one provider client per request when the runtime supports safe reuse.

---

## Accessibility as Code Quality

Accessibility defects are code-quality defects.

Components should be tested for:

```text
semantic HTML
keyboard access
focus
labels
error announcements
contrast
reduced motion
```

A component is not complete merely because it looks correct.

---

## Localization Readiness

User-visible strings should be written clearly and consistently.

Avoid assembling sentences through concatenation.

Bad:

```ts
const message = userName + ' enabled ' + moduleName;
```

Prefer structured message inputs:

```ts
const message = formatMessage('module.enabled', {
  userName,
  moduleName,
});
```

The MVP may ship in English while preserving future localization boundaries.

---

## Privacy as Code Quality

Code should minimize:

```text
collected data
stored data
logged data
AI context
provider payload retention
```

When adding a field, reviewers should ask:

```text
Why is it needed?
Who owns it?
Who may access it?
How long is it retained?
How is it deleted?
```

---

## Common Anti-Patterns

Avoid:

```text
any
non-null assertions
double type assertions
raw process.env access
raw provider SDK types outside adapters
raw Drizzle rows outside libs/db
business logic inside route handlers
authorization in frontend code only
approval represented as a boolean
direct audit-row writes
direct email or Discord calls from domain services
unbounded list endpoints
unvalidated JSON
secrets in logs
catching errors as if they were always Error
generic utils files
global mutable state
large god services
circular dependencies
hidden side effects
deeply nested ternaries
commented-out code
untracked TODOs
tests named "works"
production data in fixtures
```

---

## Preferred Example

```ts
export class DisconnectIntegrationService {
  public constructor(
    private readonly connectionRepository: IntegrationConnectionRepository,
    private readonly authorizationService: AuthorizationService,
    private readonly approvalService: ApprovalService,
    private readonly providerRegistry: IntegrationProviderRegistry,
    private readonly eventPublisher: EventPublisher,
    private readonly clock: Clock,
  ) {}

  public async execute(input: DisconnectIntegrationInput, context: RequestContext): Promise<Result<IntegrationConnection, AerealithError>> {
    const connectionResult = await this.connectionRepository.findById(input.connectionId);

    if (!connectionResult.ok) {
      return connectionResult;
    }

    const connection = connectionResult.value;

    if (!connection) {
      return err(
        createError({
          code: 'INTEGRATION_CONNECTION_NOT_FOUND',
          message: 'The integration connection could not be found.',
          category: 'integration',
          retryable: false,
          requestId: context.requestId,
          traceId: context.traceId,
        }),
      );
    }

    const authorization = await this.authorizationService.authorize({
      actor: context.actor,
      permission: 'integration.disconnect',
      scope: connection.scope,
    });

    if (!authorization.ok) {
      return authorization;
    }

    const approval = await this.approvalService.verify({
      approvalId: input.approvalId,
      action: 'integration.disconnect',
      actor: context.actor,
      target: {
        type: 'integration-connection',
        id: connection.id,
      },
      fingerprint: createDisconnectIntegrationFingerprint(input),
    });

    if (!approval.ok) {
      return approval;
    }

    const provider = this.providerRegistry.find(connection.provider);

    if (!provider) {
      return err(createIntegrationProviderNotFoundError(connection.provider));
    }

    const disconnectResult = await provider.disconnect(connection.id);

    if (!disconnectResult.ok) {
      return disconnectResult;
    }

    const disconnectedConnection: IntegrationConnection = {
      ...connection,
      status: 'disconnected',
      disconnectedAt: this.clock.now().toISOString(),
    };

    const persistenceResult = await this.connectionRepository.update(disconnectedConnection);

    if (!persistenceResult.ok) {
      return persistenceResult;
    }

    await this.eventPublisher.publish({
      eventId: createEventId(),
      eventType: 'integration.disconnected',
      eventVersion: 1,
      occurredAt: this.clock.now().toISOString(),
      actor: context.actor,
      target: {
        type: 'integration-connection',
        id: connection.id,
      },
      scope: connection.scope,
      approvalId: input.approvalId,
      requestId: context.requestId,
      traceId: context.traceId,
      outcome: 'succeeded',
      payload: {
        provider: connection.provider,
      },
    });

    return ok(persistenceResult.value);
  }
}
```

This example demonstrates:

```text
explicit dependencies
typed input
structured results
early returns
server-side authorization
approval binding
provider abstraction
safe error handling
event publication
request and trace correlation
```

---

## Tooling Configuration

Recommended repository configuration:

```text
.prettierrc.json
.prettierignore
eslint.config.mjs
.editorconfig
tsconfig.base.json
nx.json
vitest.workspace.ts
```

Shared configuration should live at the repository root or in dedicated tooling libraries.

Individual projects may extend shared configuration.

They should not redefine fundamental style rules independently.

---

## ESLint Direction

ESLint should enforce:

```text
unused imports
unused variables
no explicit any
no floating promises
consistent type imports
exhaustive switches
React hook rules
accessibility rules
Nx boundaries
restricted imports
restricted environment access
```

Potential restricted imports:

```text
frontend -> libs/db
core -> provider SDKs
contracts -> app implementations
modules -> raw Discord client
workflows -> provider SDKs
AI -> credential stores
```

---

## Semgrep Direction

Semgrep rules may detect:

```text
raw authorization-header logging
direct process.env access
dangerous SQL
shell injection
unsafe child processes
unverified webhook handlers
use of Math.random for security values
dangerouslySetInnerHTML
unrestricted fetch of user URLs
provider credentials entering AI context
```

---

## Sonar Direction

Sonar tooling may detect:

```text
complexity
duplication
unreachable code
error-prone conditions
security hotspots
maintainability issues
```

Sonar findings should be reviewed rather than blindly suppressed.

Suppressions require a reason.

---

## Codecov Direction

Codecov tracks repository coverage.

Coverage changes should be reviewed in context.

A small percentage increase does not compensate for missing security-critical tests.

---

## Meticulous AI Direction

Meticulous AI may validate visual changes.

Visual testing should cover:

```text
responsive layout
error states
loading states
permission-denied states
high-risk approval UI
dark and light appearance where supported
```

Visual tests do not replace functional or accessibility tests.

---

## Dependency Automation

Renovate and Dependabot may propose dependency updates.

Automated updates must still pass:

```text
type checking
tests
build
security scans
provider compatibility
runtime compatibility
```

Major upgrades require architecture review when they affect public behavior or framework boundaries.

---

## Implementation Sequence

Recommended implementation order:

```text
1. Finalize Prettier configuration.
2. Finalize strict TypeScript configuration.
3. Configure ESLint flat config.
4. Add Nx dependency-boundary rules.
5. Add import-order enforcement.
6. Add no-any and no-floating-promise enforcement.
7. Add restricted process.env access.
8. Add restricted provider-SDK imports.
9. Add shared error and result types.
10. Add request and trace context types.
11. Add runtime schema conventions.
12. Add repository and mapper conventions.
13. Add frontend component conventions.
14. Add testing conventions.
15. Add Semgrep rules.
16. Add secret scanning.
17. Add container and dependency scanning.
18. Add CI style validation.
19. Add code-style examples to generators.
20. Review existing code and migrate incrementally.
```

---

## Required Decisions

Before this standard is considered stable, Aerealith must finalize:

```text
exact Prettier configuration
exact ESLint rule set
import ordering
default-export exceptions
barrel-file policy
strict TypeScript settings
Result implementation
AerealithError contract
ID format
date and time representation
test filename convention
repository interface convention
React state-management conventions
API framework ownership
localization library
logging library
structured logger fields
```

---

## Exceptions

A style exception requires:

```text
clear technical reason
narrow scope
code comment when non-obvious
reviewer agreement
tracked cleanup when temporary
```

Examples of valid exceptions:

```text
framework-required default export
provider SDK type inside adapter implementation
generated code
performance-critical implementation supported by benchmarks
legacy migration boundary
```

“Personal preference” is not an exception.

---

## Success Criteria

The code-style standard is successful when:

```text
formatting is automatic
strict TypeScript is enabled
external input is runtime-validated
public contracts are explicit
any is rare and justified
provider SDK types remain isolated
database rows remain inside libs/db
route handlers remain thin
authorization remains server-side
high-risk actions use approval
errors use stable codes
logs are structured
secrets are redacted
request and trace IDs propagate
events are versioned
event handlers are idempotent
tests describe behavior
coverage thresholds are enforced
accessibility is reviewed
generated code follows repository standards
Nx boundaries prevent architectural drift
contributors can understand unfamiliar code quickly
```

---

## Final Standard

Aerealith code should be predictable enough to review, strict enough to catch mistakes, explicit enough to secure, and clear enough to maintain.

The standard is:

> Every Aerealith source file follows automated formatting, strict typing, explicit runtime validation, stable naming, clear dependency direction, structured errors, observable execution, server-side authorization, approval-aware high-risk behavior, provider and persistence isolation, deterministic testing, documented intent, and the architectural boundaries defined by the platform. Clever shortcuts must never be allowed to weaken clarity, security, data ownership, or user trust.
