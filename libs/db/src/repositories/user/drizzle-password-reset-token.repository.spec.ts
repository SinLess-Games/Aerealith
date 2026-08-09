import { describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '../../client';
import {
  type UserPasswordResetTokenRow,
  userPasswordResetTokensTable,
} from '../../schema';
import { DrizzlePasswordResetTokenRepository } from './drizzle-password-reset-token.repository';

function createTokenRow(
  overrides: Partial<UserPasswordResetTokenRow> = {},
): UserPasswordResetTokenRow {
  return {
    id: 'efc1cd5e-91d4-4211-bc83-c3e8a96ee5bf',
    userId: 'bf25c050-4c0a-4ed7-bf7b-1cf4d20817a9',
    tokenHash: 'hashed-reset-token',
    expiresAt: new Date('2026-08-09T00:00:00.000Z'),
    consumedAt: null,
    createdAt: new Date('2026-08-08T00:00:00.000Z'),
    ...overrides,
  };
}

function createDatabaseMock({
  selectedRows = [],
  insertedRows = [],
  updatedRows = [],
}: {
  selectedRows?: UserPasswordResetTokenRow[];
  insertedRows?: UserPasswordResetTokenRow[];
  updatedRows?: Array<{ id: string }>;
} = {}) {
  const selectLimit = vi.fn().mockResolvedValue(selectedRows);
  const selectWhere = vi.fn(() => ({ limit: selectLimit }));
  const selectFrom = vi.fn(() => ({ where: selectWhere }));
  const select = vi.fn(() => ({ from: selectFrom }));

  const insertReturning = vi.fn().mockResolvedValue(insertedRows);
  const insertValues = vi.fn(() => ({ returning: insertReturning }));
  const insert = vi.fn(() => ({ values: insertValues }));

  const updateReturning = vi.fn().mockResolvedValue(updatedRows);
  const updateWhere = vi.fn(() => ({ returning: updateReturning }));
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set: updateSet }));

  return {
    database: { select, insert, update } as unknown as DatabaseClient,
    select,
    selectFrom,
    selectWhere,
    selectLimit,
    insert,
    insertValues,
    update,
    updateSet,
    updateWhere,
    updateReturning,
  };
}

describe('DrizzlePasswordResetTokenRepository', () => {
  it('creates and returns a hashed password reset token', async () => {
    const row = createTokenRow();
    const databaseMock = createDatabaseMock({ insertedRows: [row] });
    const repository = new DrizzlePasswordResetTokenRepository(
      databaseMock.database,
    );

    await expect(
      repository.create({
        userId: row.userId,
        tokenHash: row.tokenHash,
        expiresAt: row.expiresAt,
      }),
    ).resolves.toEqual(row);

    expect(databaseMock.insert).toHaveBeenCalledWith(
      userPasswordResetTokensTable,
    );
    expect(databaseMock.insertValues).toHaveBeenCalledWith({
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
    });
  });

  it('fails closed when token creation does not return a row', async () => {
    const repository = new DrizzlePasswordResetTokenRepository(
      createDatabaseMock().database,
    );

    await expect(
      repository.create({
        userId: 'bf25c050-4c0a-4ed7-bf7b-1cf4d20817a9',
        tokenHash: 'hashed-reset-token',
        expiresAt: new Date('2026-08-09T00:00:00.000Z'),
      }),
    ).rejects.toThrow('Failed to create password reset token.');
  });

  it('finds an active token by its hash', async () => {
    const row = createTokenRow();
    const databaseMock = createDatabaseMock({ selectedRows: [row] });
    const repository = new DrizzlePasswordResetTokenRepository(
      databaseMock.database,
    );

    await expect(repository.findActiveByHash(row.tokenHash)).resolves.toEqual(
      row,
    );

    expect(databaseMock.selectFrom).toHaveBeenCalledWith(
      userPasswordResetTokensTable,
    );
    expect(databaseMock.selectLimit).toHaveBeenCalledWith(1);
  });

  it('returns null when no active token matches the hash', async () => {
    const repository = new DrizzlePasswordResetTokenRepository(
      createDatabaseMock().database,
    );

    await expect(repository.findActiveByHash('missing')).resolves.toBeNull();
  });

  it('atomically consumes an active, unexpired token', async () => {
    const now = new Date('2026-08-08T01:00:00.000Z');
    const databaseMock = createDatabaseMock({
      updatedRows: [{ id: 'efc1cd5e-91d4-4211-bc83-c3e8a96ee5bf' }],
    });
    const repository = new DrizzlePasswordResetTokenRepository(
      databaseMock.database,
    );

    await expect(
      repository.consume('efc1cd5e-91d4-4211-bc83-c3e8a96ee5bf', now),
    ).resolves.toBe(true);

    expect(databaseMock.update).toHaveBeenCalledWith(
      userPasswordResetTokensTable,
    );
    expect(databaseMock.updateSet).toHaveBeenCalledWith({ consumedAt: now });
  });

  it('reports false when a token is already consumed, expired, or missing', async () => {
    const repository = new DrizzlePasswordResetTokenRepository(
      createDatabaseMock().database,
    );

    await expect(repository.consume('missing')).resolves.toBe(false);
  });

  it('consumes all remaining tokens for a user', async () => {
    const now = new Date('2026-08-08T01:00:00.000Z');
    const databaseMock = createDatabaseMock();
    const repository = new DrizzlePasswordResetTokenRepository(
      databaseMock.database,
    );

    await expect(
      repository.consumeAllForUser('bf25c050-4c0a-4ed7-bf7b-1cf4d20817a9', now),
    ).resolves.toBeUndefined();

    expect(databaseMock.update).toHaveBeenCalledWith(
      userPasswordResetTokensTable,
    );
    expect(databaseMock.updateSet).toHaveBeenCalledWith({ consumedAt: now });
    expect(databaseMock.updateWhere).toHaveBeenCalledOnce();
  });
});
