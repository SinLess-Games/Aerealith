# Authentication, Session, and RBAC E2E Tests

This Nx project has two deliberately separate modes:

- `mock` runs the existing public-site and mocked-browser coverage in Chromium,
  Firefox, and WebKit. It never connects to a database.
- `local` and `preview` run the `src/specs` auth-security suite against real
  frontend, auth, API, PostgreSQL, session-cookie, GraphQL, and tRPC paths.

The live suite covers successful and failed login, signup defaults, email
verification, password reset, logout and replay, multiple-session revocation,
session expiry, account lifecycle states, normalized RBAC, privilege-escalation
attempts, CORS/origin enforcement, rate limiting, and transport parity.

## Mock suite

```bash
pnpm nx run frontend-e2e:e2e --configuration=mock
```

The mock configuration is the safe default and is suitable for pull requests
that do not have an isolated PostgreSQL service.

## Local live-auth suite

Start with a disposable PostgreSQL database whose name contains `e2e`, `test`,
`preview`, or `dev`. Apply the current migrations and seed the platform-owner
account using the repository's normal database targets. Then export:

```bash
export E2E_DATABASE_URL='postgresql://USER:PASSWORD@localhost:5432/aerealith_e2e'
export E2E_PLATFORM_OWNER_EMAIL='owner@example.invalid'
export E2E_PLATFORM_OWNER_PASSWORD='replace-with-the-seeded-owner-password'
export E2E_ALLOW_DATABASE_MUTATION='true'
pnpm nx run frontend-e2e:e2e --configuration=local
```

For local runs, Nx loads the ignored root `.env`. When that file already
contains the isolated database and seeded owner, local mode also accepts
`DATABASE_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` directly. Only the mutation
opt-in is then needed:

```bash
export E2E_ALLOW_DATABASE_MUTATION='true'
pnpm nx run frontend-e2e:e2e --configuration=local
```

The database-name safety check still requires `e2e`, `test`, `preview`, or
`dev`. Preview mode deliberately does not use these local fallbacks.

The Playwright configuration builds and previews the frontend and starts the
auth/API Workers through their Nx `dev-e2e` targets. Local mode only accepts
`localhost` or `127.0.0.1` URLs. Optional overrides are:

```bash
export E2E_BASE_URL='http://localhost:4200'
export E2E_AUTH_URL='http://localhost:8787'
export E2E_API_URL='http://localhost:8788'
```

Do not put credentials in tracked files or command arguments. Supply them from
the shell or the CI secret manager. The suite never prints passwords, tokens,
cookie values, or database URLs. Network traces are disabled for live-auth
tests because traces can retain request bodies; failure screenshots and video
remain enabled.

## Isolated preview suite

Preview mode does not start servers. All three URLs must use HTTPS, known
production hosts are rejected, the database must have a non-production marker,
and both mutation switches are required:

```bash
export E2E_TARGET='preview'
export E2E_BASE_URL='https://web.auth-e2e.example.invalid'
export E2E_AUTH_URL='https://auth.auth-e2e.example.invalid'
export E2E_API_URL='https://api.auth-e2e.example.invalid'
export E2E_DATABASE_URL='postgresql://USER:PASSWORD@HOST/aerealith_preview'
export E2E_PLATFORM_OWNER_EMAIL='owner@example.invalid'
export E2E_PLATFORM_OWNER_PASSWORD='replace-with-preview-secret'
export E2E_ALLOW_DATABASE_MUTATION='true'
export E2E_ALLOW_REMOTE_MUTATION='true'
pnpm nx run frontend-e2e:e2e --configuration=preview
```

Never point preview mode at production. Host, protocol, database-name, and
explicit-mutation checks fail during Playwright configuration before a test or
fixture can write data.

## Fixture lifecycle and cleanup

The worker-scoped fixture authenticates through the real platform-owner login
endpoint. Every test user is then created through the real admin API with a
random `e2e_` username and an `@e2e.aerealith.invalid` email address. Database
helpers will mutate only records carrying both the current run marker and the
E2E email/username markers.

Cleanup runs even after a failed test. It deletes only users created by that
worker and refuses to delete a user with a platform-owner assignment. The live
suite uses one worker to keep rate-limit state and database mutation order
deterministic.

## Focused debugging

Pass Playwright arguments after `--`:

```bash
pnpm nx run frontend-e2e:e2e --configuration=local -- --headed
pnpm nx run frontend-e2e:e2e --configuration=local -- src/specs/auth/session.spec.ts
pnpm nx run frontend-e2e:e2e --configuration=mock -- --project=chromium
pnpm nx run frontend-e2e:typecheck
pnpm nx run frontend-e2e:lint
```

Use Playwright's inspector only on a trusted workstation; live requests can be
visible while debugging. Reports and failure artifacts are written beneath
`dist/.playwright/apps/e2e/frontend-e2e/` and are already collected by the
repository CI workflow.

## CI requirements

The current general E2E job can continue running the default mock suite. A
live-auth CI job additionally needs:

- an isolated, migrated PostgreSQL service;
- a seeded platform-owner account;
- `E2E_DATABASE_URL`, `E2E_PLATFORM_OWNER_EMAIL`, and
  `E2E_PLATFORM_OWNER_PASSWORD` as masked secrets;
- `E2E_ALLOW_DATABASE_MUTATION=true`;
- `--configuration=local` when services run in the job, or the HTTPS preview
  URLs plus `E2E_ALLOW_REMOTE_MUTATION=true` for an isolated preview stack.

CI must install the Chromium browser used by the auth-security project. The
mock matrix additionally requires Firefox and WebKit.
