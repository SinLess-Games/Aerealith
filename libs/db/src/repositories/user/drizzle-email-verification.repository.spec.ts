import { describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '../../client';
import {
  userEmailVerificationTokensTable,
  type UserEmailVerificationTokenRow,
} from '../../schema';
import { DrizzleEmailVerificationRepository } from './drizzle-email-verification.repository';

function tokenRow(
  overrides: Partial<UserEmailVerificationTokenRow> = {},
): UserEmailVerificationTokenRow {
  return {
    id: 'token-1',
    userId: 'user-1',
    tokenHash: 'hashed-token',
    expiresAt: new Date('2026-08-14T00:00:00.000Z'),
    consumedAt: null,
    createdAt: new Date('2026-08-13T00:00:00.000Z'),
    ...overrides,
  };
}

function databaseMock({
  selected = [],
  inserted = [],
  updated = [],
}: {
  selected?: UserEmailVerificationTokenRow[];
  inserted?: UserEmailVerificationTokenRow[];
  updated?: { id: string }[];
} = {}) {
  const selectLimit = vi.fn().mockResolvedValue(selected);
  const selectWhere = vi.fn(() => ({ limit: selectLimit }));
  const selectFrom = vi.fn(() => ({ where: selectWhere }));
  const select = vi.fn(() => ({ from: selectFrom }));

  const insertReturning = vi.fn().mockResolvedValue(inserted);
  const insertValues = vi.fn(() => ({ returning: insertReturning }));
  const insert = vi.fn(() => ({ values: insertValues }));

  const updateReturning = vi.fn().mockResolvedValue(updated);
  const updateWhere = vi.fn(() => ({ returning: updateReturning }));
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set: updateSet }));

  return {
    database: { insert, select, update } as unknown as DatabaseClient,
    insert,
    insertValues,
    selectFrom,
    selectLimit,
    update,
    updateSet,
    updateWhere,
  };
}

describe('DrizzleEmailVerificationRepository', () => {
  it('creates and returns a verification token', async () => {
    const expected = tokenRow();
    const mock = databaseMock({ inserted: [expected] });
    const repository = new DrizzleEmailVerificationRepository(mock.database);
    const input = {
      userId: 'user-1',
      tokenHash: 'hashed-token',
      expiresAt: expected.expiresAt,
    };

    await expect(repository.create(input)).resolves.toBe(expected);
    expect(mock.insert).toHaveBeenCalledWith(userEmailVerificationTokensTable);
    expect(mock.insertValues).toHaveBeenCalledWith(input);
  });

  it('throws when token creation returns no row', async () => {
    const repository = new DrizzleEmailVerificationRepository(
      databaseMock().database,
    );
    await expect(
      repository.create({
        userId: 'user-1',
        tokenHash: 'hash',
        expiresAt: new Date(),
      }),
    ).rejects.toThrow('Failed to create email verification token.');
  });

  it.each([
    [[tokenRow()], tokenRow()],
    [[], null],
  ])(
    'finds an active unconsumed token or returns null',
    async (selected, expected) => {
      const mock = databaseMock({ selected });
      const repository = new DrizzleEmailVerificationRepository(mock.database);
      const now = new Date('2026-08-13T12:00:00.000Z');

      await expect(
        repository.findActiveByHash('hashed-token', now),
      ).resolves.toEqual(expected);
      expect(mock.selectFrom).toHaveBeenCalledWith(
        userEmailVerificationTokensTable,
      );
      expect(mock.selectLimit).toHaveBeenCalledWith(1);
    },
  );

  it.each([
    [[{ id: 'token-1' }], true],
    [[], false],
  ])('consumes an active token and returns %s', async (updated, expected) => {
    const mock = databaseMock({ updated });
    const repository = new DrizzleEmailVerificationRepository(mock.database);
    const now = new Date('2026-08-13T12:00:00.000Z');

    await expect(repository.consume('token-1', now)).resolves.toBe(expected);
    expect(mock.update).toHaveBeenCalledWith(userEmailVerificationTokensTable);
    expect(mock.updateSet).toHaveBeenCalledWith({ consumedAt: now });
  });

  it('consumes every active token for a user', async () => {
    const mock = databaseMock();
    const repository = new DrizzleEmailVerificationRepository(mock.database);
    const now = new Date('2026-08-13T12:00:00.000Z');

    await expect(
      repository.consumeAllForUser('user-1', now),
    ).resolves.toBeUndefined();
    expect(mock.updateSet).toHaveBeenCalledWith({ consumedAt: now });
    expect(mock.updateWhere).toHaveBeenCalled();
  });
});
