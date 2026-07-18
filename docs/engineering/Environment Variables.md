# Environment Variables

Status: Draft
Owner: SinLess Games LLC
Last Updated: 2026-07-13
Security Classification: Internal Engineering
Primary Prefix: `AEREALITH_`
Primary Runtime: Node.js 24.x
Configuration Validation: Zod
Deployment Targets: Cloudflare Workers, Node.js, Docker, Kubernetes, and self-hosted environments

Related Engineering Documentation:

- `docs/engineering/Code Style.md`
- `docs/engineering/Testing.md`
- `docs/engineering/TypeScript Standards.md`
- `docs/engineering/Package Management.md`
- `docs/engineering/Monorepo Rules.md`
- `docs/engineering/Dependency Rules.md`
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

- `docs/rfcs/0008-configuration-and-secrets-model.md`
- `docs/rfcs/0009-authentication-session-and-authorization-model.md`
- `docs/rfcs/0010-api-envelope-request-and-trace-id-propagation.md`
- `docs/rfcs/0011-event-envelope-audit-model-and-idempotency.md`
- `docs/rfcs/0013-provider-abstraction-and-integration-interface.md`
- `docs/rfcs/0016-ai-assistant-boundaries-and-mvp-memory-scope.md`
- `docs/rfcs/0017-observability-trace-propagation-and-alerting.md`

---

## Purpose

This document defines the environment-variable standards for Aerealith AI.

It governs how contributors and deployment systems:

```text
name environment variables
classify configuration
load variables
validate variables
document variables
store secrets
expose frontend-safe values
manage environment-specific values
rotate secrets
test configuration
inject deployment configuration
handle missing or invalid values
deprecate variables
migrate configuration
prevent production leakage
```

The objective is to make Aerealith configuration:

```text
explicit
validated
portable
secure
discoverable
consistent
testable
environment-aware
provider-neutral
safe across runtime boundaries
```

The guiding rule is:

> Environment variables are an external input boundary. They must be centrally loaded, runtime-validated, classified, documented, and converted into typed configuration before application code may use them.

An environment variable is not trusted merely because:

```text
it exists
TypeScript declares it
a deployment platform injected it
the value worked locally
the variable name contains SECRET
```

---

## Core Principles

Aerealith environment-variable handling follows these principles:

```text
All Aerealith variables use the AEREALITH_ prefix.
External values begin as untrusted strings.
Configuration is loaded once at startup.
Configuration is validated before the application becomes ready.
Feature code does not read process.env directly.
Frontend-public values use a separate explicit public prefix.
Secrets are never exposed to browser bundles.
Secrets are never committed.
Production credentials are never used in local development.
Defaults are safe and intentional.
Boolean parsing is explicit.
Numeric units appear in variable names.
Lists use a documented encoding.
Invalid configuration fails clearly.
Optional integrations fail closed or degrade safely.
Configuration changes are observable.
Environment-specific behavior is explicit.
```

---

## Configuration Versus Secrets

Environment variables may contain either:

```text
non-secret configuration
secret configuration
```

Examples of non-secret configuration:

```text
environment name
service name
port
log level
feature availability
provider selection
timeout
retry count
database dialect
public API base URL
```

Examples of secret configuration:

```text
database password
OAuth client secret
Discord bot token
API key
encryption key
session signing key
webhook secret
registry token
```

Secret values require stronger controls.

A variable being stored in an environment does not automatically make it safe.

---

## Naming Standard

All server-side Aerealith environment variables must begin with:

```text
AEREALITH_
```

Examples:

```text
AEREALITH_ENVIRONMENT
AEREALITH_SERVICE_NAME
AEREALITH_DATABASE_URL
AEREALITH_LOG_LEVEL
AEREALITH_DISCORD_ENABLED
AEREALITH_AI_PROVIDER
```

Variables should use:

```text
uppercase
snake case
stable names
domain-oriented grouping
explicit units
clear boolean semantics
```

Avoid:

```text
DB
URL
TOKEN
ENV
DEBUG
TIMEOUT
KEY
```

as standalone or ambiguous names.

---

## Naming Pattern

Recommended structure:

```text
AEREALITH_<DOMAIN>_<SETTING>
```

Examples:

```text
AEREALITH_DATABASE_URL
AEREALITH_DATABASE_DIALECT
AEREALITH_AUTH_SESSION_TTL_MINUTES
AEREALITH_DISCORD_BOT_TOKEN
AEREALITH_WORKFLOW_MAX_ATTEMPTS
AEREALITH_NOTIFICATIONS_EMAIL_ENABLED
AEREALITH_OBSERVABILITY_OTEL_ENABLED
```

Provider-specific settings may use:

```text
AEREALITH_<DOMAIN>_<PROVIDER>_<SETTING>
```

Examples:

```text
AEREALITH_NOTIFICATIONS_RESEND_API_KEY
AEREALITH_AI_OPENAI_API_KEY
AEREALITH_MEDIA_CLOUDINARY_API_SECRET
AEREALITH_OBSERVABILITY_DATADOG_API_KEY
```

Provider-specific names must remain inside their provider adapter boundary.

---

## Environment Names

The canonical environment variable is:

```text
AEREALITH_ENVIRONMENT
```

Allowed values:

```text
local
test
preview
staging
production
```

Example:

```text
AEREALITH_ENVIRONMENT=local
```

Do not infer the environment solely from:

```text
NODE_ENV
hostname
branch name
Cloudflare account
database name
```

`NODE_ENV` may still be used by frameworks.

Aerealith application behavior should use:

```text
AEREALITH_ENVIRONMENT
```

as the authoritative environment identity.

---

## `NODE_ENV`

`NODE_ENV` remains a framework and runtime convention.

Expected values:

```text
development
test
production
```

Aerealith should not overload `NODE_ENV` with platform-specific environment meaning.

Example mapping:

| Aerealith Environment | `NODE_ENV`    |
| --------------------- | ------------- |
| `local`               | `development` |
| `test`                | `test`        |
| `preview`             | `production`  |
| `staging`             | `production`  |
| `production`          | `production`  |

Preview and staging should execute production-optimized builds.

---

## Variable Categories

Environment variables should be classified into these categories:

```text
identity
runtime
network
database
authentication
security
provider
feature
limits
observability
storage
development
testing
deployment
```

---

## Identity Variables

Identity variables describe the running service.

Examples:

```text
AEREALITH_ENVIRONMENT
AEREALITH_SERVICE_NAME
AEREALITH_SERVICE_VERSION
AEREALITH_DEPLOYMENT_ID
AEREALITH_REGION
AEREALITH_INSTANCE_ID
```

These support:

```text
logs
metrics
traces
health
audit correlation
deployment diagnostics
```

They should not contain secrets.

---

## Runtime Variables

Runtime variables configure process behavior.

Examples:

```text
AEREALITH_RUNTIME
AEREALITH_LOG_LEVEL
AEREALITH_LOG_FORMAT
AEREALITH_SHUTDOWN_TIMEOUT_MS
AEREALITH_STARTUP_TIMEOUT_MS
```

Potential runtime values:

```text
node
worker
browser
test
```

Runtime identity should normally be determined by the deployable.

It should not be freely user-controlled when changing it would produce an invalid build.

---

## Network Variables

Network configuration may include:

```text
AEREALITH_HOST
AEREALITH_PORT
AEREALITH_API_BASE_URL
AEREALITH_PUBLIC_APP_URL
AEREALITH_ALLOWED_ORIGINS
AEREALITH_TRUSTED_PROXY_COUNT
```

Units and encoding must be explicit.

Example:

```text
AEREALITH_PORT=8787
```

Example origin list:

```text
AEREALITH_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

List parsing must trim whitespace and reject empty entries.

---

## Database Variables

Recommended database variables:

```text
AEREALITH_DATABASE_URL
AEREALITH_DATABASE_DIALECT
AEREALITH_DATABASE_POOL_MIN
AEREALITH_DATABASE_POOL_MAX
AEREALITH_DATABASE_CONNECT_TIMEOUT_MS
AEREALITH_DATABASE_QUERY_TIMEOUT_MS
AEREALITH_DATABASE_SSL_MODE
AEREALITH_DATABASE_AUTO_MIGRATE
```

Supported dialect values:

```text
postgresql
cockroachdb
```

Example:

```text
AEREALITH_DATABASE_DIALECT=postgresql
```

Database-specific behavior remains inside `libs/db`.

---

## Database URL Security

`AEREALITH_DATABASE_URL` is secret when it contains credentials.

It must not appear in:

```text
logs
health responses
frontend bundles
error messages
metrics labels
audit metadata
diagnostic exports
```

Safe diagnostics may report:

```text
database host category
database dialect
connection status
database name only when safe
```

They should not report the full connection string.

---

## Database SSL Variables

Recommended values:

```text
disable
prefer
require
verify-ca
verify-full
```

Example:

```text
AEREALITH_DATABASE_SSL_MODE=verify-full
```

Production should not silently default to insecure database transport.

Local development may use:

```text
disable
```

for localhost-only disposable infrastructure.

---

## Authentication Variables

Potential authentication variables:

```text
AEREALITH_AUTH_BASE_URL
AEREALITH_AUTH_SESSION_TTL_MINUTES
AEREALITH_AUTH_SESSION_REFRESH_MINUTES
AEREALITH_AUTH_COOKIE_NAME
AEREALITH_AUTH_COOKIE_DOMAIN
AEREALITH_AUTH_COOKIE_SECURE
AEREALITH_AUTH_COOKIE_SAME_SITE
AEREALITH_AUTH_SECRET
AEREALITH_AUTH_PASSWORD_RESET_TTL_MINUTES
AEREALITH_AUTH_EMAIL_VERIFICATION_TTL_MINUTES
```

Sensitive authentication values include:

```text
AEREALITH_AUTH_SECRET
provider client secrets
signing keys
encryption keys
```

---

## Cookie Configuration

Cookie settings must be validated together.

Example values:

```text
AEREALITH_AUTH_COOKIE_SECURE=true
AEREALITH_AUTH_COOKIE_SAME_SITE=lax
AEREALITH_AUTH_COOKIE_DOMAIN=.example.com
```

Production requirements should include:

```text
Secure enabled
HttpOnly enforced in code
SameSite explicitly configured
domain reviewed
path reviewed
```

`HttpOnly` should not be controlled by a public environment variable.

It is a required security invariant.

---

## Security Variables

Potential security variables:

```text
AEREALITH_SECURITY_ENCRYPTION_KEY
AEREALITH_SECURITY_SIGNING_KEY
AEREALITH_SECURITY_CSRF_ENABLED
AEREALITH_SECURITY_RATE_LIMIT_ENABLED
AEREALITH_SECURITY_ALLOWED_REDIRECT_HOSTS
AEREALITH_SECURITY_WEBHOOK_MAX_AGE_SECONDS
AEREALITH_SECURITY_REQUEST_BODY_MAX_BYTES
AEREALITH_SECURITY_FILE_MAX_BYTES
```

Security variables must not allow production security invariants to be casually disabled.

Example:

```text
AEREALITH_SECURITY_CSRF_ENABLED=false
```

should be rejected outside:

```text
local
test
```

or prohibited entirely if no valid production use exists.

---

## Provider Variables

Provider configuration should be grouped by domain and provider.

Examples:

```text
AEREALITH_DISCORD_ENABLED
AEREALITH_DISCORD_APPLICATION_ID
AEREALITH_DISCORD_PUBLIC_KEY
AEREALITH_DISCORD_BOT_TOKEN
AEREALITH_DISCORD_CLIENT_ID
AEREALITH_DISCORD_CLIENT_SECRET
AEREALITH_DISCORD_ALLOWED_SERVER_IDS
```

```text
AEREALITH_AI_ENABLED
AEREALITH_AI_PROVIDER
AEREALITH_AI_OPENAI_API_KEY
AEREALITH_AI_MAX_INPUT_TOKENS
AEREALITH_AI_MAX_OUTPUT_TOKENS
AEREALITH_AI_DAILY_BUDGET_MINOR
```

```text
AEREALITH_NOTIFICATIONS_EMAIL_ENABLED
AEREALITH_NOTIFICATIONS_EMAIL_PROVIDER
AEREALITH_NOTIFICATIONS_RESEND_API_KEY
AEREALITH_NOTIFICATIONS_EMAIL_FROM_ADDRESS
```

Provider variables should be loaded only by:

```text
provider configuration module
provider adapter
runtime composition root
```

---

## Feature Variables

Feature variables may control availability.

Examples:

```text
AEREALITH_FEATURE_WORKFLOWS_ENABLED
AEREALITH_FEATURE_AI_ENABLED
AEREALITH_FEATURE_DISCORD_TICKETS_ENABLED
AEREALITH_FEATURE_AUDIT_EXPORTS_ENABLED
```

Feature variables must not replace:

```text
authorization
module state
provider permissions
approval
risk evaluation
subscription entitlement
```

A feature flag says whether a capability is available.

It does not grant permission.

---

## Limit Variables

Limits should include units.

Good:

```text
AEREALITH_API_REQUEST_BODY_MAX_BYTES
AEREALITH_WORKFLOW_MAX_ATTEMPTS
AEREALITH_WORKFLOW_STEP_TIMEOUT_MS
AEREALITH_NOTIFICATION_RETENTION_DAYS
AEREALITH_AI_MAX_OUTPUT_TOKENS
```

Bad:

```text
AEREALITH_MAX_SIZE
AEREALITH_TIMEOUT
AEREALITH_LIMIT
```

Values must have:

```text
minimum
maximum
default
validation
```

---

## Observability Variables

Potential observability variables:

```text
AEREALITH_OBSERVABILITY_ENABLED
AEREALITH_OBSERVABILITY_OTEL_ENABLED
AEREALITH_OBSERVABILITY_OTEL_EXPORTER
AEREALITH_OBSERVABILITY_OTEL_ENDPOINT
AEREALITH_OBSERVABILITY_SERVICE_NAME
AEREALITH_OBSERVABILITY_SAMPLE_RATE
AEREALITH_OBSERVABILITY_LOG_LEVEL
AEREALITH_OBSERVABILITY_LOG_FORMAT
AEREALITH_OBSERVABILITY_DATADOG_ENABLED
AEREALITH_OBSERVABILITY_DATADOG_API_KEY
AEREALITH_OBSERVABILITY_GRAFANA_ENABLED
AEREALITH_OBSERVABILITY_GRAFANA_ENDPOINT
```

Observability configuration must not cause secrets or private content to enter telemetry.

---

## Storage Variables

Potential storage variables:

```text
AEREALITH_STORAGE_PROVIDER
AEREALITH_STORAGE_BUCKET
AEREALITH_STORAGE_REGION
AEREALITH_STORAGE_ENDPOINT
AEREALITH_STORAGE_ACCESS_KEY_ID
AEREALITH_STORAGE_SECRET_ACCESS_KEY
AEREALITH_STORAGE_PUBLIC_BASE_URL
```

Storage credentials remain server-only.

Public media base URLs may be exposed separately where appropriate.

---

## Development Variables

Local-only configuration may include:

```text
AEREALITH_DEV_FAKE_PROVIDERS
AEREALITH_DEV_SEED_ENABLED
AEREALITH_DEV_AUTO_LOGIN_ENABLED
AEREALITH_DEV_MAIL_SINK_ENABLED
AEREALITH_DEV_FAILURE_SCENARIO
```

Development variables must be rejected outside:

```text
local
test
```

Example startup failure:

```text
CONFIG_DEVELOPMENT_OPTION_FORBIDDEN

AEREALITH_DEV_AUTO_LOGIN_ENABLED cannot be enabled in production.
```

---

## Test Variables

Test configuration may include:

```text
AEREALITH_TEST_RUN_ID
AEREALITH_TEST_DATABASE_URL
AEREALITH_TEST_DATABASE_DIALECT
AEREALITH_TEST_FAKE_CLOCK
AEREALITH_TEST_FAKE_PROVIDER_SCENARIO
AEREALITH_TEST_PARALLEL_WORKERS
```

Test variables must not point to production systems.

The test harness should reject:

```text
production database hosts
production Discord applications
production email providers
production Cloudflare accounts
```

---

## Deployment Variables

Deployment systems may inject:

```text
AEREALITH_SERVICE_VERSION
AEREALITH_DEPLOYMENT_ID
AEREALITH_REGION
AEREALITH_INSTANCE_ID
AEREALITH_BUILD_COMMIT
AEREALITH_BUILD_TIMESTAMP
```

Build metadata should be:

```text
non-secret
immutable for the release
consistent across logs and health
```

Avoid injecting unbounded branch names or user-controlled values directly into metrics labels.

---

## Frontend-Public Variables

Values exposed to browser bundles must use an explicit framework-supported public prefix.

For Next.js:

```text
NEXT_PUBLIC_AEREALITH_
```

Examples:

```text
NEXT_PUBLIC_AEREALITH_API_BASE_URL
NEXT_PUBLIC_AEREALITH_APP_ENVIRONMENT
NEXT_PUBLIC_AEREALITH_SUPPORT_URL
```

For Vite:

```text
VITE_AEREALITH_
```

Examples:

```text
VITE_AEREALITH_API_BASE_URL
VITE_AEREALITH_APP_ENVIRONMENT
```

The frontend prefix should match the active framework.

Do not expose the same value under several public prefixes unless the repository supports several independent frontend applications.

---

## Public Variable Rules

Frontend-public variables may contain only values safe for every browser user to inspect.

Allowed examples:

```text
public API base URL
public application URL
public build version
public feature presentation hint
public support URL
```

Forbidden examples:

```text
API keys
client secrets
bot tokens
database URLs
signing keys
encryption keys
private provider endpoints
internal admin URLs
session secrets
```

A variable prefixed with `NEXT_PUBLIC_` or `VITE_` should be treated as publicly disclosed.

---

## Frontend Build-Time Behavior

Frontend-public variables may be embedded at build time.

This means:

```text
changing the deployment environment may not change the bundled value
a rebuild may be required
one image may not be safely reusable across environments
```

The deployment strategy should decide whether public configuration is:

```text
build-time
runtime-injected
served through a configuration endpoint
```

The chosen strategy must be documented.

---

## Runtime Public Configuration Endpoint

A future runtime configuration endpoint may expose safe public settings.

Example:

```text
GET /api/V1/config/public
```

Potential response:

```json
{
  "success": true,
  "data": {
    "environment": "production",
    "apiBaseUrl": "https://api.example.com",
    "features": {
      "discord": true,
      "ai": false
    }
  },
  "requestId": "req_123"
}
```

The endpoint must never expose server-only environment values.

---

## Environment Files

Supported local files may include:

```text
.env.example
.env.local
.env.test
.env.integration
.env.discord.local
.env.ai.local
```

Rules:

```text
.env.example is committed.
.env.local is ignored.
Provider-specific local files are ignored.
Test files contain only synthetic safe values.
Production environment files are not committed.
```

---

## `.env.example`

`.env.example` should:

```text
list supported variables
group variables by domain
include safe placeholders
include comments where supported
avoid real credentials
avoid production URLs
```

Example:

```dotenv
# Runtime
AEREALITH_ENVIRONMENT=local
AEREALITH_SERVICE_NAME=service-api
AEREALITH_LOG_LEVEL=debug

# Database
AEREALITH_DATABASE_DIALECT=postgresql
AEREALITH_DATABASE_URL=postgresql://aerealith:aerealith_local_only@localhost:5432/aerealith_local

# Discord
AEREALITH_DISCORD_ENABLED=false
AEREALITH_DISCORD_APPLICATION_ID=
AEREALITH_DISCORD_BOT_TOKEN=
```

---

## Environment File Precedence

Precedence must be explicit.

Recommended local direction:

```text
process or deployment environment
→ provider-specific local override
→ .env.local
→ .env
→ safe code default
```

Framework-specific loading behavior may differ.

The repository should normalize it through configuration loaders.

Do not rely on undocumented framework precedence.

---

## Production Environment Files

Do not commit files such as:

```text
.env.production
.env.staging
production.env
secrets.env
```

Production values belong in:

```text
Cloudflare secrets and bindings
Kubernetes Secrets
Docker secret injection
approved secret manager
CI deployment secrets
```

---

## Centralized Configuration Loading

Direct environment access should be limited to configuration modules.

Allowed:

```text
apps/services/api/src/config/
apps/integrations/discord/src/config/
apps/services/workers/src/config/
libs/db/src/config/
libs/observability/src/config/
```

Feature code should receive typed configuration through:

```text
constructor injection
factory input
application context
```

---

## Direct `process.env` Access

Direct `process.env` access is prohibited outside configuration loaders.

Bad:

```ts
if (process.env.AEREALITH_AI_ENABLED === 'true') {
  // ...
}
```

Good:

```ts
export interface AIServiceConfig {
  readonly enabled: boolean
  readonly provider: AIProviderName
}

export class AIService {
  public constructor(private readonly config: AIServiceConfig) {}
}
```

ESLint should enforce this restriction.

---

## Cloudflare Bindings

Cloudflare Workers may receive configuration through runtime bindings.

Example:

```ts
export interface WorkerEnvironment {
  readonly AEREALITH_ENVIRONMENT: string
  readonly AEREALITH_DATABASE_URL: string
  readonly AEREALITH_AUTH_SECRET: string
}
```

The binding type does not prove the value is valid.

Bindings must still be parsed through the same configuration schema.

```ts
export function loadWorkerConfig(environment: WorkerEnvironment): WorkerConfig {
  return WorkerConfigSchema.parse(environment)
}
```

---

## Node.js Configuration Loading

Node.js runtimes may read:

```ts
process.env
```

only in the composition root or configuration module.

Example:

```ts
export function loadDiscordRuntimeConfig(
  environment: NodeJS.ProcessEnv,
): DiscordRuntimeConfig {
  return DiscordRuntimeConfigSchema.parse(environment)
}
```

The resulting configuration should be immutable.

---

## Configuration Schema

Every deployable should have a runtime schema.

Example:

```ts
import { z } from 'zod'

const EnvironmentSchema = z.enum([
  'local',
  'test',
  'preview',
  'staging',
  'production',
])

export const ApiConfigSchema = z.object({
  environment: EnvironmentSchema,
  serviceName: z.string().trim().min(1),
  port: z.number().int().min(1).max(65_535),
  database: z.object({
    url: z.string().trim().min(1),
    dialect: z.enum(['postgresql', 'cockroachdb']),
    connectTimeoutMs: z.number().int().min(100).max(60_000),
  }),
  observability: z.object({
    enabled: z.boolean(),
    logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']),
  }),
})

export type ApiConfig = z.infer<typeof ApiConfigSchema>
```

---

## Parsing Raw Environment Values

Environment variables are strings or absent.

A raw schema may parse environment values into typed configuration.

```ts
const RawApiEnvironmentSchema = z.object({
  AEREALITH_ENVIRONMENT: z.enum([
    'local',
    'test',
    'preview',
    'staging',
    'production',
  ]),
  AEREALITH_SERVICE_NAME: z.string().trim().min(1),
  AEREALITH_PORT: z.string().optional(),
  AEREALITH_DATABASE_URL: z.string().trim().min(1),
  AEREALITH_DATABASE_DIALECT: z.enum(['postgresql', 'cockroachdb']),
  AEREALITH_OBSERVABILITY_ENABLED: z.enum(['true', 'false']).optional(),
})
```

Then map into the application configuration.

```ts
export function loadApiConfig(environment: NodeJS.ProcessEnv): ApiConfig {
  const raw = RawApiEnvironmentSchema.parse(environment)

  return ApiConfigSchema.parse({
    environment: raw.AEREALITH_ENVIRONMENT,
    serviceName: raw.AEREALITH_SERVICE_NAME,
    port: parseInteger(raw.AEREALITH_PORT ?? '8787', 'AEREALITH_PORT'),
    database: {
      url: raw.AEREALITH_DATABASE_URL,
      dialect: raw.AEREALITH_DATABASE_DIALECT,
      connectTimeoutMs: 5_000,
    },
    observability: {
      enabled: raw.AEREALITH_OBSERVABILITY_ENABLED !== 'false',
      logLevel: 'info',
    },
  })
}
```

---

## Boolean Parsing

Boolean variables must accept only documented values.

Recommended accepted values:

```text
true
false
```

Do not silently treat these as boolean false:

```text
0
no
off
empty string
anything except true
```

unless the parser explicitly supports them.

Example:

```ts
export const EnvironmentBooleanSchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')
```

Invalid:

```text
AEREALITH_AI_ENABLED=yes
```

should produce a clear configuration error.

---

## Numeric Parsing

Numeric values must be parsed strictly.

Invalid examples:

```text
12ms
five
1.5
100abc
```

for an integer variable.

Example helper:

```ts
export function parseInteger(value: string, variableName: string): number {
  if (!/^-?\d+$/.test(value)) {
    throw new ConfigurationError(
      `${variableName} must be an integer.`,
      'CONFIG_INTEGER_INVALID',
    )
  }

  const parsed = Number(value)

  if (!Number.isSafeInteger(parsed)) {
    throw new ConfigurationError(
      `${variableName} is outside the safe integer range.`,
      'CONFIG_INTEGER_OUT_OF_RANGE',
    )
  }

  return parsed
}
```

---

## Duration Parsing

Prefer explicit units in variable names.

Examples:

```text
AEREALITH_PROVIDER_TIMEOUT_MS
AEREALITH_SESSION_TTL_MINUTES
AEREALITH_AUDIT_RETENTION_DAYS
```

Avoid duration strings such as:

```text
5m
2h
30s
```

unless one shared parser and standard is adopted.

Explicit numeric units are easier to validate and document.

---

## List Parsing

Comma-separated lists may be used for simple string collections.

Example:

```text
AEREALITH_ALLOWED_ORIGINS=https://one.example.com,https://two.example.com
```

Parsing rules:

```text
split by comma
trim whitespace
remove empty values
reject duplicates where duplicates are meaningless
validate each item
```

Do not use comma-separated encoding when values may themselves contain commas.

---

## JSON Environment Variables

Avoid JSON in environment variables where practical.

JSON variables are harder to:

```text
read
escape
diff
document
inject
validate
```

JSON may be acceptable for:

```text
small structured platform bindings
generated deployment metadata
provider configuration that cannot be represented safely otherwise
```

If used, the value must be:

```text
size-limited
JSON-parsed
schema-validated
redacted from logs
```

---

## Multiline Values

Multiline secrets may include:

```text
private keys
certificates
JSON credentials
```

Preferred handling:

```text
secret-file mount
secret manager reference
base64-encoded value with explicit decoding
platform-native multiline secret
```

Avoid fragile shell escaping.

If base64 is used, the variable name should make that explicit.

Example:

```text
AEREALITH_SECURITY_PRIVATE_KEY_BASE64
```

---

## File-Based Secrets

Container and Kubernetes deployments may mount secrets as files.

Recommended variable pattern:

```text
AEREALITH_SECURITY_SIGNING_KEY_FILE
AEREALITH_DATABASE_CA_CERT_FILE
```

The configuration loader may support either:

```text
direct value
file path
```

but not both simultaneously unless precedence is explicit.

Example:

```text
AEREALITH_SECURITY_SIGNING_KEY
AEREALITH_SECURITY_SIGNING_KEY_FILE
```

If both are set, startup should fail rather than guess.

---

## Secret References

Where possible, provider configuration should use references rather than raw secrets in ordinary application state.

Example:

```ts
export interface DiscordCredentialReference {
  readonly secretReference: string
}
```

Environment variables may point to:

```text
secret-manager key
mounted file
platform binding
```

The application should avoid copying raw secrets across unrelated layers.

---

## Defaults

Defaults must be:

```text
safe
documented
environment-aware
consistent
```

Appropriate defaults:

```text
local API port
local log level
optional integration disabled
bounded timeout
bounded retry count
```

Inappropriate defaults:

```text
production database URL
insecure production cookie settings
enabled destructive feature
unbounded retries
real provider enabled
wildcard CORS
```

---

## Required Variables

A variable should be required when the deployable cannot operate safely without it.

Examples:

```text
database URL for a database-backed service
auth secret for authentication runtime
Discord token for live Discord runtime
provider key for an enabled real provider
```

Do not require variables for disabled optional integrations.

Example:

```text
AEREALITH_DISCORD_ENABLED=false
```

should not require:

```text
AEREALITH_DISCORD_BOT_TOKEN
```

---

## Conditional Validation

Configuration schemas should validate related variables together.

Example:

```ts
export const DiscordConfigSchema = z
  .object({
    enabled: z.boolean(),
    applicationId: z.string().optional(),
    publicKey: z.string().optional(),
    botToken: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (!value.enabled) {
      return
    }

    if (!value.applicationId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['applicationId'],
        message: 'Discord application ID is required when Discord is enabled.',
      })
    }

    if (!value.botToken) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['botToken'],
        message: 'Discord bot token is required when Discord is enabled.',
      })
    }
  })
```

---

## Cross-Variable Validation

Configuration should validate relationships.

Examples:

```text
pool minimum must not exceed pool maximum
retry minimum must not exceed retry maximum
secure cookies must be enabled in production
real email delivery requires an approved sender
real AI requires a budget
Discord live mode requires an allowlisted test server in local
public base URL must use HTTPS in production
```

---

## Environment-Specific Validation

Production should enforce stronger invariants.

Examples:

```text
HTTPS URLs required
secure cookies required
development bypasses forbidden
fake provider disabled where real provider is required
database SSL required
debug logging restricted
auto-migration disabled
test recipients forbidden
```

Example:

```ts
function validateProductionConfig(config: ApiConfig): void {
  if (config.environment !== 'production') {
    return
  }

  if (!config.auth.cookieSecure) {
    throw new ConfigurationError(
      'Secure authentication cookies are required in production.',
      'CONFIG_PRODUCTION_COOKIE_INSECURE',
    )
  }
}
```

---

## Local Validation

Local configuration should prevent accidental production access.

Checks may include:

```text
production hostname denylist
database-name markers
provider project allowlist
Discord test-server allowlist
email recipient allowlist
Cloudflare account check
```

Example:

```text
CONFIG_UNSAFE_LOCAL_DATABASE

The local environment attempted to use a production database target.
Startup was stopped.
```

---

## Configuration Loading Flow

Recommended flow:

```mermaid
flowchart TD
  Source["Environment, Bindings, or Secret Files"]
  Raw["Raw String Values"]
  Parse["Parse Primitive Values"]
  Validate["Validate Runtime Schema"]
  Cross["Validate Cross-Field Rules"]
  Policy["Validate Environment Policy"]
  Freeze["Create Immutable Typed Configuration"]
  Inject["Inject Into Runtime Components"]
  Ready["Application Ready"]

  Source --> Raw
  Raw --> Parse
  Parse --> Validate
  Validate --> Cross
  Cross --> Policy
  Policy --> Freeze
  Freeze --> Inject
  Inject --> Ready
```

The application should not become ready before this flow completes.

---

## Immutable Configuration

Validated configuration should be treated as immutable.

```ts
export interface ApiConfig {
  readonly environment: AerealithEnvironment
  readonly serviceName: string
  readonly database: DatabaseConfig
  readonly auth: AuthConfig
  readonly observability: ObservabilityConfig
}
```

The runtime should not mutate configuration objects after startup.

Dynamic operational configuration belongs in:

```text
feature flags
database-backed settings
module configuration
provider connection records
```

not process environment variables.

---

## Static Versus Dynamic Configuration

Environment variables are appropriate for static deployment configuration.

Examples:

```text
database endpoint
service name
runtime environment
provider adapter selection
secret-manager references
```

Environment variables are not ideal for frequently changing product configuration.

Examples that should usually be database-backed:

```text
community preferences
module configuration
notification preferences
workflow definitions
AI memory settings
user consent
feature entitlement
```

---

## Runtime Reloading

Environment variables should normally be loaded only at startup.

Changing an environment variable should require:

```text
new deployment
process restart
Worker deployment
container restart
pod rollout
```

Do not poll the process environment for changes.

Dynamic configuration requires a separate controlled configuration system.

---

## Configuration Precedence

Aerealith should avoid multiple conflicting sources.

Recommended precedence:

```text
explicit runtime binding
→ mounted secret or secret manager
→ process environment
→ local environment file
→ safe code default
```

If two secret sources provide the same value, startup should fail unless precedence is explicitly documented.

---

## Secret Storage

Secrets should be stored in approved systems.

Potential production stores:

```text
Cloudflare secrets
Kubernetes Secrets with external secret management
HashiCorp Vault
cloud secret manager
CI deployment secret store
Docker secrets
```

Local stores may include:

```text
ignored .env.local
local password manager
developer secret manager
mounted local secret file
```

---

## Secret Rotation

Secret rotation should support:

```text
new secret introduction
overlap where protocol permits
deployment
validation
old secret revocation
audit
```

Potential variables:

```text
AEREALITH_AUTH_SECRET_PRIMARY
AEREALITH_AUTH_SECRET_PREVIOUS
```

Multiple active secrets should be used only when a rotation design explicitly supports them.

Do not add `OLD_SECRET` variables casually.

---

## Secret Versioning

A secret may include an external version or reference.

Examples:

```text
vault://aerealith/production/auth-secret@42
secret-manager://discord/bot-token/current
```

The raw secret value should not appear in configuration diagnostics.

---

## Secret Redaction

Configuration errors and startup logs must redact secret values.

Bad:

```text
Invalid AEREALITH_DISCORD_BOT_TOKEN: abc123...
```

Good:

```text
AEREALITH_DISCORD_BOT_TOKEN is missing or invalid.
```

A configuration logger may report:

```text
present
missing
source
version reference
```

It must not report the secret.

---

## Safe Configuration Diagnostics

A safe configuration summary may include:

```text
environment
service name
database dialect
provider mode
feature availability
log level
public URL host
timeout values
whether required secret is present
```

Example:

```text
Configuration loaded

Environment: production
Service: service-api
Database dialect: postgresql
Discord: enabled
AI provider: disabled
Email provider: resend
Authentication secret: present
```

---

## Configuration Fingerprint

A non-secret configuration fingerprint may support deployment diagnostics.

The fingerprint should be derived from:

```text
normalized non-secret configuration
secret identifiers or versions
not raw secret values
```

Potential uses:

```text
detect configuration drift
correlate deployment incidents
verify replicas share configuration
```

The fingerprint must not allow secret recovery.

---

## Unknown Variables

Unknown `AEREALITH_` variables may indicate:

```text
typo
obsolete configuration
wrong deployable configuration
stale secret
misnamed variable
```

Recommended policy:

```text
local: warn
test: fail
preview: fail
staging: fail
production: fail
```

An allowlist may support platform-injected metadata.

Unknown variables should not be silently ignored in production.

---

## Missing Variables

Missing required variables should fail startup.

Error format should include:

```text
stable error code
variable name
reason
environment
recommended action
```

Example:

```text
CONFIG_REQUIRED_VARIABLE_MISSING

AEREALITH_DATABASE_URL is required by service-api in production.
```

---

## Invalid Variables

Invalid values should fail startup with safe details.

Example:

```text
CONFIG_VALUE_INVALID

AEREALITH_DATABASE_POOL_MAX must be an integer between 1 and 100.
Received value was invalid.
```

Do not echo a secret value.

---

## Deprecated Variables

Deprecated variables should remain supported only for a defined migration period.

A deprecation should include:

```text
replacement
introduced version
removal version
migration guidance
warning
```

Example:

```text
AEREALITH_DB_URL is deprecated.
Use AEREALITH_DATABASE_URL instead.
Support will be removed in release 0.9.
```

---

## Variable Aliases

Temporary aliases may be supported during migration.

Rules:

```text
new variable wins only when precedence is explicit
setting both should usually fail
deprecation warning is emitted
alias has a removal date
tests cover both paths
```

Do not maintain permanent aliases.

---

## Variable Removal

Removing a variable requires:

```text
usage search
deployment review
documentation update
secret-store cleanup
CI cleanup
container cleanup
Kubernetes cleanup
Cloudflare cleanup
migration note
```

Stale secret values should be deleted from deployment systems.

---

## Variable Registry

Aerealith should maintain a machine-readable variable registry.

Potential location:

```text
tools/configuration/environment-variables.json
```

Suggested entry:

```json
{
  "name": "AEREALITH_DATABASE_URL",
  "owner": "Data Platform",
  "classification": "secret",
  "requiredIn": ["local", "test", "preview", "staging", "production"],
  "deployables": ["service-api", "service-workers"],
  "description": "Primary relational database connection URL.",
  "deprecated": false
}
```

The registry can support:

```text
documentation generation
unknown-variable detection
deployment validation
ownership
secret classification
```

---

## Variable Ownership

Every variable should have an owner.

Potential owners:

```text
Platform
Data Platform
Authentication
Security
Discord Integration
Workflow Platform
Notification Platform
AI Platform
Observability
Developer Experience
```

The owner is responsible for:

```text
schema
documentation
defaults
security classification
rotation
deprecation
removal
```

---

## Variable Classification

Recommended classifications:

```text
public
internal
private
secret
```

### Public

Safe for browser or public documentation.

### Internal

Safe for server configuration and operational diagnostics.

### Private

Contains non-public infrastructure information.

### Secret

Provides authentication, signing, encryption, or privileged access.

---

## Variable Documentation

Every supported variable should document:

```text
name
purpose
owner
type
allowed values
default
required environments
secret classification
runtime scope
example
deprecation status
```

Example:

| Field       | Value                                              |
| ----------- | -------------------------------------------------- |
| Name        | `AEREALITH_DATABASE_POOL_MAX`                      |
| Type        | Integer                                            |
| Default     | `10`                                               |
| Allowed     | `1` through `100`                                  |
| Secret      | No                                                 |
| Owner       | Data Platform                                      |
| Used By     | API and worker services                            |
| Description | Maximum number of database connections per process |

---

## Prefix Reservation

Reserved prefixes:

```text
AEREALITH_
NEXT_PUBLIC_AEREALITH_
VITE_AEREALITH_
```

Avoid introducing unrelated prefixes such as:

```text
LEGACY_PRODUCT_
SINLESS_
APP_
PROJECT_
BOT_
```

Migration from historic product names should use explicit deprecation rather than silent coexistence.

---

## Service-Specific Variables

Variables may be service-specific.

Examples:

```text
AEREALITH_DISCORD_GATEWAY_INTENTS
AEREALITH_WORKER_CONCURRENCY
AEREALITH_SCHEDULED_JOBS_ENABLED
```

A deployable should validate only:

```text
shared variables it owns
service-specific variables it needs
```

It should not require every variable used anywhere in the monorepo.

---

## Shared Variables

Shared variables may include:

```text
AEREALITH_ENVIRONMENT
AEREALITH_SERVICE_NAME
AEREALITH_SERVICE_VERSION
AEREALITH_LOG_LEVEL
AEREALITH_OTEL_ENDPOINT
```

Shared variables should use consistent semantics across deployables.

---

## Service Prefixes

Do not add service names into every variable unnecessarily.

Prefer:

```text
AEREALITH_LOG_LEVEL
```

when the value has the same meaning within one deployable.

Use domain prefixes when configuration is distinct.

```text
AEREALITH_DISCORD_LOG_LEVEL
```

only when Discord logging is intentionally separate from the service log level.

---

## Cloudflare Workers

Cloudflare Worker configuration may use:

```text
plain bindings
secret bindings
KV bindings
D1 bindings where applicable
queue bindings
service bindings
Durable Object bindings
```

Aerealith environment-variable conventions still apply to string bindings.

Provider-neutral application configuration should be created after validating the Worker environment.

---

## Cloudflare Secrets

Secret values should be stored through Cloudflare secret mechanisms.

They should not appear in:

```text
wrangler configuration committed to Git
plain variable blocks
build output
preview logs
```

Local Wrangler secrets should use development-only values.

---

## Docker

Docker containers should receive configuration through:

```text
environment injection
env-file for local development
Docker secrets
mounted files
orchestrator integration
```

Container images must not contain baked-in environment-specific secrets.

Bad:

```dockerfile
ENV AEREALITH_DISCORD_BOT_TOKEN=...
```

Good:

```dockerfile
ENV AEREALITH_ENVIRONMENT=production
```

only for non-secret immutable defaults where appropriate.

---

## Docker Compose

Local Compose may use safe development values.

Example:

```yaml
services:
  postgres:
    environment:
      POSTGRES_DB: aerealith_local
      POSTGRES_USER: aerealith
      POSTGRES_PASSWORD: aerealith_local_only
```

Application services should receive Aerealith-prefixed configuration.

```yaml
services:
  api:
    environment:
      AEREALITH_ENVIRONMENT: local
      AEREALITH_DATABASE_DIALECT: postgresql
      AEREALITH_DATABASE_URL: postgresql://aerealith:aerealith_local_only@postgres:5432/aerealith_local
```

Do not use local Compose credentials outside local development.

---

## Kubernetes ConfigMaps

Non-secret configuration may use ConfigMaps.

Examples:

```text
environment
service name
log level
timeouts
feature availability
provider selection
```

Kubernetes manifests should reference variables explicitly.

Avoid one enormous ConfigMap shared by every service.

---

## Kubernetes Secrets

Secret values should use:

```text
Kubernetes Secrets
External Secrets
Vault integration
cloud secret manager
sealed-secret workflow where approved
```

Base64 encoding in a Kubernetes Secret is not encryption.

Access must remain controlled through:

```text
RBAC
namespace isolation
service accounts
secret store
network policy
```

---

## Kubernetes Environment Injection

Example:

```yaml
env:
  - name: AEREALITH_ENVIRONMENT
    value: production

  - name: AEREALITH_DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: aerealith-database
        key: url
```

Secret names and keys should be stable and documented.

---

## Kubernetes File Mounts

Large or multiline secrets may be mounted as files.

Example:

```yaml
volumeMounts:
  - name: signing-key
    mountPath: /var/run/secrets/aerealith/signing
    readOnly: true
```

Application configuration:

```text
AEREALITH_SECURITY_SIGNING_KEY_FILE=/var/run/secrets/aerealith/signing/key.pem
```

---

## CI Environment Variables

CI may inject:

```text
test database URLs
test provider credentials
coverage tokens
deployment credentials
registry credentials
```

CI variables should be:

```text
scoped to the job
unavailable to untrusted pull requests
masked
rotatable
environment-specific
```

Publishing and production deployment credentials must not be available to ordinary pull-request jobs.

---

## Pull Request Security

Pull requests from untrusted sources must not receive:

```text
production secrets
publishing tokens
provider administrator tokens
database credentials
deployment credentials
```

Tests should use:

```text
fake providers
synthetic credentials
isolated test infrastructure
```

---

## GitHub Actions Direction

GitHub Actions workflows should reference secrets through:

```yaml
env:
  AEREALITH_TEST_DATABASE_URL: ${{ secrets.AEREALITH_TEST_DATABASE_URL }}
```

Avoid printing environment dumps.

Commands such as:

```bash
env
printenv
set
```

should not be used in secret-bearing jobs without filtering.

---

## Local Development

Local development should use:

```text
safe defaults
fake providers
synthetic credentials
local database
local mail sink
console telemetry
```

Real providers require explicit opt-in.

Example:

```text
AEREALITH_AI_PROVIDER=fake
AEREALITH_NOTIFICATIONS_EMAIL_PROVIDER=fake
AEREALITH_DISCORD_ENABLED=false
```

---

## Local Secret Generation

The repository may generate:

```text
local signing key
local encryption key
local webhook secret
local session secret
```

Example command:

```bash
pnpm secrets:generate:local
```

Generated files must be ignored by Git.

---

## Local Environment Template

Example:

```dotenv
AEREALITH_ENVIRONMENT=local
AEREALITH_SERVICE_NAME=service-api
AEREALITH_LOG_LEVEL=debug
AEREALITH_LOG_FORMAT=pretty

AEREALITH_DATABASE_DIALECT=postgresql
AEREALITH_DATABASE_URL=postgresql://aerealith:aerealith_local_only@localhost:5432/aerealith_local
AEREALITH_DATABASE_POOL_MIN=1
AEREALITH_DATABASE_POOL_MAX=5

AEREALITH_AUTH_COOKIE_SECURE=false
AEREALITH_AUTH_SECRET=local-development-only

AEREALITH_AI_ENABLED=false
AEREALITH_AI_PROVIDER=fake

AEREALITH_DISCORD_ENABLED=false

AEREALITH_NOTIFICATIONS_EMAIL_ENABLED=true
AEREALITH_NOTIFICATIONS_EMAIL_PROVIDER=fake

AEREALITH_OBSERVABILITY_ENABLED=true
AEREALITH_OBSERVABILITY_OTEL_ENABLED=false
```

---

## Test Configuration

Tests should construct configuration directly where practical.

Preferred:

```ts
const config: WorkflowConfig = {
  maximumAttempts: 3,
  stepTimeoutMs: 5_000,
}
```

Use environment loading tests specifically for:

```text
schema validation
parsing
environment policy
missing values
invalid values
```

Do not make every unit test depend on `process.env`.

---

## Environment Isolation in Tests

Tests that modify environment variables must restore them.

```ts
describe('loadApiConfig', () => {
  const originalEnvironment = process.env

  beforeEach(() => {
    process.env = {
      ...originalEnvironment,
    }
  })

  afterEach(() => {
    process.env = originalEnvironment
  })
})
```

A stronger helper may provide isolated environment maps without mutating the global process environment.

---

## Configuration Test Matrix

Configuration tests should include:

```text
minimum valid local configuration
minimum valid production configuration
missing required variable
invalid boolean
invalid integer
invalid URL
forbidden local option in production
real provider enabled without secret
pool minimum greater than maximum
unknown variable
deprecated variable
both direct secret and secret-file variable set
```

---

## Secret Tests

Tests must verify that:

```text
secret values are not logged
secret values are not included in errors
secret values are not returned by health
secret values are not included in audit
secret values are not included in telemetry
frontend builds do not contain server secrets
```

---

## Frontend Secret Leakage Tests

Build validation should search frontend output for known synthetic secret markers.

Example test secret:

```text
AEREALITH_TEST_SECRET_DO_NOT_SHIP_9f2a
```

The build should fail if the marker appears in:

```text
JavaScript bundles
source maps
static HTML
public configuration
```

---

## Unknown Variable Tests

Unknown-variable validation should test:

```text
typo in known variable
removed variable
variable for another deployable
platform-injected allowed variable
unrelated third-party variable
```

Only unknown variables under controlled prefixes should be treated as Aerealith configuration errors.

---

## Configuration Drift

Configuration drift occurs when replicas or environments unintentionally use different values.

Controls may include:

```text
configuration fingerprint
deployment manifest review
GitOps
environment registry
health metadata
deployment checks
```

Secret values should be compared by version or reference, not raw value.

---

## Configuration Audit

Meaningful configuration changes may be audited when they affect:

```text
security
credentials
provider access
production behavior
feature availability
retention
deletion
```

Process environment injection itself may be recorded through deployment systems.

Do not copy raw secret values into audit records.

---

## Configuration Observability

Startup telemetry may include:

```text
configuration load success
configuration load failure
deprecated variable count
unknown variable count
active provider mode
configuration fingerprint
```

Metrics should not include:

```text
secret values
database URLs
private hostnames
high-cardinality raw variable names from untrusted input
```

---

## Health Endpoints

Health responses may report safe configuration state.

Example:

```json
{
  "status": "ready",
  "service": "service-api",
  "environment": "production",
  "configuration": {
    "valid": true,
    "databaseDialect": "postgresql",
    "discordEnabled": true,
    "aiEnabled": false
  }
}
```

Health endpoints must not expose:

```text
secrets
connection strings
tokens
provider client secrets
internal certificates
```

---

## Startup Failure Behavior

Invalid configuration should:

```text
stop readiness
produce a structured safe error
emit startup telemetry
exit with non-zero status where applicable
avoid partial service startup
```

A runtime should not start accepting traffic before configuration is valid.

---

## Startup Error Codes

Potential error codes:

```text
CONFIG_REQUIRED_VARIABLE_MISSING
CONFIG_VALUE_INVALID
CONFIG_BOOLEAN_INVALID
CONFIG_INTEGER_INVALID
CONFIG_INTEGER_OUT_OF_RANGE
CONFIG_URL_INVALID
CONFIG_SECRET_MISSING
CONFIG_SECRET_CONFLICT
CONFIG_UNKNOWN_VARIABLE
CONFIG_DEPRECATED_VARIABLE
CONFIG_DEVELOPMENT_OPTION_FORBIDDEN
CONFIG_PRODUCTION_REQUIREMENT_MISSING
CONFIG_PROVIDER_INCOMPLETE
CONFIG_CROSS_FIELD_INVALID
CONFIG_UNSAFE_LOCAL_TARGET
CONFIG_FILE_UNREADABLE
CONFIG_SECRET_FILE_UNREADABLE
```

---

## Error Message Safety

Configuration errors should include:

```text
variable name
expected shape
safe reason
environment
remediation
```

They should not include:

```text
secret value
full database URL
private key content
OAuth code
token prefix
```

---

## Application Configuration Structure

Recommended service structure:

```text
apps/services/api/src/config/
├── api-config.schema.ts
├── api-config.loader.ts
├── api-config.policy.ts
├── api-config.types.ts
├── api-config.errors.ts
└── api-config.spec.ts
```

Provider-specific configuration:

```text
apps/integrations/discord/src/config/
├── discord-config.schema.ts
├── discord-config.loader.ts
├── discord-config.policy.ts
└── discord-config.spec.ts
```

---

## Shared Configuration Utilities

Potential shared structure:

```text
libs/core/src/configuration/
├── environment.ts
├── parse-boolean.ts
├── parse-integer.ts
├── parse-list.ts
├── parse-url.ts
├── secret-reference.ts
├── configuration-error.ts
└── index.ts
```

Shared utilities must remain runtime-neutral where practical.

Node-specific file loading belongs in a Node adapter.

---

## Configuration Interface Example

```ts
export interface DiscordConfig {
  readonly enabled: boolean
  readonly mode:
    'disabled' | 'fake' | 'recorded' | 'live-development' | 'live-production'
  readonly applicationId?: string
  readonly publicKey?: string
  readonly botToken?: SecretValue
  readonly allowedServerIds: ReadonlySet<string>
}
```

Raw environment strings should not be passed through application layers.

---

## Secret Wrapper Example

```ts
export interface SecretValue {
  readonly redacted: '[REDACTED]'

  reveal(): string
}

export function createSecretValue(value: string): SecretValue {
  return {
    redacted: '[REDACTED]',
    reveal: () => value,
  }
}
```

A secret wrapper reduces accidental string interpolation.

It does not replace secret storage or access control.

---

## Public Configuration Types

Frontend configuration should use a separate type.

```ts
export interface PublicFrontendConfig {
  readonly environment: 'local' | 'preview' | 'staging' | 'production'
  readonly apiBaseUrl: string
  readonly supportUrl?: string
  readonly buildVersion: string
}
```

Server configuration types must never be reused as frontend configuration.

---

## Secret Naming

Secret variable names should describe the credential purpose.

Good:

```text
AEREALITH_DISCORD_BOT_TOKEN
AEREALITH_AUTH_SESSION_SIGNING_KEY
AEREALITH_NOTIFICATIONS_RESEND_API_KEY
```

Avoid:

```text
AEREALITH_TOKEN
AEREALITH_SECRET
AEREALITH_KEY
```

when several secrets exist in the same service.

---

## API Key Naming

Use:

```text
_API_KEY
```

for provider API keys.

Use:

```text
_TOKEN
```

for bearer tokens or bot tokens.

Use:

```text
_CLIENT_SECRET
```

for OAuth client secrets.

Use:

```text
_SIGNING_KEY
```

for signing material.

Use:

```text
_ENCRYPTION_KEY
```

for encryption material.

---

## URL Naming

Use:

```text
_URL
```

for complete URLs.

Use:

```text
_HOST
```

for hostnames.

Use:

```text
_PORT
```

for ports.

Use:

```text
_ENDPOINT
```

for provider or telemetry endpoints where the value may not be a public application URL.

Examples:

```text
AEREALITH_PUBLIC_APP_URL
AEREALITH_DATABASE_HOST
AEREALITH_API_PORT
AEREALITH_OBSERVABILITY_OTEL_ENDPOINT
```

---

## URL Validation

URLs should validate:

```text
protocol
host
port where allowed
path where required
no embedded credentials where forbidden
HTTPS requirement by environment
private-network restrictions where relevant
```

A database URL may legitimately contain credentials.

A public application URL should not.

---

## Boolean Naming

Boolean variables should use affirmative names.

Good:

```text
AEREALITH_AI_ENABLED
AEREALITH_AUTH_COOKIE_SECURE
AEREALITH_DATABASE_AUTO_MIGRATE
```

Avoid double negatives:

```text
AEREALITH_DISABLE_NO_AUTH
AEREALITH_DONT_USE_SSL
```

Affirmative names reduce interpretation errors.

---

## Negative Boolean Variables

A negative variable may be acceptable when the concept itself is a disablement.

Example:

```text
AEREALITH_TELEMETRY_DISABLED
```

However, the repository should prefer consistent affirmative patterns.

```text
AEREALITH_OBSERVABILITY_ENABLED=false
```

is clearer.

---

## Empty Strings

Empty strings should not silently count as valid values.

Rules:

```text
required string -> reject empty
optional string -> convert empty to undefined when intentional
secret -> reject empty
list -> empty string becomes empty list only when documented
```

Example:

```ts
const OptionalTrimmedStringSchema = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional()
```

---

## Whitespace

String values should normally be trimmed.

Exceptions may include:

```text
cryptographic material
passwords
opaque provider tokens
private keys
```

Do not trim secrets unless the provider format explicitly permits it.

An accidental trailing newline from a secret file may need controlled normalization.

---

## Case Sensitivity

Environment variable values should define case behavior.

Recommended:

```text
environment names: lowercase
boolean values: lowercase
provider names: lowercase
log levels: lowercase
```

Values should not be accepted case-insensitively unless documented.

Strict input reduces ambiguity.

---

## Unicode

Configuration identifiers and provider names should generally use ASCII.

User-facing strings should not be stored in environment variables unless necessary.

Environment variables are a poor configuration channel for localized or rich content.

---

## Maximum Length

Configuration parsers should enforce reasonable maximum lengths.

Examples:

```text
service name: 100 characters
URL: 2,000 characters
provider ID: 200 characters
comma-separated list: bounded count and total length
secret: provider-specific maximum where known
```

This protects diagnostics and parsing from absurd input.

---

## Configuration Generation

The repository may generate documentation and templates from the variable registry.

Potential outputs:

```text
.env.example
deployment variable reference
Kubernetes values reference
Cloudflare binding reference
configuration documentation
```

Generated files should remain deterministic.

---

## Configuration Validation Command

Recommended command:

```bash
pnpm config:validate
```

Potential variants:

```bash
pnpm config:validate --service service-api
pnpm config:validate --environment local
pnpm config:validate --file .env.local
```

The command must redact secrets.

---

## Configuration Documentation Command

Potential command:

```bash
pnpm config:docs
```

This may generate:

```text
variable reference
example environment files
deployment checklists
```

---

## Configuration Diff

A safe configuration diff tool may compare:

```text
variable presence
non-secret values
secret version references
classification
```

It must not print raw secret values.

Potential command:

```bash
pnpm config:diff staging production
```

---

## Configuration Linting

CI should validate:

```text
all referenced variables exist in the registry
all registered variables are documented
all secret variables are classified
no public variable is classified secret
no deprecated variable is newly introduced
no unknown AEREALITH_ variables appear in manifests
```

---

## Secret Scanning

Secret scanning should cover:

```text
source
environment files
Dockerfiles
Compose files
Kubernetes manifests
documentation
test fixtures
generated output
```

Tools may include:

```text
Gitleaks
GitHub secret scanning
Snyk
Semgrep
```

A secret discovered in Git history should be treated as compromised.

---

## Secret Incident Response

When a secret is exposed:

```text
revoke it
rotate it
identify affected systems
review access
remove the value from active files
update deployment systems
document the incident
```

Removing the secret from the latest commit is not enough.

---

## Environment Variable Injection Risks

Environment variables may be visible through:

```text
process inspection
crash dumps
debug tools
container metadata
misconfigured health endpoints
support bundles
child processes
```

Highly sensitive secrets may be safer through:

```text
short-lived credentials
secret files
secret-manager API
workload identity
```

The deployment platform should minimize exposure.

---

## Child Processes

Node.js child processes inherit environment variables by default.

When spawning a process, provide an explicit environment allowlist where practical.

Bad:

```ts
spawn(command, args, {
  env: process.env,
})
```

Preferred:

```ts
spawn(command, args, {
  env: {
    PATH: process.env.PATH,
    AEREALITH_ENVIRONMENT: config.environment,
  },
})
```

Do not expose unrelated secrets to child processes.

---

## Shell History

Avoid commands such as:

```bash
AEREALITH_DISCORD_BOT_TOKEN=secret pnpm dev
```

because shell history or process inspection may expose the value.

Prefer:

```text
ignored local environment file
secret manager
secure prompt
mounted secret file
```

---

## Logging Environment Values

Do not log the entire environment.

Avoid:

```ts
logger.debug('Environment', process.env)
```

Safe configuration summaries must be allowlisted and redacted.

---

## Error Reporting

Error reporters must sanitize:

```text
environment variables
request headers
process state
configuration objects
```

Third-party error-reporting SDKs should not automatically attach the full environment.

---

## Support Bundles

Support or diagnostics bundles may include:

```text
variable names
presence status
non-secret values
secret redaction markers
configuration fingerprint
```

They must not include:

```text
raw secrets
connection strings with credentials
private keys
tokens
cookies
```

---

## Environment Variable Access in AI

AI prompts and AI provider requests must not include raw environment variables.

The AI layer may receive:

```text
provider-neutral capability state
safe configuration flags
public product settings
```

It must not receive:

```text
API keys
database URLs
bot tokens
signing keys
secret-manager references
```

---

## Environment Variable Access in Modules

Modules must not read process environment directly.

Modules receive:

```text
validated module configuration
approved capabilities
safe runtime context
```

This preserves:

```text
least privilege
portability
testability
self-hosting
```

---

## Environment Variable Access in Workflows

Workflow definitions and actions must not embed environment variables.

Workflow execution receives:

```text
validated action input
capabilities
scope
approval
context
```

Provider secrets remain inside adapters.

---

## Environment Variable Access in Frontend

Frontend code may access only approved public variables.

Server-only variables must not be imported into:

```text
client components
browser bundles
public static files
```

Framework server modules should still use centralized server configuration loaders.

---

## Environment Variable Access in Tests

Tests may use synthetic environment maps.

They should not load a developer's full environment unless the test explicitly verifies local configuration loading.

CI tests should isolate variables to the minimum required set.

---

## Environment Variable Access in Scripts

Repository scripts should use validated arguments and configuration.

Scripts must not assume that every application variable exists.

A migration script may require:

```text
database URL
environment
migration mode
```

It should not require Discord or AI variables.

---

## Migration Scripts

Migration scripts must validate the environment target.

They should refuse:

```text
unknown environment
production without explicit approval
unsafe local target
missing database dialect
```

Production migrations should not use local `.env` files.

---

## Release Builds

Release builds should not require runtime secrets.

Build-time configuration should be limited to:

```text
version
commit
public frontend variables where build-time embedding is intentional
```

Runtime secrets should be injected during deployment or startup.

---

## Build-Time Secrets

Avoid using secrets during image or frontend builds.

When unavoidable:

```text
use ephemeral secret mounts
prevent layer persistence
avoid logging
verify image history
```

Do not use Docker `ARG` for long-lived secrets.

---

## Self-Hosting

Self-hosted deployments should receive a complete variable reference.

They should be able to configure:

```text
database
authentication
Discord
email
AI
media
observability
storage
```

Optional providers should remain optional.

A self-hosted deployment should not require Aerealith-managed credentials.

---

## Provider-Neutral Variables

Prefer provider-neutral selection variables.

Example:

```text
AEREALITH_AI_PROVIDER=fake
AEREALITH_NOTIFICATIONS_EMAIL_PROVIDER=resend
AEREALITH_STORAGE_PROVIDER=r2
```

Provider-specific credentials are then validated conditionally.

This supports replacing providers without changing unrelated configuration.

---

## Provider Mode Variables

Some providers may support modes.

Example:

```text
AEREALITH_DISCORD_MODE=disabled
AEREALITH_DISCORD_MODE=fake
AEREALITH_DISCORD_MODE=recorded
AEREALITH_DISCORD_MODE=live-development
AEREALITH_DISCORD_MODE=live-production
```

A mode enum may be clearer than several overlapping booleans.

Avoid contradictory variables such as:

```text
AEREALITH_DISCORD_ENABLED=true
AEREALITH_DISCORD_FAKE=true
AEREALITH_DISCORD_LIVE=true
```

---

## Feature Availability Versus Provider Availability

Separate:

```text
product feature enabled
provider configured
provider healthy
```

Example:

```text
AEREALITH_FEATURE_DISCORD_ENABLED=true
AEREALITH_DISCORD_MODE=live-production
```

Runtime health still determines whether Discord is currently available.

---

## Configuration Compatibility

Configuration changes may be breaking.

Breaking changes include:

```text
renaming variable
changing type
changing units
changing allowed values
changing default
making optional variable required
changing precedence
changing secret classification
```

These require migration documentation.

---

## Configuration Version

A configuration schema version may be introduced.

Example:

```text
AEREALITH_CONFIG_VERSION=1
```

This may help:

```text
self-hosting
deployment validation
major configuration migrations
```

A version should not be added until there is a real compatibility need.

---

## Deprecation Timeline

Recommended deprecation stages:

```text
1. Introduce replacement.
2. Support old and new names temporarily.
3. Warn when old name is used.
4. Fail when both are set.
5. Remove old name in a documented release.
6. Remove stale deployment secrets.
```

---

## Configuration Review

Pull requests adding or changing variables should explain:

```text
purpose
owner
classification
default
required environments
runtime scope
validation
security impact
migration impact
documentation
tests
```

---

## Security Review Triggers

Additional security review is required for variables controlling:

```text
authentication
authorization
sessions
credentials
cryptography
webhooks
CORS
CSRF
rate limits
file uploads
data export
data deletion
audit integrity
break-glass behavior
AI tool access
```

---

## New Variable Checklist

Before adding a variable:

```text
confirm static environment configuration is the right mechanism
choose an AEREALITH_ name
define owner
define classification
define type
define units
define allowed values
define default
define required environments
define runtime scope
add schema validation
add cross-field validation
add documentation
add tests
update .env.example
update deployment manifests
```

---

## Secret Variable Checklist

Before adding a secret variable:

```text
confirm raw environment injection is appropriate
choose a purpose-specific name
classify as secret
define rotation process
define secret-manager location
prevent frontend exposure
add redaction tests
add diagnostic redaction
avoid build-time use
document local-development alternative
```

---

## Removal Checklist

Before removing a variable:

```text
search source and configuration
review all deployment environments
review CI
review Cloudflare
review Docker
review Kubernetes
review secret stores
review self-hosting documentation
remove aliases
remove registry entry
remove stale secrets
add migration note
```

---

## Testing Strategy

Environment-variable testing should include:

```text
schema tests
primitive parser tests
cross-variable tests
environment-policy tests
unknown-variable tests
deprecation tests
secret-redaction tests
frontend-leakage tests
deployment-manifest tests
Docker tests
Kubernetes tests
Cloudflare binding tests
```

Coverage requirement:

```text
80% statements
80% branches
80% functions
80% lines
```

Configuration and secret handling are security-sensitive.

Direct tests are required even when aggregate coverage already passes.

---

## Critical Configuration Tests

Tests must prove:

```text
missing required variables fail startup
invalid booleans fail
invalid integers fail
invalid URLs fail
production requires secure cookies
local development rejects production database targets
real providers require credentials
disabled providers do not require credentials
development bypasses fail in production
unknown AEREALITH_ variables fail in production
secrets do not enter logs
secrets do not enter health responses
secrets do not enter frontend bundles
direct secret and secret-file variables conflict
deprecated variables emit warnings
```

---

## Docker Configuration Tests

Container tests should verify:

```text
runtime configuration can be injected
image contains no secrets
missing required configuration fails clearly
health reflects invalid configuration
environment values are not baked into layers
```

---

## Kubernetes Configuration Tests

Kubernetes validation should verify:

```text
required ConfigMap references exist
required Secret references exist
secret values are not literal in manifests
environment names match the registry
file mounts match configuration paths
production policies are enforced
```

---

## Cloudflare Configuration Tests

Cloudflare tests should verify:

```text
bindings map correctly
secret bindings are required only when providers are enabled
unknown bindings are rejected where practical
public variables remain non-secret
preview and production separation
```

---

## Frontend Build Tests

Frontend tests should verify:

```text
only public prefixes are bundled
server-only variables remain absent
public configuration schema validates
build-time values are documented
runtime configuration endpoint exposes only safe fields
```

---

## Configuration Anti-Patterns

Avoid:

```text
direct process.env access throughout feature code
typing ProcessEnv as if variables always exist
using ambiguous variable names
using unprefixed application variables
committing .env.local
committing production environment files
putting secrets in Dockerfiles
putting secrets in frontend-public variables
logging the entire environment
using wildcard CORS from an environment shortcut
allowing production security controls to be disabled casually
using JSON environment variables for ordinary configuration
making every service require every variable
using several booleans for one provider mode
using empty strings as valid secrets
keeping deprecated variables forever
```

---

## Valid Example

```ts
export const RawWorkerEnvironmentSchema = z.object({
  AEREALITH_ENVIRONMENT: z.enum([
    'local',
    'test',
    'preview',
    'staging',
    'production',
  ]),
  AEREALITH_SERVICE_NAME: z.string().trim().min(1),
  AEREALITH_WORKER_CONCURRENCY: z.string().default('10'),
  AEREALITH_DATABASE_URL: z.string().trim().min(1),
})

export interface WorkerConfig {
  readonly environment: AerealithEnvironment
  readonly serviceName: string
  readonly concurrency: number
  readonly databaseUrl: SecretValue
}

export function loadWorkerConfig(environment: NodeJS.ProcessEnv): WorkerConfig {
  const raw = RawWorkerEnvironmentSchema.parse(environment)

  const concurrency = parseInteger(
    raw.AEREALITH_WORKER_CONCURRENCY,
    'AEREALITH_WORKER_CONCURRENCY',
  )

  if (concurrency < 1 || concurrency > 100) {
    throw new ConfigurationError(
      'AEREALITH_WORKER_CONCURRENCY must be between 1 and 100.',
      'CONFIG_INTEGER_OUT_OF_RANGE',
    )
  }

  return Object.freeze({
    environment: raw.AEREALITH_ENVIRONMENT,
    serviceName: raw.AEREALITH_SERVICE_NAME,
    concurrency,
    databaseUrl: createSecretValue(raw.AEREALITH_DATABASE_URL),
  })
}
```

This example demonstrates:

```text
centralized loading
runtime validation
strict numeric parsing
secret wrapping
immutable configuration
no direct feature access to process.env
```

---

## Invalid Example

```ts
export async function runWorkflow(): Promise<void> {
  const retries = Number(process.env.RETRIES ?? 999)

  const providerKey = process.env.OPENAI_KEY

  console.log(process.env)

  if (process.env.DISABLE_SECURITY !== 'true') {
    // ...
  }

  await executeWithProvider(providerKey!, retries)
}
```

Problems:

```text
unprefixed variables
direct process.env access
unsafe numeric parsing
unbounded retry default
non-null assertion
secret may be missing
environment dump leaks secrets
negative security toggle
provider dependency leaks into feature code
```

---

## File Structure

Recommended configuration tooling structure:

```text
tools/
├── scripts/
│   ├── validate-environment.mjs
│   ├── generate-env-example.mjs
│   ├── generate-config-docs.mjs
│   ├── validate-config-registry.mjs
│   └── detect-frontend-secret-leaks.mjs
└── configuration/
    ├── environment-variables.json
    ├── allowed-public-prefixes.json
    ├── deprecated-variables.json
    └── environment-policies.json
```

Shared code may use:

```text
libs/core/src/configuration/
apps/*/src/config/
```

---

## Recommended Root Scripts

```json
{
  "scripts": {
    "config:validate": "node tools/scripts/validate-environment.mjs",
    "config:docs": "node tools/scripts/generate-config-docs.mjs",
    "config:example": "node tools/scripts/generate-env-example.mjs",
    "config:registry": "node tools/scripts/validate-config-registry.mjs",
    "config:frontend-leaks": "node tools/scripts/detect-frontend-secret-leaks.mjs"
  }
}
```

Exact implementation should be finalized with repository tooling.

---

## Implementation Sequence

Recommended implementation order:

```text
1. Finalize the AEREALITH_ naming standard.
2. Define environment names.
3. Define classification levels.
4. Create the variable registry.
5. Create shared primitive parsers.
6. Create configuration error types.
7. Add service-specific configuration schemas.
8. Restrict direct process.env access.
9. Add frontend-public variable rules.
10. Add .env.example generation.
11. Add unknown-variable detection.
12. Add deprecated-variable handling.
13. Add production policy validation.
14. Add local production-target protection.
15. Add secret wrappers.
16. Add secret redaction tests.
17. Add frontend secret-leak tests.
18. Add Docker validation.
19. Add Kubernetes validation.
20. Add Cloudflare binding validation.
21. Add CI configuration checks.
22. Add configuration documentation generation.
23. Add secret rotation documentation.
24. Add configuration drift fingerprints.
```

---

## Required Decisions

Before this standard is considered stable, Aerealith must finalize:

```text
exact environment names
exact public variable prefixes
environment file precedence
boolean parser behavior
list encoding
JSON variable policy
secret-file precedence
unknown-variable policy
configuration registry format
configuration fingerprint format
secret wrapper implementation
Cloudflare binding conventions
Kubernetes secret conventions
Docker secret conventions
frontend runtime configuration strategy
configuration deprecation timeline
```

---

## Relationship to TypeScript Standards

Environment values begin as untrusted strings.

They must be transformed into typed configuration through runtime schemas.

Ambient `ProcessEnv` declarations do not replace validation.

---

## Relationship to Code Style

Code style requires:

```text
centralized environment access
explicit configuration
clear naming
structured errors
secret-safe logging
```

Direct environment access in feature code violates both code style and configuration ownership.

---

## Relationship to Package Management

Environment variables may configure:

```text
registry authentication
package publishing
build tooling
```

Package-manager credentials remain separate from application configuration.

Application secrets should not be placed in `.npmrc`.

---

## Relationship to Monorepo Rules

Each deployable owns its configuration schema.

Shared configuration utilities may live in core.

Provider-specific variables remain inside provider boundaries.

Frontend projects may consume only public configuration.

---

## Relationship to Dependency Rules

Configuration loaders may depend on runtime environment APIs.

Runtime-neutral domain libraries must not.

Environment access should not create hidden dependencies on:

```text
Node.js
Cloudflare
Docker
Kubernetes
provider SDKs
```

---

## Relationship to Local Development

Local development uses ignored environment files, synthetic credentials, and fake providers.

Production systems and credentials must remain isolated.

---

## Relationship to Security Architecture

Environment variables are part of the secret and configuration trust boundary.

Security requires:

```text
classification
validation
redaction
least privilege
rotation
environment isolation
production safeguards
```

---

## Relationship to Auth Architecture

Authentication variables configure:

```text
session lifetime
cookie behavior
signing
encryption
provider credentials
```

Production-safe authentication invariants must not be optional convenience settings.

---

## Relationship to Integration Architecture

Provider-specific configuration remains inside provider adapters.

Provider enablement and provider credentials are validated together.

Disabled providers must not require secrets.

---

## Relationship to AI Architecture

AI providers are optional.

Real model-provider use requires:

```text
explicit provider selection
development or production credential
cost limit
token limits
capability policy
```

AI must not receive raw configuration secrets as context.

---

## Relationship to Observability Architecture

Observability configuration controls exporters and sampling.

Telemetry configuration must not expose secrets or private data.

Vendor-specific credentials remain inside observability adapters.

---

## Relationship to Self-Hosting

Self-hosted deployments require:

```text
complete variable documentation
safe defaults
optional provider support
portable secret injection
Docker support
Kubernetes support
provider-neutral selection
```

Self-hosted operators should be able to run the core platform without Aerealith-managed secrets.

---

## Success Criteria

The environment-variable standard is successful when:

```text
all application variables use the AEREALITH_ prefix
frontend-public variables use explicit public prefixes
every deployable has a runtime schema
invalid configuration fails before readiness
direct process.env access is restricted
variables have owners
variables have classifications
secrets are never committed
secrets are never logged
secrets are never exposed to browsers
production credentials are not used locally
optional providers validate conditionally
numeric units are explicit
boolean parsing is strict
unknown variables fail in protected environments
deprecated variables have removal plans
Docker images contain no secrets
Kubernetes manifests use secret references
Cloudflare secrets remain secret bindings
configuration is documented and testable
configuration changes remain portable across supported runtimes
```

---

## Final Standard

Aerealith environment variables should create an explicit, typed, secure boundary between deployment systems and application behavior.

The standard is:

> Every Aerealith environment variable uses a stable Aerealith prefix, has a documented owner, type, classification, scope, default, and validation rule, enters the application as untrusted external input, is parsed once through a runtime schema, is converted into immutable typed configuration, and is injected only into components that require it. Secret values must never enter source control, browser bundles, logs, health responses, audit records, telemetry, or unrelated child processes. Production invariants must fail closed, local environments must reject production targets, provider configuration must remain conditional and isolated, deprecated variables must have removal plans, and Cloudflare, Docker, Kubernetes, CI, local development, and self-hosted deployments must all implement the same configuration contract without weakening security or portability.
