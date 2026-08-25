import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '../client';
import { PermissionScope } from '../schema/authorization/permissions';
import { assignPlatformRoleTransaction } from './assign-platform-role.transaction';

const mocks = vi.hoisted(() => ({
  assignRole: vi.fn(),
  incrementPrincipalVersion: vi.fn(),
  limit: vi.fn(),
  repositoryConstructor: vi.fn(),
  transaction: {} as Record<string, unknown>,
  withTransaction: vi.fn(),
}));

vi.mock('../repositories/authorization', () => ({
  DrizzleAuthorizationRepository: function Repository(database: unknown) {
    mocks.repositoryConstructor(database);
    return {
      assignRole: mocks.assignRole,
      incrementPrincipalVersion: mocks.incrementPrincipalVersion,
    };
  },
}));
vi.mock('./with-transaction', () => ({
  withTransaction: mocks.withTransaction,
}));

const database = { transaction: vi.fn() } as unknown as DatabaseClient;
const assignment = { id: 'assignment-1', roleId: 'role-1' };

describe('assignPlatformRoleTransaction', () => {
  beforeEach(() => {
    mocks.limit
      .mockReset()
      .mockResolvedValue([{ id: 'role-1', scope: PermissionScope.Platform }]);
    const where = vi.fn(() => ({ limit: mocks.limit }));
    const from = vi.fn(() => ({ where }));
    const select = vi.fn(() => ({ from }));
    mocks.transaction = { select };
    mocks.assignRole.mockReset().mockResolvedValue(assignment);
    mocks.incrementPrincipalVersion.mockReset().mockResolvedValue(1);
    mocks.repositoryConstructor.mockReset();
    mocks.withTransaction
      .mockReset()
      .mockImplementation(
        async (_database: DatabaseClient, callback: (tx: unknown) => unknown) =>
          callback(mocks.transaction),
      );
  });

  it.each([
    new Date('2026-08-13T11:59:59.999Z'),
    new Date('2026-08-13T12:00:00.000Z'),
  ])('rejects an expiration that is not in the future', async (expiresAt) => {
    vi.spyOn(Date, 'now').mockReturnValue(
      new Date('2026-08-13T12:00:00.000Z').getTime(),
    );
    await expect(
      assignPlatformRoleTransaction(database, {
        assignedByUserId: 'admin-1',
        expiresAt,
        roleId: 'role-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow(
      'Platform role assignment expiration must be in the future.',
    );
    expect(mocks.withTransaction).not.toHaveBeenCalled();
  });

  it('rejects missing and non-platform roles', async () => {
    mocks.limit.mockResolvedValueOnce([]);
    await expect(
      assignPlatformRoleTransaction(database, {
        assignedByUserId: 'admin-1',
        roleId: 'missing',
        userId: 'user-1',
      }),
    ).rejects.toThrow('Role not found.');

    mocks.limit.mockResolvedValueOnce([
      { id: 'role-1', scope: PermissionScope.Organization },
    ]);
    await expect(
      assignPlatformRoleTransaction(database, {
        assignedByUserId: 'admin-1',
        roleId: 'role-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow(
      'Only platform-scoped roles can be assigned as platform roles.',
    );
    expect(mocks.assignRole).not.toHaveBeenCalled();
  });

  it.each([undefined, new Date('2026-08-14T00:00:00.000Z')])(
    'assigns a platform role atomically with expiration %p',
    async (expiresAt) => {
      vi.spyOn(Date, 'now').mockReturnValue(
        new Date('2026-08-13T12:00:00.000Z').getTime(),
      );
      const result = await assignPlatformRoleTransaction(database, {
        assignedByUserId: 'admin-1',
        expiresAt,
        roleId: 'role-1',
        userId: 'user-1',
      });

      expect(result).toEqual({ assignment });
      expect(mocks.repositoryConstructor).toHaveBeenCalledWith(
        mocks.transaction,
      );
      expect(mocks.assignRole).toHaveBeenCalledWith({
        assignedBy: 'admin-1',
        ...(expiresAt ? { expiresAt } : {}),
        principal: { id: 'user-1', type: 'user' },
        roleId: 'role-1',
        scope: { type: 'global' },
      });
      expect(mocks.incrementPrincipalVersion).toHaveBeenCalledWith({
        id: 'user-1',
        type: 'user',
      });
    },
  );
});
