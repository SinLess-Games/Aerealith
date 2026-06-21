// libs/db/src/repositories/system/drizzle-waitlist.repository.spec.ts

import { describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '../../client';
import {
  type WaitlistRow,
  waitlistTable,
} from '../../schema';
import { DrizzleWaitlistRepository } from './drizzle-waitlist.repository';

type DeletedWaitlistRow = {
  id: string;
};

function createWaitlistRow(
  overrides: Partial<WaitlistRow> = {},
): WaitlistRow {
  return {
    id: 'waitlist_123',
    email: 'person@example.com',
    createdAt: new Date('2026-06-20T00:00:00.000Z'),
    updatedAt: new Date('2026-06-20T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function createDatabaseMock({
  selectedRows = [],
  insertedRows = [],
  updatedRows = [],
}: {
  selectedRows?: WaitlistRow[];
  insertedRows?: WaitlistRow[];
  updatedRows?: DeletedWaitlistRow[];
} = {}) {
  const selectLimit = vi.fn().mockResolvedValue(selectedRows);
  const selectWhere = vi.fn(() => ({
    limit: selectLimit,
  }));
  const selectFrom = vi.fn(() => ({
    where: selectWhere,
  }));
  const select = vi.fn(() => ({
    from: selectFrom,
  }));

  const insertReturning = vi.fn().mockResolvedValue(insertedRows);
  const insertValues = vi.fn(() => ({
    returning: insertReturning,
  }));
  const insert = vi.fn(() => ({
    values: insertValues,
  }));

  const updateReturning = vi.fn().mockResolvedValue(updatedRows);
  const updateWhere = vi.fn(() => ({
    returning: updateReturning,
  }));
  const updateSet = vi.fn(() => ({
    where: updateWhere,
  }));
  const update = vi.fn(() => ({
    set: updateSet,
  }));

  const database = {
    select,
    insert,
    update,
  } as unknown as DatabaseClient;

  return {
    database,
    select,
    selectFrom,
    selectWhere,
    selectLimit,
    insert,
    insertValues,
    insertReturning,
    update,
    updateSet,
    updateWhere,
    updateReturning,
  };
}

describe('DrizzleWaitlistRepository', () => {
  it('finds an active waitlist entry by email', async () => {
    const row = createWaitlistRow();
    const databaseMock = createDatabaseMock({
      selectedRows: [row],
    });

    const repository = new DrizzleWaitlistRepository(
      databaseMock.database,
    );

    const result = await repository.findByEmail('person@example.com');

    expect(result).toEqual({
      id: row.id,
      email: row.email,
      createdAt: row.createdAt.toISOString(),
    });

    expect(databaseMock.select).toHaveBeenCalledOnce();
    expect(databaseMock.selectFrom).toHaveBeenCalledWith(waitlistTable);
    expect(databaseMock.selectLimit).toHaveBeenCalledWith(1);
  });

  it('returns null when no active waitlist entry exists', async () => {
    const databaseMock = createDatabaseMock();

    const repository = new DrizzleWaitlistRepository(
      databaseMock.database,
    );

    const result = await repository.findByEmail('missing@example.com');

    expect(result).toBeNull();
  });

  it('creates and returns a waitlist entry', async () => {
    const row = createWaitlistRow({
      email: 'new-person@example.com',
    });

    const databaseMock = createDatabaseMock({
      insertedRows: [row],
    });

    const repository = new DrizzleWaitlistRepository(
      databaseMock.database,
    );

    const result = await repository.create({
      email: 'new-person@example.com',
    });

    expect(result).toEqual({
      id: row.id,
      email: row.email,
      createdAt: row.createdAt.toISOString(),
    });

    expect(databaseMock.insert).toHaveBeenCalledWith(waitlistTable);
    expect(databaseMock.insertValues).toHaveBeenCalledWith({
      email: 'new-person@example.com',
    });
  });

  it('throws when creating a waitlist entry does not return a row', async () => {
    const databaseMock = createDatabaseMock();

    const repository = new DrizzleWaitlistRepository(
      databaseMock.database,
    );

    await expect(
      repository.create({
        email: 'person@example.com',
      }),
    ).rejects.toThrow();
  });

  it('soft deletes an existing waitlist entry', async () => {
    const databaseMock = createDatabaseMock({
      updatedRows: [
        {
          id: 'waitlist_123',
        },
      ],
    });

    const repository = new DrizzleWaitlistRepository(
      databaseMock.database,
    );

    const result = await repository.softDeleteByEmail(
      'person@example.com',
    );

    expect(result).toBe(true);
    expect(databaseMock.update).toHaveBeenCalledWith(waitlistTable);

    expect(databaseMock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    );
  });

  it('returns false when there is no waitlist entry to soft delete', async () => {
    const databaseMock = createDatabaseMock();

    const repository = new DrizzleWaitlistRepository(
      databaseMock.database,
    );

    const result = await repository.softDeleteByEmail(
      'missing@example.com',
    );

    expect(result).toBe(false);
  });
});
