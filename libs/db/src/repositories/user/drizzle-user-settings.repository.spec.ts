// libs/db/src/repositories/user/drizzle-user-settings.repository.spec.ts

import { describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '../../client';
import {
  type UserSettingsRow,
  userSettingsTable,
} from '../../schema';
import { DrizzleUserSettingsRepository } from './drizzle-user-settings.repository';

type DeletedUserSettingsRow = {
  id: string;
};

function createUserSettingsRow(
  overrides: Partial<UserSettingsRow> = {},
): UserSettingsRow {
  return {
    id: 'settings_123',
    userId: 'user_123',

    metadata: {} as UserSettingsRow['metadata'],

    accessibility: {
      highContrast: false,
      reduceMotion: false,
      textScale: 1,
    } as UserSettingsRow['accessibility'],

    appearance: {
      compactMode: false,
      theme: 'system',
    } as UserSettingsRow['appearance'],

    communication: {
      progressUpdates: true,
      quietMode: false,
    } as UserSettingsRow['communication'],

    notifications: {
      email: true,
      productUpdates: true,
      push: false,
      securityAlerts: true,
    } as UserSettingsRow['notifications'],

    privacy: {
      analytics: false,
      personalization: true,
    } as UserSettingsRow['privacy'],

    security: {
      mfaEnabled: false,
    } as UserSettingsRow['security'],

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
  selectedRows?: UserSettingsRow[];
  insertedRows?: UserSettingsRow[];
  updatedRows?: UserSettingsRow[] | DeletedUserSettingsRow[];
} = {}) {
  const selectLimit = vi.fn().mockResolvedValue(selectedRows);

  const selectResult = {
    limit: selectLimit,
  };

  const selectWhere = vi.fn(() => selectResult);
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

function toExpectedContract(row: UserSettingsRow) {
  return {
    id: row.id,
    userId: row.userId,

    metadata: row.metadata,
    accessibility: row.accessibility,
    appearance: row.appearance,
    communication: row.communication,
    notifications: row.notifications,
    privacy: row.privacy,
    security: row.security,

    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

describe('DrizzleUserSettingsRepository', () => {
  it('finds active settings for a user', async () => {
    const row = createUserSettingsRow();
    const databaseMock = createDatabaseMock({
      selectedRows: [row],
    });

    const repository = new DrizzleUserSettingsRepository(
      databaseMock.database,
    );

    const result = await repository.findByUserId(row.userId);

    expect(result).toEqual(toExpectedContract(row));

    expect(databaseMock.select).toHaveBeenCalledOnce();
    expect(databaseMock.selectFrom).toHaveBeenCalledWith(
      userSettingsTable,
    );
    expect(databaseMock.selectLimit).toHaveBeenCalledWith(1);
  });

  it('returns null when settings do not exist for a user', async () => {
    const databaseMock = createDatabaseMock();

    const repository = new DrizzleUserSettingsRepository(
      databaseMock.database,
    );

    const result = await repository.findByUserId('missing_user');

    expect(result).toBeNull();
  });

  it('creates and returns default user settings', async () => {
    const row = createUserSettingsRow();
    const databaseMock = createDatabaseMock({
      insertedRows: [row],
    });

    const repository = new DrizzleUserSettingsRepository(
      databaseMock.database,
    );

    const result = await repository.create({
      userId: row.userId,
    });

    expect(result).toEqual(toExpectedContract(row));

    expect(databaseMock.insert).toHaveBeenCalledWith(
      userSettingsTable,
    );

    expect(databaseMock.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: row.userId,
      }),
    );
  });

  it('throws when creating settings does not return a row', async () => {
    const databaseMock = createDatabaseMock();

    const repository = new DrizzleUserSettingsRepository(
      databaseMock.database,
    );

    await expect(
      repository.create({
        userId: 'user_123',
      }),
    ).rejects.toThrow();
  });

  it('updates and returns user settings', async () => {
    const existingRow = createUserSettingsRow();

    const updatedRow = createUserSettingsRow({
      appearance: {
        compactMode: true,
        theme: 'dark',
      } as UserSettingsRow['appearance'],
      updatedAt: new Date('2026-06-21T00:00:00.000Z'),
    });

    const databaseMock = createDatabaseMock({
      selectedRows: [existingRow],
      updatedRows: [updatedRow],
    });

    const repository = new DrizzleUserSettingsRepository(
      databaseMock.database,
    );

    const result = await repository.update(updatedRow.userId, {
      appearance: updatedRow.appearance,
    });

    expect(result).toEqual(toExpectedContract(updatedRow));

    expect(databaseMock.select).toHaveBeenCalledOnce();
    expect(databaseMock.update).toHaveBeenCalledWith(
      userSettingsTable,
    );

    expect(databaseMock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        accessibility: existingRow.accessibility,
        appearance: updatedRow.appearance,
        communication: existingRow.communication,
        notifications: existingRow.notifications,
        privacy: existingRow.privacy,
        security: existingRow.security,
        updatedAt: expect.any(Date),
      }),
    );
  });

  it('returns null when updating settings that do not exist', async () => {
    const databaseMock = createDatabaseMock();

    const repository = new DrizzleUserSettingsRepository(
      databaseMock.database,
    );

    const result = await repository.update('missing_user', {
      appearance: {
        compactMode: true,
        theme: 'dark',
      } as UserSettingsRow['appearance'],
    });

    expect(result).toBeNull();
    expect(databaseMock.update).not.toHaveBeenCalled();
  });

  it('soft deletes existing user settings', async () => {
    const databaseMock = createDatabaseMock({
      updatedRows: [
        {
          id: 'settings_123',
        },
      ],
    });

    const repository = new DrizzleUserSettingsRepository(
      databaseMock.database,
    );

    const result = await repository.softDeleteByUserId('user_123');

    expect(result).toBe(true);
    expect(databaseMock.update).toHaveBeenCalledWith(
      userSettingsTable,
    );

    expect(databaseMock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    );
  });

  it('returns false when there are no settings to soft delete', async () => {
    const databaseMock = createDatabaseMock();

    const repository = new DrizzleUserSettingsRepository(
      databaseMock.database,
    );

    const result = await repository.softDeleteByUserId('missing_user');

    expect(result).toBe(false);
  });
});
