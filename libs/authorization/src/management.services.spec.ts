import { describe, expect, it, vi } from 'vitest';

import type {
  AuthorizationCache,
  AuthorizationManagementRepository,
} from './contracts';
import {
  LastAdministratorError,
  PrivilegeEscalationError,
  ProtectedRoleError,
  RoleAssignmentConflictError,
  RoleHierarchyCycleError,
} from './errors';
import {
  DefaultRoleAssignmentPolicy,
  PermissionManagementService,
  RoleAssignmentService,
  RoleHierarchyService,
  RoleManagementService,
} from './management.services';
import type { Role } from './models';
import { FakeAuthorizationEventPublisher } from './testing';

const actor = { id: 'admin-1', type: 'user' } as const;
const target = { id: 'user-1', type: 'user' } as const;

describe('authorization management', () => {
  it('authorizes role creation and rejects unauthorized management', async () => {
    const repository = repositoryStub({
      createRole: vi.fn(async (input) => role({ ...input })),
    });
    const events = new FakeAuthorizationEventPublisher();
    const authorized = new RoleManagementService(
      repository,
      allowGuard(),
      events,
    );
    await expect(
      authorized.create(actor, {
        key: 'reviewer',
        displayName: 'Reviewer',
        system: false,
        assignable: true,
        administrativeRank: 5,
        enabled: true,
      }),
    ).resolves.toMatchObject({ key: 'reviewer' });
    expect(events.events[0]?.type).toBe('authorization.role.created');

    const denied = new RoleManagementService(
      repository,
      { require: vi.fn(async () => Promise.reject(new Error('Forbidden'))) },
      events,
    );
    await expect(
      denied.create(actor, {
        key: 'denied',
        displayName: 'Denied',
        system: false,
        assignable: true,
        administrativeRank: 0,
        enabled: true,
      }),
    ).rejects.toThrow('Forbidden');
  });

  it('manages custom permissions but protects system permissions', async () => {
    const repository = repositoryStub({
      createPermission: vi.fn(async (input) => ({
        id: 'permission-custom',
        createdAt: new Date(0),
        updatedAt: new Date(0),
        ...input,
      })),
      findPermissionByKey: vi.fn(async () => ({
        id: 'permission-system',
        key: 'users.read',
        resource: 'users',
        action: 'read',
        displayName: 'Read users',
        system: true,
        enabled: true,
        createdAt: new Date(0),
        updatedAt: new Date(0),
      })),
    });
    const service = new PermissionManagementService(repository, allowGuard());
    await expect(
      service.create(actor, {
        key: 'reviews.read',
        resource: 'reviews',
        action: 'read',
        displayName: 'Read reviews',
        system: false,
        enabled: true,
      }),
    ).resolves.toMatchObject({ key: 'reviews.read' });
    await expect(
      service.update(actor, 'users.read', { enabled: false }),
    ).rejects.toBeInstanceOf(ProtectedRoleError);
  });

  it('prevents self-escalation, rank escalation, and protected role assignment', () => {
    const policy = new DefaultRoleAssignmentPolicy();
    expect(() =>
      policy.assertCanAssign({
        actor,
        target: actor,
        role: role(),
        scope: { type: 'global' },
        actorMaximumAdministrativeRank: 100,
        selfAssignmentAllowed: false,
        canManageSystemRoles: true,
      }),
    ).toThrow(PrivilegeEscalationError);
    expect(() =>
      policy.assertCanAssign({
        actor,
        target,
        role: role({ administrativeRank: 101 }),
        scope: { type: 'global' },
        actorMaximumAdministrativeRank: 100,
        selfAssignmentAllowed: false,
        canManageSystemRoles: true,
      }),
    ).toThrow(PrivilegeEscalationError);
    expect(() =>
      policy.assertCanAssign({
        actor,
        target,
        role: role({ system: true }),
        scope: { type: 'global' },
        actorMaximumAdministrativeRank: 100,
        selfAssignmentAllowed: false,
        canManageSystemRoles: false,
      }),
    ).toThrow(ProtectedRoleError);
  });

  it('rejects hierarchy cycles before persistence', async () => {
    const repository = repositoryStub({
      findRoleById: vi.fn(async (id: string) => role({ id })),
      getParentRoleIds: vi.fn(async (id: string) =>
        id === 'parent' ? ['child'] : [],
      ),
    });
    const service = new RoleHierarchyService(repository, allowGuard());
    await expect(
      service.addParent(actor, 'child', 'parent'),
    ).rejects.toBeInstanceOf(RoleHierarchyCycleError);
    expect(repository.addRoleParent).not.toHaveBeenCalled();
  });

  it('rejects duplicate and conflicting active assignments', async () => {
    const duplicateRepository = repositoryStub({
      findAssignments: vi.fn(async () => [assignment({ roleId: 'role-1' })]),
    });
    await expect(
      assignmentService(duplicateRepository).assign(assignInput()),
    ).rejects.toBeInstanceOf(RoleAssignmentConflictError);

    const conflictRepository = repositoryStub({
      findAssignments: vi.fn(async () => [
        assignment({ roleId: 'role-conflict' }),
      ]),
      findRoleConflicts: vi.fn(async () => [
        {
          roleId: 'role-1',
          conflictingRoleId: 'role-conflict',
          reason: 'separation of duties',
        },
      ]),
    });
    await expect(
      assignmentService(conflictRepository).assign(assignInput()),
    ).rejects.toBeInstanceOf(RoleAssignmentConflictError);
  });

  it('assigns transactionally, increments the version, invalidates cache, and audits', async () => {
    const repository = repositoryStub();
    const cache = cacheStub();
    const events = new FakeAuthorizationEventPublisher();
    const service = new RoleAssignmentService(
      repository,
      allowGuard(),
      cache,
      events,
    );
    await service.assign(assignInput());

    expect(repository.transaction).toHaveBeenCalledOnce();
    expect(repository.assignRole).toHaveBeenCalledOnce();
    expect(repository.incrementPrincipalVersion).toHaveBeenCalledWith(target);
    expect(cache.deleteByPrincipal).toHaveBeenCalledWith('user-1', 'user');
    expect(events.events).toContainEqual(
      expect.objectContaining({ type: 'authorization.role.assigned' }),
    );
  });

  it('protects the final platform owner from revocation', async () => {
    const repository = repositoryStub({
      countActiveRoleAssignments: vi.fn(async () => 1),
      findRoleById: vi.fn(async () =>
        role({ id: 'owner-role', key: 'platform_owner' }),
      ),
      findAssignmentById: vi.fn(async () =>
        assignment({ roleId: 'owner-role' }),
      ),
    });
    await expect(
      assignmentService(repository).revoke({
        actor,
        target,
        assignmentId: 'assignment-1',
        reason: 'test',
      }),
    ).rejects.toBeInstanceOf(LastAdministratorError);
    expect(repository.revokeRole).not.toHaveBeenCalled();
  });
});

function assignmentService(repository: AuthorizationManagementRepository) {
  return new RoleAssignmentService(
    repository,
    allowGuard(),
    cacheStub(),
    new FakeAuthorizationEventPublisher(),
  );
}

function assignInput() {
  return {
    actor,
    actorMaximumAdministrativeRank: 100,
    target,
    roleId: 'role-1',
    scope: { type: 'global' } as const,
    canManageSystemRoles: true,
  };
}

function role(changes: Partial<Role> = {}): Role {
  const date = new Date(0);
  return {
    id: 'role-1',
    key: 'member',
    displayName: 'Member',
    system: false,
    assignable: true,
    administrativeRank: 10,
    enabled: true,
    createdAt: date,
    updatedAt: date,
    ...changes,
  };
}

function assignment(changes: { roleId: string }) {
  return {
    id: 'assignment-1',
    principal: target,
    roleId: changes.roleId,
    scope: { type: 'global' } as const,
    assignedBy: actor.id,
    assignedAt: new Date(0),
    metadata: {},
  };
}

function cacheStub(): AuthorizationCache {
  return {
    get: vi.fn(async () => undefined),
    set: vi.fn(async () => undefined),
    deleteByPrincipal: vi.fn(async () => undefined),
  };
}

function allowGuard() {
  return { require: vi.fn(async () => undefined) };
}

function repositoryStub(
  overrides: Partial<AuthorizationManagementRepository> = {},
): AuthorizationManagementRepository {
  const repository = {
    getPrincipalVersion: vi.fn(async () => 1),
    loadEffectiveAuthorization: vi.fn(),
    findPermissionByKey: vi.fn(),
    findRoleById: vi.fn(async () => role()),
    findAssignments: vi.fn(async () => []),
    findAssignmentById: vi.fn(async () => assignment({ roleId: 'role-1' })),
    findRoleConflicts: vi.fn(async () => []),
    hasRolePermission: vi.fn(async () => false),
    createRole: vi.fn(),
    updateRole: vi.fn(),
    createPermission: vi.fn(),
    updatePermission: vi.fn(),
    addRolePermission: vi.fn(async () => undefined),
    removeRolePermission: vi.fn(async () => undefined),
    addRoleParent: vi.fn(async () => undefined),
    getParentRoleIds: vi.fn(async () => []),
    assignRole: vi.fn(async (input) => assignment({ roleId: input.roleId })),
    revokeRole: vi.fn(async () => undefined),
    incrementPrincipalVersion: vi.fn(async () => 2),
    countActiveRoleAssignments: vi.fn(async () => 2),
    transaction: vi.fn(async (work) => work(repository)),
    ...overrides,
  };
  return repository as unknown as AuthorizationManagementRepository;
}
