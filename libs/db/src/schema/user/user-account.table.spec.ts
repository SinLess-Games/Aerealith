// libs/db/src/schema/user/user-account.table.spec.ts

import { getTableColumns, getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { userAccountsTable } from './user-account.table';

describe('userAccountsTable', () => {
  it('uses the correct database table name', () => {
    expect(getTableName(userAccountsTable)).toBe('user_accounts');
  });

  it('defines the required columns', () => {
    const columns = getTableColumns(userAccountsTable);

    expect(Object.keys(columns)).toEqual([
      'id',
      'userId',
      'provider',
      'accountId',
      'displayName',
      'managementUrl',
      'status',
      'connectedAt',
      'createdAt',
      'updatedAt',
      'deletedAt',
    ]);
  });

  it('requires the account identity fields', () => {
    const {
      userId,
      provider,
      accountId,
      displayName,
      status,
      connectedAt,
    } = getTableColumns(userAccountsTable);

    expect(userId.notNull).toBe(true);
    expect(provider.notNull).toBe(true);
    expect(accountId.notNull).toBe(true);
    expect(displayName.notNull).toBe(true);
    expect(status.notNull).toBe(true);
    expect(connectedAt.notNull).toBe(true);
  });

  it('allows an optional management URL', () => {
    const { managementUrl } = getTableColumns(userAccountsTable);

    expect(managementUrl.notNull).toBe(false);
  });

  it('generates IDs, status, connection timestamps, and record timestamps by default', () => {
    const {
      id,
      status,
      connectedAt,
      createdAt,
      updatedAt,
    } = getTableColumns(userAccountsTable);

    expect(id.notNull).toBe(true);
    expect(id.hasDefault).toBe(true);

    expect(status.hasDefault).toBe(true);

    expect(connectedAt.hasDefault).toBe(true);

    expect(createdAt.notNull).toBe(true);
    expect(createdAt.hasDefault).toBe(true);

    expect(updatedAt.notNull).toBe(true);
    expect(updatedAt.hasDefault).toBe(true);
  });

  it('allows soft deletion', () => {
    const { deletedAt } = getTableColumns(userAccountsTable);

    expect(deletedAt.notNull).toBe(false);
  });
});
