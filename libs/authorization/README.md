# Aerealith Authorization

`@aerealith-ai/authorization` is the transport-neutral, fail-closed
authorization domain for Aerealith. Authentication establishes who a
principal is; this library decides whether that user or service principal may
perform one exact permission in one scope.

## Decision flow

Every protected operation follows the same path:

1. Resolve the authenticated `AuthorizationPrincipal`.
2. Request an exact permission key such as `projects.update`.
3. Resolve the requested global, organization, workspace, project, Discord
   guild, or resource scope.
4. Load versioned effective authorization from the authoritative repository.
5. Reject revoked or expired assignments, scope mismatches, disabled records,
   corrupt hierarchies, missing permissions, and unavailable persistence.
6. Apply optional contextual policies and return a structured decision.

There is no implicit allow, wildcard permission, string-prefix matching, or
role-name check at the transport boundary.

## Usage

```ts
const decision = await authorization.can({
  principal: { id: user.id, type: 'user' },
  permission: 'projects.update',
  scope: { type: 'project', id: project.id },
  resource: { ownerId: project.ownerId },
});

if (!decision.allowed) {
  throw new Error('Forbidden');
}
```

Use `require()` when a domain service wants a throwing guard, or the adapters
from `@aerealith-ai/api-platform` for HTTP, tRPC, GraphQL, and WebSocket
boundaries.

## Role and scope model

- Permissions are stable, lower-case, namespaced keys.
- Roles group permissions and may inherit parent roles.
- A principal receives a role through a revocable, optionally expiring,
  scope-bound assignment.
- Global assignments match every scope. Non-global assignments match only the
  same scope type and identifier unless an explicit scope matcher is supplied.
- Hierarchy cycles, unknown hierarchy nodes, and excessive depth fail closed.
- Normalized assignments are authoritative. The legacy `users.role` column is
  only a compatibility projection and must never authorize a request.

System roles are `user`, `support_agent`, `security_administrator`,
`platform_administrator`, `platform_owner`, and `service`. The platform-owner
role is protected from direct management and the final active owner cannot be
revoked.

## Caching and invalidation

Cache keys include principal type, principal ID, and the database-backed
authorization version. Assignment mutations run in a transaction, increment
that version, and invalidate the principal cache. Cache failures fall back to
the repository; persistence failures deny access.

## Auditing

The service publishes structured authorization events without exposing
sensitive internals to clients. Denials, role changes, permission changes,
assignment changes, conflicts, and escalation prevention have dedicated event
types. Production callers should connect `AuthorizationEventPublisher` to the
shared observability/audit pipeline.

## Adding permissions safely

1. Add the exact key to `SYSTEM_PERMISSION_KEYS`.
2. Add the permission idempotently to a migration.
3. Grant it only to the minimum required seeded roles.
4. Protect every relevant transport boundary with the same key and scope.
5. Add allow, deny, missing-principal, and scope tests.

Never reuse a permission merely because its name is close to the operation.

## Validation

```bash
pnpm nx test authorization
pnpm nx run authorization:build
pnpm nx run api-platform:typecheck
pnpm nx test api-platform
pnpm nx test db
pnpm nx test service-auth
pnpm nx run db:postgres-migrate
```
