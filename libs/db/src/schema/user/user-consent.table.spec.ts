// libs/db/src/schema/user/user-consent.table.spec.ts

import { getTableColumns, getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { userConsentsTable } from './user-consent.table';

describe('userConsentsTable', () => {
  it('uses the correct database table name', () => {
    expect(getTableName(userConsentsTable)).toBe('user_consents');
  });

  it('defines the required columns', () => {
    const columns = getTableColumns(userConsentsTable);

    expect(Object.keys(columns)).toEqual([
      'id',
      'userId',
      'type',
      'version',
      'grantedAt',
      'revokedAt',
      'createdAt',
      'updatedAt',
      'deletedAt',
    ]);
  });

  it('requires the user and consent type', () => {
    const { userId, type } = getTableColumns(userConsentsTable);

    expect(userId.notNull).toBe(true);
    expect(type.notNull).toBe(true);
  });

  it('allows an optional consent version and decision timestamps', () => {
    const { version, grantedAt, revokedAt } =
      getTableColumns(userConsentsTable);

    expect(version.notNull).toBe(false);
    expect(grantedAt.notNull).toBe(false);
    expect(revokedAt.notNull).toBe(false);
  });

  it('generates IDs and record timestamps by default', () => {
    const { id, createdAt, updatedAt } =
      getTableColumns(userConsentsTable);

    expect(id.notNull).toBe(true);
    expect(id.hasDefault).toBe(true);

    expect(createdAt.notNull).toBe(true);
    expect(createdAt.hasDefault).toBe(true);

    expect(updatedAt.notNull).toBe(true);
    expect(updatedAt.hasDefault).toBe(true);
  });

  it('allows soft deletion', () => {
    const { deletedAt } = getTableColumns(userConsentsTable);

    expect(deletedAt.notNull).toBe(false);
  });
});
