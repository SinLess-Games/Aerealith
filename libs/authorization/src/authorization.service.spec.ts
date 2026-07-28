import { describe, expect, it, vi } from 'vitest';

import { AuthorizationService } from './authorization.service';
import { AuthorizationDeniedError } from './errors';
import type {
  EffectiveAuthorization,
  Permission,
  Role,
  RoleAssignment,
} from './models';
import {
  InMemoryAuthorizationCache,
  InMemoryAuthorizationRepository,
} from './testing';

const principal = { id: 'user-1', type: 'user' } as const;
const now = new Date('2026-07-28T12:00:00.000Z');

describe('AuthorizationService', () => {
  it('denies missing principals and unknown permissions by default', async () => {
    const repository = new InMemoryAuthorizationRepository();
    const service = new AuthorizationService({ repository });

    await expect(
      service.can({
        principal: undefined,
        permission: 'projects.read',
        scope: { type: 'global' },
      }),
    ).resolves.toMatchObject({ allowed: false, reason: 'principal_missing' });
    await expect(
      service.can({
        principal,
        permission: 'projects.read',
        scope: { type: 'global' },
      }),
    ).resolves.toMatchObject({ allowed: false, reason: 'permission_missing' });
  });

  it('grants exact direct and inherited permissions in matching scopes', async () => {
    const repository = configuredRepository();
    const service = new AuthorizationService({ repository, now: () => now });

    await expect(
      service.can({
        principal,
        permission: 'projects.read',
        scope: { type: 'project', id: 'project-1' },
      }),
    ).resolves.toMatchObject({ allowed: true, reason: 'permission_granted' });

    repository.permissions.set(
      'projects.update',
      permission('permission-update', 'projects.update'),
    );
    repository.authorizations.set(
      principal.id,
      effective({
        permissionsByRole: {
          parent: [permission('permission-update', 'projects.update')],
        },
        parentRoleIdsByRole: { member: ['parent'] },
        roles: [role('member'), role('parent')],
      }),
    );
    await expect(
      service.can({
        principal,
        permission: 'projects.update',
        scope: { type: 'project', id: 'project-1' },
      }),
    ).resolves.toMatchObject({ allowed: true });
  });

  it.each([
    ['revoked assignment', { revokedAt: now }, 'assignment_revoked'],
    [
      'expired assignment',
      { expiresAt: new Date('2026-07-28T11:59:59.000Z') },
      'assignment_expired',
    ],
  ])('denies a %s', async (_name, assignmentChange, reason) => {
    const repository = configuredRepository();
    repository.authorizations.set(
      principal.id,
      effective({ assignmentChange }),
    );
    const service = new AuthorizationService({ repository, now: () => now });
    await expect(decide(service)).resolves.toMatchObject({
      allowed: false,
      reason,
    });
  });

  it('denies scope mismatches, disabled roles, and disabled permissions', async () => {
    const repository = configuredRepository();
    const service = new AuthorizationService({ repository, now: () => now });
    await expect(
      service.can({
        principal,
        permission: 'projects.read',
        scope: { type: 'project', id: 'project-2' },
      }),
    ).resolves.toMatchObject({ reason: 'scope_mismatch' });

    repository.authorizations.set(
      principal.id,
      effective({ roles: [role('member', false)] }),
    );
    await expect(decide(service)).resolves.toMatchObject({ allowed: false });

    repository.permissions.set(
      'projects.read',
      permission('permission-read', 'projects.read', false),
    );
    await expect(decide(service)).resolves.toMatchObject({
      reason: 'permission_disabled',
    });
  });

  it('fails closed for repository failures and corrupt role cycles', async () => {
    const repository = configuredRepository();
    repository.unavailable = true;
    const service = new AuthorizationService({ repository, now: () => now });
    await expect(decide(service)).resolves.toMatchObject({
      reason: 'authorization_unavailable',
    });

    repository.unavailable = false;
    repository.authorizations.set(
      principal.id,
      effective({
        roles: [role('member'), role('parent')],
        parentRoleIdsByRole: { member: ['parent'], parent: ['member'] },
      }),
    );
    await expect(decide(service)).resolves.toMatchObject({
      reason: 'authorization_unavailable',
    });
  });

  it('supports versioned cache, any/all checks, and throwing guards', async () => {
    const repository = configuredRepository();
    const cache = new InMemoryAuthorizationCache();
    const service = new AuthorizationService({ repository, cache });
    expect((await decide(service)).allowed).toBe(true);
    expect([...cache.values.keys()]).toEqual(['authorization:user:user-1:v1']);
    await expect(
      service.canAny({
        principal,
        permissions: ['projects.delete', 'projects.read'],
        scope: { type: 'project', id: 'project-1' },
      }),
    ).resolves.toMatchObject({ allowed: true });
    await expect(
      service.canAll({
        principal,
        permissions: ['projects.read', 'projects.delete'],
        scope: { type: 'project', id: 'project-1' },
      }),
    ).resolves.toMatchObject({ allowed: false });
    await expect(
      service.require({
        principal,
        permission: 'projects.delete',
        scope: { type: 'global' },
      }),
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);
  });

  it('ignores stale cache entries and survives cache failures', async () => {
    const repository = configuredRepository();
    const cache = {
      get: vi.fn(async () => ({ ...effective(), version: 0 })),
      set: vi.fn(async () => Promise.reject(new Error('cache unavailable'))),
      deleteByPrincipal: vi.fn(async () => undefined),
    };
    const service = new AuthorizationService({ repository, cache });
    await expect(decide(service)).resolves.toMatchObject({ allowed: true });
    expect(cache.get).toHaveBeenCalledWith('authorization:user:user-1:v1');
  });
});

function configuredRepository(): InMemoryAuthorizationRepository {
  const repository = new InMemoryAuthorizationRepository();
  repository.permissions.set(
    'projects.read',
    permission('permission-read', 'projects.read'),
  );
  repository.authorizations.set(principal.id, effective());
  return repository;
}

function decide(service: AuthorizationService) {
  return service.can({
    principal,
    permission: 'projects.read',
    scope: { type: 'project', id: 'project-1' },
  });
}

function effective(
  changes: {
    assignmentChange?: Partial<RoleAssignment>;
    roles?: readonly Role[];
    permissionsByRole?: EffectiveAuthorization['permissionsByRole'];
    parentRoleIdsByRole?: EffectiveAuthorization['parentRoleIdsByRole'];
  } = {},
): EffectiveAuthorization {
  return {
    principal,
    version: 1,
    assignments: [
      {
        id: 'assignment-1',
        principal,
        roleId: 'member',
        scope: { type: 'project', id: 'project-1' },
        assignedBy: 'admin',
        assignedAt: now,
        metadata: {},
        ...changes.assignmentChange,
      },
    ],
    roles: changes.roles ?? [role('member')],
    permissionsByRole: changes.permissionsByRole ?? {
      member: [permission('permission-read', 'projects.read')],
    },
    parentRoleIdsByRole: changes.parentRoleIdsByRole ?? {},
  };
}

function permission(id: string, key: string, enabled = true): Permission {
  const [resource = '', action = ''] = key.split('.');
  return {
    id,
    key,
    resource,
    action,
    displayName: key,
    system: true,
    enabled,
    createdAt: now,
    updatedAt: now,
  };
}

function role(id: string, enabled = true): Role {
  return {
    id,
    key: id,
    displayName: id,
    system: false,
    assignable: true,
    administrativeRank: 0,
    enabled,
    createdAt: now,
    updatedAt: now,
  };
}
