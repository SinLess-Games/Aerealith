import { getTableColumns, getTableName } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { userPasswordResetTokensTable } from './user-password-reset-token.table';

describe('userPasswordResetTokensTable', () => {
  it('defines a secure, expiring, single-use password reset token record', () => {
    expect(getTableName(userPasswordResetTokensTable)).toBe(
      'user_password_reset_tokens',
    );

    const columns = getTableColumns(userPasswordResetTokensTable);
    expect(Object.keys(columns)).toEqual([
      'id',
      'userId',
      'tokenHash',
      'expiresAt',
      'consumedAt',
      'createdAt',
    ]);
    expect(columns.userId.notNull).toBe(true);
    expect(columns.tokenHash.notNull).toBe(true);
    expect(columns.expiresAt.notNull).toBe(true);
    expect(columns.consumedAt.notNull).toBe(false);
    expect(columns.createdAt.hasDefault).toBe(true);
  });

  it('enforces unique hashes and indexes token lifecycle lookups', () => {
    const config = getTableConfig(userPasswordResetTokensTable);

    expect(config.indexes.map((index) => index.config.name)).toEqual([
      'user_password_reset_tokens_token_hash_unique',
      'user_password_reset_tokens_user_id_index',
      'user_password_reset_tokens_expires_at_index',
    ]);
    expect(
      config.foreignKeys.map((foreignKey) => foreignKey.getName()),
    ).toEqual(['user_password_reset_tokens_user_id_users_id_fk']);
  });
});
