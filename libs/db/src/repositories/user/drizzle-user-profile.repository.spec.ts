// libs/db/src/repositories/user/drizzle-user-profile.repository.spec.ts

import { describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '../../client';
import {
  type UserProfileRow,
  userProfilesTable,
} from '../../schema';
import { DrizzleUserProfileRepository } from './drizzle-user-profile.repository';

type DeletedUserProfileRow = {
  id: string;
};

function createUserProfileRow(
  overrides: Partial<UserProfileRow> = {},
): UserProfileRow {
  return {
    id: 'profile_123',
    userId: 'user_123',

    handle: 'sinless777',

    displayName: 'Sinless',
    givenName: 'Andy',
    middleName: null,
    familyName: 'Pierce',
    pronouns: null,

    avatarUrl: 'https://cdn.aerealith.com/avatar.png',
    bannerUrl: 'https://cdn.aerealith.com/banner.png',
    bio: 'Building Aerealith.',

    status: 'pending_setup' as UserProfileRow['status'],
    fieldVisibility: {} as UserProfileRow['fieldVisibility'],

    locationLabel: 'Twin Falls, Idaho',
    country: 'US' as UserProfileRow['country'],

    gender: null,
    sex: null,
    sexuality: null,
    romanticOrientation: null,
    sexAttitude: null,

    languages: [] as UserProfileRow['languages'],
    websiteUrl: 'https://aerealith.com',
    links: [] as UserProfileRow['links'],

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
  selectedRows?: UserProfileRow[];
  insertedRows?: UserProfileRow[];
  updatedRows?: UserProfileRow[] | DeletedUserProfileRow[];
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

function toExpectedContract(row: UserProfileRow) {
  return {
    id: row.id,
    userId: row.userId,

    handle: row.handle,

    displayName: row.displayName,
    givenName: row.givenName,
    middleName: row.middleName,
    familyName: row.familyName,
    pronouns: row.pronouns,

    avatarUrl: row.avatarUrl,
    bannerUrl: row.bannerUrl,
    bio: row.bio,

    status: row.status,
    fieldVisibility: row.fieldVisibility,

    locationLabel: row.locationLabel,
    country: row.country,

    gender: row.gender,
    sex: row.sex,
    sexuality: row.sexuality,
    romanticOrientation: row.romanticOrientation,
    sexAttitude: row.sexAttitude,

    languages: row.languages,
    websiteUrl: row.websiteUrl,
    links: row.links,

    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

describe('DrizzleUserProfileRepository', () => {
  it('finds an active profile by user ID', async () => {
    const row = createUserProfileRow();
    const databaseMock = createDatabaseMock({
      selectedRows: [row],
    });

    const repository = new DrizzleUserProfileRepository(
      databaseMock.database,
    );

    const result = await repository.findByUserId(row.userId);

    expect(result).toEqual(toExpectedContract(row));

    expect(databaseMock.select).toHaveBeenCalledOnce();
    expect(databaseMock.selectFrom).toHaveBeenCalledWith(
      userProfilesTable,
    );
    expect(databaseMock.selectLimit).toHaveBeenCalledWith(1);
  });

  it('returns null when a profile does not exist for a user', async () => {
    const databaseMock = createDatabaseMock();

    const repository = new DrizzleUserProfileRepository(
      databaseMock.database,
    );

    const result = await repository.findByUserId('missing_user');

    expect(result).toBeNull();
  });

  it('finds an active profile by handle', async () => {
    const row = createUserProfileRow();
    const databaseMock = createDatabaseMock({
      selectedRows: [row],
    });

    const repository = new DrizzleUserProfileRepository(
      databaseMock.database,
    );

    const result = await repository.findByHandle('  SINLESS777  ');

    expect(result).toEqual(toExpectedContract(row));
    expect(databaseMock.selectLimit).toHaveBeenCalledWith(1);
  });

  it('returns null when a profile does not exist for a handle', async () => {
    const databaseMock = createDatabaseMock();

    const repository = new DrizzleUserProfileRepository(
      databaseMock.database,
    );

    const result = await repository.findByHandle('missing_handle');

    expect(result).toBeNull();
  });

  it('creates and returns a user profile', async () => {
    const row = createUserProfileRow();
    const databaseMock = createDatabaseMock({
      insertedRows: [row],
    });

    const repository = new DrizzleUserProfileRepository(
      databaseMock.database,
    );

    const result = await repository.create({
      userId: row.userId,
      handle: '  Sinless777  ',
      displayName: '  Sinless  ',
      givenName: '  Andy  ',
      familyName: '  Pierce  ',
      bio: '  Building Aerealith.  ',
      websiteUrl: '  https://aerealith.com  ',
    });

    expect(result).toEqual(toExpectedContract(row));

    expect(databaseMock.insert).toHaveBeenCalledWith(userProfilesTable);

    expect(databaseMock.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: row.userId,
        handle: 'sinless777',
        displayName: 'Sinless',
        givenName: 'Andy',
        familyName: 'Pierce',
        bio: 'Building Aerealith.',
        websiteUrl: 'https://aerealith.com',
      }),
    );
  });

  it('throws when creating a profile does not return a row', async () => {
    const databaseMock = createDatabaseMock();

    const repository = new DrizzleUserProfileRepository(
      databaseMock.database,
    );

    await expect(
      repository.create({
        userId: 'user_123',
        handle: 'sinless777',
      }),
    ).rejects.toThrow();
  });

  it('updates and returns a user profile', async () => {
    const row = createUserProfileRow({
      displayName: 'Updated Sinless',
      bio: 'Updated bio.',
      updatedAt: new Date('2026-06-21T00:00:00.000Z'),
    });

    const databaseMock = createDatabaseMock({
      updatedRows: [row],
    });

    const repository = new DrizzleUserProfileRepository(
      databaseMock.database,
    );

    const result = await repository.update(row.userId, {
      displayName: '  Updated Sinless  ',
      bio: '  Updated bio.  ',
    });

    expect(result).toEqual(toExpectedContract(row));

    expect(databaseMock.update).toHaveBeenCalledWith(userProfilesTable);

    expect(databaseMock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Updated Sinless',
        bio: 'Updated bio.',
        updatedAt: expect.any(Date),
      }),
    );
  });

  it('returns null when updating a profile that does not exist', async () => {
    const databaseMock = createDatabaseMock();

    const repository = new DrizzleUserProfileRepository(
      databaseMock.database,
    );

    const result = await repository.update('missing_user', {
      displayName: 'Updated Sinless',
    });

    expect(result).toBeNull();
  });

  it('soft deletes an existing user profile', async () => {
    const databaseMock = createDatabaseMock({
      updatedRows: [
        {
          id: 'profile_123',
        },
      ],
    });

    const repository = new DrizzleUserProfileRepository(
      databaseMock.database,
    );

    const result = await repository.softDeleteByUserId('user_123');

    expect(result).toBe(true);
    expect(databaseMock.update).toHaveBeenCalledWith(
      userProfilesTable,
    );

    expect(databaseMock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    );
  });

  it('returns false when there is no profile to soft delete', async () => {
    const databaseMock = createDatabaseMock();

    const repository = new DrizzleUserProfileRepository(
      databaseMock.database,
    );

    const result = await repository.softDeleteByUserId('missing_user');

    expect(result).toBe(false);
  });
});
