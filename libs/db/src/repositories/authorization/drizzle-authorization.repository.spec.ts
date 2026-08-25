import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '../../client';
import { DrizzleAuthorizationRepository } from './drizzle-authorization.repository';

const userId = '11111111-1111-4111-8111-111111111111';
const roleId = '22222222-2222-4222-8222-222222222222';
const memberId = '33333333-3333-4333-8333-333333333333';
const organizationId = '44444444-4444-4444-8444-444444444444';
const permissionId = '55555555-5555-4555-8555-555555555555';
const actorId = '66666666-6666-4666-8666-666666666666';
const createdAt = new Date('2026-08-13T10:00:00.000Z');
const updatedAt = new Date('2026-08-13T11:00:00.000Z');
const assignedAt = new Date('2026-08-13T12:00:00.000Z');

function roleRow(overrides: Record<string, unknown> = {}) {
  return {
    id: roleId,
    name: 'Platform administrator',
    slug: 'platform-admin',
    scope: 'platform',
    description: null,
    isSystem: true,
    isDefault: false,
    createdAt,
    updatedAt,
    ...overrides,
  };
}

function permissionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: permissionId,
    key: 'platform.user.read_all',
    scope: 'platform',
    resource: 'user',
    action: 'read_all',
    description: null,
    isSystem: true,
    createdAt,
    updatedAt,
    ...overrides,
  };
}

function platformAssignment(overrides: Record<string, unknown> = {}) {
  return {
    userId,
    roleId,
    assignedByUserId: null,
    assignedAt,
    expiresAt: null,
    ...overrides,
  };
}

function organizationAssignment(overrides: Record<string, unknown> = {}) {
  return {
    organizationMemberId: memberId,
    organizationId,
    userId,
    roleId,
    assignedByUserId: actorId,
    assignedAt,
    expiresAt: null,
    ...overrides,
  };
}

function createDatabaseMock() {
  let selectQueue: unknown[][] = [];
  let insertQueue: unknown[][] = [];
  let updateQueue: unknown[][] = [];
  let deleteQueue: unknown[][] = [];

  const makeSelectChain = (rows: unknown[]) => {
    const chain = [...rows] as unknown[] & {
      innerJoin: ReturnType<typeof vi.fn>;
      limit: ReturnType<typeof vi.fn>;
      where: ReturnType<typeof vi.fn>;
    };
    chain.innerJoin = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.limit = vi.fn(async () => rows);
    return chain;
  };

  const select = vi.fn(() => {
    const chain = makeSelectChain(selectQueue.shift() ?? []);
    return { from: vi.fn(() => chain) };
  });

  const insertValues = vi.fn();
  const insert = vi.fn(() => {
    const rows = insertQueue.shift() ?? [];
    const returning = vi.fn(async () => rows);
    const conflict = { returning };
    return {
      values: (values: unknown) => {
        insertValues(values);
        return {
          onConflictDoNothing: vi.fn(() => conflict),
          onConflictDoUpdate: vi.fn(() => conflict),
          returning,
        };
      },
    };
  });

  const updateSet = vi.fn();
  const update = vi.fn(() => {
    const rows = updateQueue.shift() ?? [];
    const returning = vi.fn(async () => rows);
    return {
      set: (values: unknown) => {
        updateSet(values);
        return { where: vi.fn(() => ({ returning })) };
      },
    };
  });

  const deleteMethod = vi.fn(() => {
    const rows = deleteQueue.shift() ?? [];
    const returning = vi.fn(async () => rows);
    return { where: vi.fn(() => ({ returning })) };
  });

  const transactionClient = { marker: 'transaction' };
  const transaction = vi.fn(async (work: (tx: unknown) => unknown) =>
    work(transactionClient),
  );

  return {
    database: {
      delete: deleteMethod,
      insert,
      select,
      transaction,
      update,
    } as unknown as DatabaseClient,
    deleteMethod,
    insertValues,
    queueDeletes: (...rows: unknown[][]) => {
      deleteQueue = rows;
    },
    queueInserts: (...rows: unknown[][]) => {
      insertQueue = rows;
    },
    queueSelects: (...rows: unknown[][]) => {
      selectQueue = rows;
    },
    queueUpdates: (...rows: unknown[][]) => {
      updateQueue = rows;
    },
    transaction,
    updateSet,
  };
}

describe('DrizzleAuthorizationRepository', () => {
  let mock: ReturnType<typeof createDatabaseMock>;
  let repository: DrizzleAuthorizationRepository;

  beforeEach(() => {
    mock = createDatabaseMock();
    repository = new DrizzleAuthorizationRepository(mock.database);
  });

  it('gets a principal authorization version and defaults missing versions to zero', async () => {
    mock.queueSelects([{ version: 4 }], []);
    await expect(
      repository.getPrincipalVersion({ id: userId, type: 'user' }),
    ).resolves.toBe(4);
    await expect(
      repository.getPrincipalVersion({ id: userId, type: 'user' }),
    ).resolves.toBe(0);
  });

  it('loads effective roles, grants, inheritance, assignments, and version', async () => {
    mock.queueSelects(
      [{ version: 3 }],
      [platformAssignment()],
      [organizationAssignment()],
      [roleRow()],
      [{ roleId, parentRoleId: 'parent-role' }],
      [{ roleId, permission: permissionRow() }],
    );

    await expect(
      repository.loadEffectiveAuthorization({ id: userId, type: 'user' }),
    ).resolves.toMatchObject({
      version: 3,
      assignments: [
        { scope: { type: 'global' } },
        { scope: { id: organizationId, type: 'organization' } },
      ],
      permissionsByRole: {
        [roleId]: [expect.objectContaining({ id: permissionId })],
      },
      parentRoleIdsByRole: { [roleId]: ['parent-role'] },
      roles: [expect.objectContaining({ id: roleId, administrativeRank: 100 })],
    });
  });

  it('finds permissions and roles and maps optional projections', async () => {
    mock.queueSelects(
      [permissionRow({ description: 'Read every user.' })],
      [],
      [roleRow({ description: 'Administrates.', isSystem: false })],
      [],
    );
    await expect(
      repository.findPermissionByKey('platform.user.read_all'),
    ).resolves.toMatchObject({
      displayName: 'Platform · User · Read All',
      description: 'Read every user.',
    });
    await expect(
      repository.findPermissionByKey('missing'),
    ).resolves.toBeUndefined();
    await expect(repository.findRoleById(roleId)).resolves.toMatchObject({
      administrativeRank: 0,
      description: 'Administrates.',
    });
    await expect(repository.findRoleById('missing')).resolves.toBeUndefined();
  });

  it('loads user assignments and rejects unsupported or malformed principals', async () => {
    await expect(
      repository.findAssignments({ id: userId, type: 'service' }),
    ).resolves.toEqual([]);
    await expect(
      repository.findAssignments({ id: 'invalid', type: 'user' }),
    ).resolves.toEqual([]);

    mock.queueSelects([platformAssignment()], [organizationAssignment()]);
    await expect(
      repository.findAssignments({ id: userId, type: 'user' }),
    ).resolves.toHaveLength(2);
  });

  it('finds platform and organization assignments by deterministic IDs', async () => {
    mock.queueSelects([platformAssignment()], [], [organizationAssignment()]);
    await expect(
      repository.findAssignmentById(`platform:${userId}:${roleId}`),
    ).resolves.toMatchObject({
      assignedBy: 'system',
      scope: { type: 'global' },
    });
    await expect(
      repository.findAssignmentById(`platform:${userId}:${permissionId}`),
    ).resolves.toBeUndefined();
    await expect(
      repository.findAssignmentById(`organization:${memberId}:${roleId}`),
    ).resolves.toMatchObject({
      assignedBy: actorId,
      scope: { id: organizationId },
    });
    await expect(
      repository.findAssignmentById('malformed'),
    ).resolves.toBeUndefined();
  });

  it('normalizes both directions of role conflicts', async () => {
    mock.queueSelects([
      { roleId, conflictingRoleId: permissionId, reason: 'direct' },
      { roleId: memberId, conflictingRoleId: roleId, reason: null },
    ]);
    await expect(repository.findRoleConflicts(roleId)).resolves.toEqual([
      { roleId, conflictingRoleId: permissionId, reason: 'direct' },
      { roleId, conflictingRoleId: memberId, reason: null },
    ]);
  });

  it('checks whether a role contains a permission', async () => {
    mock.queueSelects([{ roleId }], []);
    await expect(
      repository.hasRolePermission(roleId, permissionId),
    ).resolves.toBe(true);
    await expect(
      repository.hasRolePermission(roleId, permissionId),
    ).resolves.toBe(false);
  });

  it('creates and updates roles with inferred scopes and optional fields', async () => {
    mock.queueInserts([roleRow({ slug: 'owner', scope: 'organization' })], []);
    await expect(
      repository.createRole({
        description: 'Owner.',
        displayName: 'Owner',
        key: 'owner',
        system: true,
        assignable: true,
        administrativeRank: 50,
        enabled: true,
      }),
    ).resolves.toMatchObject({ key: 'owner', administrativeRank: 50 });
    expect(mock.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ scope: 'organization', description: 'Owner.' }),
    );
    await expect(
      repository.createRole({
        displayName: 'Custom',
        key: 'custom',
        system: false,
        assignable: true,
        administrativeRank: 0,
        enabled: true,
      }),
    ).rejects.toThrow('Failed to create role.');

    mock.queueUpdates(
      [roleRow({ slug: 'org.manager', scope: 'organization' })],
      [],
    );
    await repository.updateRole(roleId, {
      description: 'Updated',
      displayName: 'Manager',
      key: 'org.manager',
      system: false,
    });
    expect(mock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Updated',
        isSystem: false,
        name: 'Manager',
        scope: 'organization',
        slug: 'org.manager',
      }),
    );
    await expect(repository.updateRole(roleId, {})).rejects.toThrow(
      'Role not found.',
    );
  });

  it('creates and updates permissions with inferred scopes and optional fields', async () => {
    mock.queueInserts(
      [
        permissionRow({
          key: 'organization.member.invite',
          scope: 'organization',
        }),
      ],
      [],
    );
    await repository.createPermission({
      action: 'invite',
      description: 'Invite members.',
      displayName: 'Invite members',
      key: 'organization.member.invite',
      resource: 'member',
      system: true,
      enabled: true,
    });
    expect(mock.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: 'organization',
        description: 'Invite members.',
      }),
    );
    await expect(
      repository.createPermission({
        action: 'read',
        displayName: 'Read users',
        key: 'platform.user.read',
        resource: 'user',
        system: false,
        enabled: true,
      }),
    ).rejects.toThrow('Failed to create permission.');

    mock.queueUpdates([permissionRow()], []);
    await repository.updatePermission(permissionId, {
      action: 'read_all',
      description: 'Updated',
      key: 'platform.user.read_all',
      resource: 'user',
      system: false,
    });
    expect(mock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ isSystem: false, scope: 'platform' }),
    );
    await expect(repository.updatePermission(permissionId, {})).rejects.toThrow(
      'Permission not found.',
    );
  });

  it('validates role-permission scope before adding and supports removal', async () => {
    mock.queueSelects([roleRow()], [permissionRow()]);
    await expect(
      repository.addRolePermission(roleId, permissionId),
    ).resolves.toBeUndefined();

    mock.queueSelects([], [permissionRow()]);
    await expect(
      repository.addRolePermission(roleId, permissionId),
    ).rejects.toThrow('Role not found.');
    mock.queueSelects([roleRow()], []);
    await expect(
      repository.addRolePermission(roleId, permissionId),
    ).rejects.toThrow('Permission not found.');
    mock.queueSelects([roleRow()], [permissionRow({ scope: 'organization' })]);
    await expect(
      repository.addRolePermission(roleId, permissionId),
    ).rejects.toThrow('Role and permission scopes must match.');

    mock.queueDeletes([]);
    await expect(
      repository.removeRolePermission(roleId, permissionId),
    ).resolves.toBeUndefined();
  });

  it('validates role inheritance and returns parent IDs', async () => {
    mock.queueSelects([roleRow()], [roleRow({ id: permissionId })]);
    await expect(
      repository.addRoleParent(roleId, permissionId, actorId),
    ).resolves.toBeUndefined();

    mock.queueSelects([], [roleRow()]);
    await expect(
      repository.addRoleParent(roleId, permissionId, actorId),
    ).rejects.toThrow('Role not found.');
    mock.queueSelects([roleRow()], [roleRow({ scope: 'organization' })]);
    await expect(
      repository.addRoleParent(roleId, permissionId, actorId),
    ).rejects.toThrow('Role inheritance cannot cross authorization scopes.');

    mock.queueSelects([{ id: roleId }, { id: permissionId }]);
    await expect(repository.getParentRoleIds('child')).resolves.toEqual([
      roleId,
      permissionId,
    ]);
  });

  it('assigns platform roles, including idempotent conflict recovery', async () => {
    mock.queueSelects([roleRow()]);
    mock.queueInserts([platformAssignment({ assignedByUserId: actorId })]);
    await expect(
      repository.assignRole({
        assignedBy: actorId,
        principal: { id: userId, type: 'user' },
        roleId,
        scope: { type: 'global' },
      }),
    ).resolves.toMatchObject({
      assignedBy: actorId,
      scope: { type: 'global' },
    });

    mock.queueSelects([roleRow()], [platformAssignment()]);
    mock.queueInserts([]);
    await expect(
      repository.assignRole({
        assignedBy: 'system',
        principal: { id: userId, type: 'user' },
        roleId,
        scope: { type: 'global' },
      }),
    ).resolves.toMatchObject({ assignedBy: 'system' });
  });

  it('assigns organization roles to active memberships', async () => {
    const expiresAt = new Date('2026-08-14T00:00:00.000Z');
    mock.queueSelects(
      [roleRow({ scope: 'organization' })],
      [{ id: memberId, organizationId, userId, status: 'active' }],
    );
    mock.queueInserts([
      {
        organizationMemberId: memberId,
        roleId,
        assignedByUserId: null,
        assignedAt,
        expiresAt,
      },
    ]);
    await expect(
      repository.assignRole({
        assignedBy: 'system',
        expiresAt,
        principal: { id: userId, type: 'user' },
        roleId,
        scope: { id: organizationId, type: 'organization' },
      }),
    ).resolves.toMatchObject({ expiresAt, scope: { id: organizationId } });
    expect(mock.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ assignedByUserId: null, expiresAt }),
    );
  });

  it.each([
    [
      {
        principal: { id: userId, type: 'service' },
        roleId,
        scope: { type: 'global' },
      },
      'user principals',
    ],
    [
      {
        principal: { id: 'invalid', type: 'user' },
        roleId,
        scope: { type: 'global' },
      },
      'must be a UUID',
    ],
  ])('rejects invalid role assignment input', async (input, message) => {
    await expect(
      repository.assignRole({ assignedBy: 'system', ...input } as never),
    ).rejects.toThrow(message);
  });

  it('rejects missing roles, mismatched scopes, invalid organizations, and inactive members', async () => {
    const base = {
      assignedBy: 'system',
      principal: { id: userId, type: 'user' as const },
      roleId,
    };
    mock.queueSelects([]);
    await expect(
      repository.assignRole({ ...base, scope: { type: 'global' } }),
    ).rejects.toThrow('Role not found.');
    mock.queueSelects([roleRow({ scope: 'organization' })]);
    await expect(
      repository.assignRole({ ...base, scope: { type: 'global' } }),
    ).rejects.toThrow('Organization roles cannot be assigned globally.');
    mock.queueSelects([roleRow()]);
    await expect(
      repository.assignRole({
        ...base,
        scope: { id: organizationId, type: 'organization' },
      }),
    ).rejects.toThrow('Platform roles cannot be assigned to an organization.');
    mock.queueSelects([roleRow({ scope: 'organization' })]);
    await expect(
      repository.assignRole({
        ...base,
        scope: { id: 'invalid', type: 'organization' },
      }),
    ).rejects.toThrow('valid organization UUID');
    mock.queueSelects([roleRow({ scope: 'organization' })], []);
    await expect(
      repository.assignRole({
        ...base,
        scope: { id: organizationId, type: 'organization' },
      }),
    ).rejects.toThrow('Active organization membership not found.');
  });

  it('revokes platform and organization assignments and rejects mismatches', async () => {
    mock.queueDeletes([{ roleId }]);
    await expect(
      repository.revokeRole({
        assignmentId: `platform:${userId}:${roleId}`,
        principal: { id: userId, type: 'user' },
        reason: 'Access removed.',
        revokedBy: actorId,
      }),
    ).resolves.toBeUndefined();

    mock.queueSelects([{ id: memberId, userId }]);
    mock.queueDeletes([{ roleId }]);
    await expect(
      repository.revokeRole({
        assignmentId: `organization:${memberId}:${roleId}`,
        principal: { id: userId, type: 'user' },
        reason: 'Access removed.',
        revokedBy: actorId,
      }),
    ).resolves.toBeUndefined();

    await expect(
      repository.revokeRole({
        assignmentId: 'bad',
        principal: { id: userId, type: 'user' },
        reason: 'Access removed.',
        revokedBy: actorId,
      }),
    ).rejects.toThrow('Active role assignment not found.');
    await expect(
      repository.revokeRole({
        assignmentId: `platform:${userId}:${roleId}`,
        principal: { id: actorId, type: 'user' },
        reason: 'Access removed.',
        revokedBy: actorId,
      }),
    ).rejects.toThrow('Active role assignment not found.');
  });

  it('increments principal versions and rejects missing upsert results', async () => {
    mock.queueInserts([{ version: 5 }], []);
    await expect(
      repository.incrementPrincipalVersion({ id: userId, type: 'user' }),
    ).resolves.toBe(5);
    await expect(
      repository.incrementPrincipalVersion({ id: userId, type: 'user' }),
    ).rejects.toThrow('Failed to update authorization version.');
  });

  it('counts active assignments for missing, platform, and organization roles', async () => {
    mock.queueSelects(
      [],
      [roleRow()],
      [{ value: '4' }],
      [roleRow({ scope: 'organization' })],
      [{ value: 2 }],
    );
    await expect(
      repository.countActiveRoleAssignments('missing'),
    ).resolves.toBe(0);
    await expect(
      repository.countActiveRoleAssignments('platform-admin'),
    ).resolves.toBe(4);
    await expect(repository.countActiveRoleAssignments('owner')).resolves.toBe(
      2,
    );
  });

  it('runs work inside a transaction-bound repository', async () => {
    const work = vi.fn(
      async (transactionRepository: unknown) => transactionRepository,
    );
    await expect(repository.transaction(work)).resolves.toBeInstanceOf(
      DrizzleAuthorizationRepository,
    );
    expect(mock.transaction).toHaveBeenCalled();
  });
});
