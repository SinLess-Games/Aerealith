---
applyTo: '**'
---

# Aerealith Agent Instructions

## Purpose

Aerealith is a TypeScript Nx monorepo for the Aerealith platform.

The platform includes:

- A public website.
- An authenticated web application.
- Documentation.
- A developer portal.
- Backend and edge services.
- Authentication and user services.
- A future modular Discord management platform.
- Shared libraries for domain contracts, validation, configuration, UI, and utilities.

Prioritize simple, maintainable, type-safe code.

Do not over-engineer. Prefer the smallest correct change.

---

## Core Principles

Always follow these rules:

1. Keep changes focused on the assigned issue.
2. Do not rewrite unrelated files.
3. Do not introduce a new dependency unless it is necessary.
4. Do not create cross-library dependencies unless explicitly required.
5. Prefer clear code over clever code.
6. Preserve strict TypeScript safety.
7. Use existing project conventions before introducing new patterns.
8. Never expose secrets, tokens, credentials, private URLs, or environment values.
9. Do not modify generated files unless the task explicitly requires it.
10. Do not manually edit `pnpm-lock.yaml`.

---

## Repository Structure

The repository is an Nx monorepo managed with pnpm.

Typical structure:

```text
apps/
  frontend/
  services/
    auth/
    user/
    discord/

libs/
  core/
  db/
  api/
  ui/
  utils/
  config/
  flags/

.github/
  config/
  instructions/
  workflows/
  ISSUE_TEMPLATE/
  PULL_REQUEST_TEMPLATE/
```

Use `pnpm` for all package-management commands.

Do not use:

```text
npm
yarn
bun
```

unless the task explicitly requires them.

---

## Library Dependency Rules

Keep library dependencies minimal.

The primary rule is:

```text
libs/* may depend on libs/core.
libs/* should not depend on other libs unless explicitly approved.
```

Examples:

```text
libs/api -> libs/core
libs/db -> libs/core
libs/ui -> libs/core
libs/utils -> libs/core
```

Avoid:

```text
libs/api -> libs/db
libs/ui -> libs/api
libs/flags -> libs/config
libs/utils -> libs/db
```

When shared code is needed by multiple libraries, move it into `libs/core` instead of creating a chain of library dependencies.

---

## Core Library Ownership

`libs/core` owns shared platform concepts.

Prefer placing reusable platform concerns in the appropriate Core location:

```text
libs/core/src/constants/
libs/core/src/contracts/
libs/core/src/errors/
libs/core/src/schemas/
libs/core/src/types/
libs/core/src/utils/
libs/core/src/configs/
```

Use Core for:

- Shared domain types.
- Shared interfaces.
- Shared validation contracts.
- Error codes.
- Error classes.
- Constants.
- Cross-service schemas.
- Reusable pure utilities.

Do not duplicate shared types inside applications or services.

---

## TypeScript Rules

Use strict TypeScript.

Always:

- Prefer `type` aliases for unions and object shapes.
- Prefer `interface` only when extension is useful.
- Use `unknown` instead of `any`.
- Narrow unknown values before use.
- Use explicit return types for exported functions.
- Use `import type` for type-only imports.
- Use named exports unless a framework requires a default export.
- Keep public API types readable and stable.
- Use readonly values where mutation is not needed.

Avoid:

```ts
any
as unknown as SomeType
@ts-ignore
@ts-nocheck
eslint-disable
```

Do not suppress compiler or lint failures unless there is a documented, unavoidable reason.

---

## Validation and Schemas

Use Zod for runtime validation where validation is required.

Rules:

- Validate untrusted input at boundaries.
- Keep schemas close to the contract they validate.
- Infer TypeScript types from schemas when practical.
- Do not duplicate the same validation rules in multiple services.
- Put reusable schemas in `libs/core`.
- Keep service-specific request parsing inside the relevant service.

Use clear schema names:

```ts
CreateUserSchema
UpdateUserProfileSchema
AuthenticationTokenSchema
UserConsentSchema
```

Avoid vague names:

```ts
DataSchema
InputSchema
PayloadSchema
ThingSchema
```

---

## Error Handling

Use Aerealith error types and error codes from `libs/core`.

Always:

- Use an appropriate error code.
- Return safe user-facing messages.
- Preserve useful internal context for logs.
- Avoid exposing database, token, infrastructure, or stack details to users.
- Use typed errors where possible.

Do not create random string-based errors when an Aerealith error code already exists.

Avoid:

```ts
throw new Error('Something failed')
```

Prefer the project error system.

---

## Database Rules

Database work is high-risk.

When changing database code:

- Keep entities, schemas, repositories, migrations, and contracts consistent.
- Do not change database schemas casually.
- Do not alter existing migrations after they have been applied.
- Create a new migration for schema changes.
- Validate migration behavior before opening a pull request.
- Do not make destructive schema changes without an explicit issue requirement.
- Treat user, authentication, consent, and permission data as sensitive.

Database migrations, auth data, and production persistence changes require human review.

---

## Authentication and User Rules

Authentication, authorization, session, token, consent, and user data are sensitive.

Do not:

- Log passwords.
- Log raw access tokens.
- Log refresh tokens.
- Log session secrets.
- Return sensitive account details in API responses.
- Bypass authorization checks.
- Add insecure fallback authentication behavior.
- Auto-merge authentication or authorization changes.

For auth and user work:

- Validate all input.
- Verify authorization at the service boundary.
- Use least-privilege defaults.
- Avoid leaking whether an account exists when that would be sensitive.
- Keep error messages safe for users.
- Add or update tests for security-relevant behavior.

---

## Frontend and UI Rules

For frontend work:

- Use existing shared components from `libs/ui` when available.
- Keep page-specific UI inside the frontend app.
- Do not duplicate shared UI primitives.
- Preserve accessibility.
- Use semantic HTML.
- Ensure keyboard navigation works.
- Add useful labels for form inputs and interactive controls.
- Do not use inaccessible icon-only controls without labels.
- Keep visual behavior responsive.

For any user-visible UI change:

- Add or update tests where practical.
- Include screenshots or recordings in the pull request.
- Mention accessibility considerations in the pull request body.

---

## API and Service Rules

Services should remain independently understandable and deployable.

Always:

- Keep routes versioned where the existing API convention requires it.
- Validate request input.
- Return typed, predictable responses.
- Keep transport concerns separate from domain logic.
- Keep business logic out of route handlers when it becomes reusable.
- Add tests for public endpoint changes.
- Update documentation for API contract changes.

Do not mix unrelated transport styles in one endpoint.

Use the established conventions for:

```text
HTTP
tRPC
GraphQL
WebSocket
```

Do not introduce a new API transport unless the task explicitly requires it.

---

## Discord Platform Rules

The Discord service is intended to be modular and independently configurable per server.

When working on Discord features:

- Keep modules independently enableable and disableable.
- Do not hardcode server-specific behavior.
- Validate Discord permissions before sensitive actions.
- Treat moderation, role, ticket, and transcript data as sensitive.
- Log audit-worthy actions safely.
- Avoid destructive moderation actions without confirmation or explicit policy.
- Keep Discord commands, events, services, and persistence concerns separated.

Discord permission, moderation, ticket access, and anti-abuse changes require human review.

---

## Configuration Rules

Use configuration through the existing configuration system.

Do not:

- Hardcode secrets.
- Hardcode production URLs.
- Hardcode ports outside approved configuration.
- Add hidden environment variables.
- Read environment variables throughout the codebase.

Prefer centralized configuration in the appropriate config module.

Document new environment variables with:

- Variable name.
- Purpose.
- Required or optional status.
- Safe example value.
- Development behavior.
- Production behavior.

---

## Dependency Rules

Use dependency automation for dependency updates.

Dependency pull requests may come from:

```text
Mend Renovate
Mend remediation
Dependabot
```

Do not manually modify dependency versions unless the task explicitly requires it.

When dependency changes are required:

1. Update the package manifest.
2. Run the approved pnpm install command.
3. Let pnpm update the lockfile.
4. Run relevant validation.
5. Follow `.github/config/dependency-policy.yaml`.

Never auto-merge:

- Major dependency updates.
- Authentication dependencies.
- Database dependencies.
- Cloudflare dependencies.
- Nx dependencies.
- TypeScript dependencies.
- CI dependencies.
- Infrastructure dependencies.
- Security remediation without human review.

---

## GitHub Automation Rules

The files in `.github/config/` are the source of truth for repository automation.

Do not duplicate or hardcode their policies inside workflows.

Read the relevant configuration before changing automation:

```text
.github/config/labels.yaml
.github/config/milestones.yaml
.github/config/project.yaml
.github/config/reviewers.yaml
.github/config/routing.yaml
.github/config/workers.yaml
.github/config/dependency-policy.yaml
```

When changing GitHub workflows:

- Use least-privilege permissions.
- Do not run untrusted pull request code in privileged contexts.
- Do not add repository write permissions unless required.
- Do not add secrets to workflow logs.
- Do not use `pull_request_target` to check out or execute pull request code.
- Keep workflow names and job names stable when they are required checks.
- Preserve existing branch-protection assumptions.

---

## Issue and Pull Request Rules

For Issues:

- Keep scope clear.
- Include acceptance criteria where implementation work is expected.
- Mark high-risk work for human triage.
- Do not assign AI workers to unclear issues.
- Use existing labels and milestones only.

For Pull Requests:

- Follow the configured Conventional Commit title format.
- Link the related issue when required.
- Keep the PR focused.
- Explain behavior changes.
- Document validation performed.
- Include screenshots for frontend or UI changes.
- Do not include secrets or sensitive user data.
- Do not merge your own work without required review.

Use explicit issue-closing syntax only when appropriate:

```text
Closes #123
Fixes #123
Resolves #123
```

Do not close issues based only on semantic similarity.

---

## Testing and Validation

Before completing work, run the narrowest relevant checks first.

Use the workspace tooling where available.

Typical validation order:

```bash
pnpm install --frozen-lockfile
pnpm nx affected -t lint --base=origin/master --head=HEAD
pnpm nx affected -t typecheck --base=origin/master --head=HEAD
pnpm nx affected -t test --base=origin/master --head=HEAD
pnpm nx affected -t build --base=origin/master --head=HEAD
```

Before running broad commands:

- Confirm the target exists.
- Confirm the base branch is available locally.
- Use the smallest affected scope when practical.
- Do not claim a command passed unless it actually passed.
- Report commands that could not be run and why.

For focused validation, prefer:

```bash
pnpm nx lint <project-name>
pnpm nx typecheck <project-name>
pnpm nx test <project-name>
pnpm nx build <project-name>
```

Do not skip tests just because a change looks small.

---

## Working With Existing Changes

Before modifying code:

```bash
git status --short
git diff --stat
```

Respect existing user work.

Do not:

```text
git reset --hard
git clean -fd
git checkout -- .
git restore .
git push --force
```

unless the task explicitly requires it and the user clearly approves it.

Do not overwrite unrelated modifications.

---

## Documentation Rules

Update documentation when changes affect:

- Public behavior.
- API contracts.
- Environment configuration.
- Deployment.
- Authentication or user flows.
- Developer onboarding.
- Required commands.
- Dependency or security policy.
- User-visible workflows.

Keep documentation practical, current, and specific.

Avoid placeholder documentation that does not explain how to use the feature.

---

## Implementation Workflow

For every task:

1. Read the relevant files before changing them.
2. Check for existing patterns and conventions.
3. Make the smallest complete change.
4. Keep shared concepts in `libs/core`.
5. Add or update tests.
6. Run relevant validation.
7. Update documentation when behavior changed.
8. Review the final diff for accidental changes.
9. State exactly what changed and which validation passed or failed.

Do not silently expand scope.

When requirements are unclear, preserve existing behavior and make the safest reasonable implementation decision.

---

## Final Review Checklist

Before opening or updating a pull request, verify:

- No unrelated files changed.
- No secrets or private data were added.
- No unnecessary dependencies were introduced.
- No cross-library dependency rule was violated.
- TypeScript remains strict.
- Relevant tests were added or updated.
- Relevant lint, typecheck, test, and build checks were run.
- Documentation is updated or intentionally unchanged.
- UI changes include visual evidence.
- High-risk work has human review labels.
- Dependency work follows `dependency-policy.yaml`.
- Pull request title follows the configured Conventional Commit format.
