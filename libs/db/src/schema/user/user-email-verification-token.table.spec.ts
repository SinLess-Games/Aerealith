import { getTableColumns, getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { userEmailVerificationTokensTable } from './user-email-verification-token.table';

describe('userEmailVerificationTokensTable', () => {
  it('defines a secure, expiring, single-use token record', () => {
    expect(getTableName(userEmailVerificationTokensTable)).toBe(
      'user_email_verification_tokens',
    );

    const columns = getTableColumns(userEmailVerificationTokensTable);
    expect(Object.keys(columns)).toEqual([
      'id',
      'userId',
      'tokenHash',
      'expiresAt',
      'consumedAt',
      'createdAt',
    ]);
    expect(columns.tokenHash.notNull).toBe(true);
    expect(columns.expiresAt.notNull).toBe(true);
    expect(columns.consumedAt.notNull).toBe(false);
    expect(columns.createdAt.hasDefault).toBe(true);
  });
});
