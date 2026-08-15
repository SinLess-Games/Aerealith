import { describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '@aerealith-ai/db';
import { schema } from '@aerealith-ai/db';

import { assignDefaultPlatformUserRole } from './registration-platform-role';

function databaseWithRole(roleId: string | undefined) {
  const limit = vi.fn(async () => (roleId ? [{ id: roleId }] : []));
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  const onConflictDoNothing = vi.fn(async () => undefined);
  const values = vi.fn(() => ({ onConflictDoNothing }));
  const insert = vi.fn(() => ({ values }));
  return {
    database: { select, insert } as unknown as DatabaseClient,
    insert,
    values,
  };
}

describe('registration platform role', () => {
  it('assigns the canonical least-privilege platform user role', async () => {
    const mock = databaseWithRole('role-user');

    await assignDefaultPlatformUserRole(mock.database, 'user-1');

    expect(mock.insert).toHaveBeenCalledWith(
      schema.platformRoleAssignmentsTable,
    );
    expect(mock.values).toHaveBeenCalledWith({
      userId: 'user-1',
      roleId: 'role-user',
      assignedByUserId: null,
    });
  });

  it('fails closed when the canonical role seed is missing', async () => {
    const mock = databaseWithRole(undefined);

    await expect(
      assignDefaultPlatformUserRole(mock.database, 'user-1'),
    ).rejects.toThrow('authorization seed');
    expect(mock.insert).not.toHaveBeenCalled();
  });
});
