import { describe, expect, it, vi } from 'vitest';

import {
  AuthorizationService,
  InMemoryAuthorizationRepository,
  type EffectiveAuthorization,
  type Permission,
  type Role,
} from '@aerealith-ai/authorization';

import type { ApiEnv } from '../app/api-env.type';
import { createApiApp } from '../app/create-api-app';
import type { AuthorizationApiContext } from './authorization-api-context.interface';
import { requireGraphqlPermission } from '../transports/graphql';
import { requirePermission } from '../transports/http';
import { createTrpcAuthorizationMiddleware } from '../transports/trpc';
import { requireWebSocketPermission } from '../transports/websocket';
import { createTestApiContext } from '../testing/create-test-api-context';
import { TestLogger } from '../testing/test-logger';

describe('authorization transport adapters', () => {
  it('enforces HTTP permissions and returns a public-safe forbidden response', async () => {
    const context = createContext(false);
    const app = createApiApp<ApiEnv<AuthorizationApiContext>>({
      serviceName: 'test',
      logger: new TestLogger(),
      createContext: () => context,
    });
    app.get('/protected', requirePermission('projects.read'), (honoContext) =>
      honoContext.json({ ok: true }),
    );

    const response = await app.request('/protected');
    expect(response.status).toBe(403);
  });

  it('allows HTTP, tRPC, GraphQL, and WebSocket when the same service grants access', async () => {
    const context = createContext(true);
    const app = createApiApp<ApiEnv<AuthorizationApiContext>>({
      serviceName: 'test',
      logger: new TestLogger(),
      createContext: () => context,
    });
    app.get('/protected', requirePermission('projects.read'), (honoContext) =>
      honoContext.json({ ok: true }),
    );
    expect((await app.request('/protected')).status).toBe(200);

    const next = vi.fn(async () => 'next');
    await expect(
      createTrpcAuthorizationMiddleware('projects.read')({
        ctx: context,
        next,
      }),
    ).resolves.toBe('next');
    expect(next).toHaveBeenCalledOnce();
    await expect(
      requireGraphqlPermission(context, 'projects.read'),
    ).resolves.toBeUndefined();
    await expect(
      requireWebSocketPermission(context, 'projects.read'),
    ).resolves.toBeUndefined();
  });

  it.each([
    [
      'tRPC',
      (context: AuthorizationApiContext) =>
        createTrpcAuthorizationMiddleware('projects.read')({
          ctx: context,
          next: async () => undefined,
        }),
    ],
    [
      'GraphQL',
      (context: AuthorizationApiContext) =>
        requireGraphqlPermission(context, 'projects.read'),
    ],
    [
      'WebSocket',
      (context: AuthorizationApiContext) =>
        requireWebSocketPermission(context, 'projects.read'),
    ],
  ])('fails closed for the %s adapter', async (_transport, guard) => {
    await expect(guard(createContext(false))).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
      message: 'Forbidden',
    });
  });
});

function createContext(allowed: boolean): AuthorizationApiContext {
  const principal = { id: 'user-1', type: 'user' } as const;
  const repository = new InMemoryAuthorizationRepository();
  const permission = createPermission();
  repository.permissions.set(permission.key, permission);
  repository.authorizations.set(
    principal.id,
    createEffectiveAuthorization(allowed),
  );
  return {
    ...createTestApiContext({ principal }),
    principal,
    authorization: new AuthorizationService({ repository }),
  };
}

function createEffectiveAuthorization(
  allowed: boolean,
): EffectiveAuthorization {
  const date = new Date(0);
  const principal = { id: 'user-1', type: 'user' } as const;
  const role: Role = {
    id: 'role-1',
    key: 'member',
    displayName: 'Member',
    system: false,
    assignable: true,
    administrativeRank: 0,
    enabled: true,
    createdAt: date,
    updatedAt: date,
  };
  return {
    principal,
    version: 1,
    assignments: allowed
      ? [
          {
            id: 'assignment-1',
            principal,
            roleId: role.id,
            scope: { type: 'global' },
            assignedBy: 'admin',
            assignedAt: date,
            metadata: {},
          },
        ]
      : [],
    roles: [role],
    permissionsByRole: { [role.id]: [createPermission()] },
    parentRoleIdsByRole: {},
  };
}

function createPermission(): Permission {
  const date = new Date(0);
  return {
    id: 'permission-1',
    key: 'projects.read',
    resource: 'projects',
    action: 'read',
    displayName: 'Read projects',
    system: true,
    enabled: true,
    createdAt: date,
    updatedAt: date,
  };
}
