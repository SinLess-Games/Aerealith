import type { PoolClient, QueryResult } from 'pg';
import { describe, expect, it, vi } from 'vitest';

import { seedSuperAdmin } from './super-admin.seed';

describe('seedSuperAdmin', () => {
  it('promotes an existing account and assigns protected platform ownership', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce(
        result([
          {
            id: 'user-1',
            username: 'Sinless777',
            email: 'timothy.pierce444@gmail.com',
            password_hash: 'existing',
          },
        ]),
      )
      .mockResolvedValueOnce(
        result([{ id: 'user-1', email: 'timothy.pierce444@gmail.com' }]),
      )
      .mockResolvedValueOnce(result([{ id: 'platform-owner-role' }]))
      .mockResolvedValue(result([]));

    await expect(
      seedSuperAdmin({ query } as Pick<PoolClient, 'query'>, {
        username: 'Sinless777',
        email: 'timothy.pierce444@gmail.com',
        passwordHash: 'unused-hash',
      }),
    ).resolves.toEqual({
      created: false,
      email: 'timothy.pierce444@gmail.com',
      passwordWasSet: false,
    });

    expect(query.mock.calls[1]?.[0]).toContain("role = 'super_admin'");
    expect(query.mock.calls[3]?.[0]).toContain('role_permissions');
    expect(query.mock.calls[4]?.[0]).toContain('principal_roles');
    expect(query.mock.calls[5]?.[0]).toContain(
      'principal_authorization_versions',
    );
  });

  it('refuses an ambiguous identity collision', async () => {
    const query = vi.fn().mockResolvedValue(
      result([
        {
          id: 'user-1',
          username: 'Sinless777',
          email: 'first@example.com',
          password_hash: 'hash',
        },
        {
          id: 'user-2',
          username: 'other',
          email: 'timothy.pierce444@gmail.com',
          password_hash: 'hash',
        },
      ]),
    );

    await expect(
      seedSuperAdmin({ query } as Pick<PoolClient, 'query'>, {
        username: 'Sinless777',
        email: 'timothy.pierce444@gmail.com',
        passwordHash: 'hash',
      }),
    ).rejects.toThrow('different accounts');
    expect(query).toHaveBeenCalledOnce();
  });
});

function result<T>(rows: T[]): QueryResult<T> {
  return {
    command: 'SELECT',
    rowCount: rows.length,
    oid: 0,
    fields: [],
    rows,
  };
}
