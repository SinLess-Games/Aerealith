// libs/db/src/repositories/user/drizzle-user-preferences.repository.spec.ts

import { describe, expect, it, vi } from 'vitest'

import type { DatabaseClient } from '../../client'
import { type UserPreferencesRow, userPreferencesTable } from '../../schema'
import { DrizzleUserPreferencesRepository } from './drizzle-user-preferences.repository'

type DeletedUserPreferencesRow = {
  id: string
}

function createUserPreferencesRow(
  overrides: Partial<UserPreferencesRow> = {},
): UserPreferencesRow {
  return {
    id: 'preferences_123',
    userId: 'user_123',

    locale: 'en-US',
    timezone: 'America/Boise',
    timezoneUtc: 'UTC-07:00' as UserPreferencesRow['timezoneUtc'],
    timezoneGreenwich: 'GMT-07:00' as UserPreferencesRow['timezoneGreenwich'],

    dateFormat: 'YYYY-MM-DD' as UserPreferencesRow['dateFormat'],
    timeFormat: '12h' as UserPreferencesRow['timeFormat'],
    weekStartDay: 'sunday' as UserPreferencesRow['weekStartDay'],
    nameDisplayOrder: 'given_family' as UserPreferencesRow['nameDisplayOrder'],
    measurementSystem: 'imperial' as UserPreferencesRow['measurementSystem'],
    contentMaturity: 'standard' as UserPreferencesRow['contentMaturity'],

    createdAt: new Date('2026-06-20T00:00:00.000Z'),
    updatedAt: new Date('2026-06-20T00:00:00.000Z'),
    deletedAt: null,

    ...overrides,
  }
}

function createDatabaseMock({
  selectedRows = [],
  insertedRows = [],
  updatedRows = [],
}: {
  selectedRows?: UserPreferencesRow[]
  insertedRows?: UserPreferencesRow[]
  updatedRows?: UserPreferencesRow[] | DeletedUserPreferencesRow[]
} = {}) {
  const selectLimit = vi.fn().mockResolvedValue(selectedRows)

  const selectResult = {
    limit: selectLimit,
    then<TResult1 = UserPreferencesRow[], TResult2 = never>(
      onfulfilled?:
        | ((value: UserPreferencesRow[]) => TResult1 | PromiseLike<TResult1>)
        | null,
      onrejected?:
        ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2> {
      return Promise.resolve(selectedRows).then(onfulfilled, onrejected)
    },
  }

  const selectWhere = vi.fn(() => selectResult)
  const selectFrom = vi.fn(() => ({
    where: selectWhere,
  }))
  const select = vi.fn(() => ({
    from: selectFrom,
  }))

  const insertReturning = vi.fn().mockResolvedValue(insertedRows)
  const insertValues = vi.fn(() => ({
    returning: insertReturning,
  }))
  const insert = vi.fn(() => ({
    values: insertValues,
  }))

  const updateReturning = vi.fn().mockResolvedValue(updatedRows)
  const updateWhere = vi.fn(() => ({
    returning: updateReturning,
  }))
  const updateSet = vi.fn(() => ({
    where: updateWhere,
  }))
  const update = vi.fn(() => ({
    set: updateSet,
  }))

  const database = {
    select,
    insert,
    update,
  } as unknown as DatabaseClient

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
  }
}

function toExpectedContract(row: UserPreferencesRow) {
  return {
    id: row.id,
    userId: row.userId,

    locale: row.locale,
    timezone: row.timezone,
    timezoneUtc: row.timezoneUtc,
    timezoneGreenwich: row.timezoneGreenwich,

    dateFormat: row.dateFormat,
    timeFormat: row.timeFormat,
    weekStartDay: row.weekStartDay,
    nameDisplayOrder: row.nameDisplayOrder,
    measurementSystem: row.measurementSystem,
    contentMaturity: row.contentMaturity,

    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

describe('DrizzleUserPreferencesRepository', () => {
  it('finds active preferences for a user', async () => {
    const row = createUserPreferencesRow()
    const databaseMock = createDatabaseMock({
      selectedRows: [row],
    })

    const repository = new DrizzleUserPreferencesRepository(
      databaseMock.database,
    )

    const result = await repository.findByUserId(row.userId)

    expect(result).toEqual(toExpectedContract(row))

    expect(databaseMock.select).toHaveBeenCalledOnce()
    expect(databaseMock.selectFrom).toHaveBeenCalledWith(userPreferencesTable)
    expect(databaseMock.selectLimit).toHaveBeenCalledWith(1)
  })

  it('returns null when preferences do not exist for a user', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserPreferencesRepository(
      databaseMock.database,
    )

    const result = await repository.findByUserId('missing_user')

    expect(result).toBeNull()
  })

  it('creates and returns user preferences', async () => {
    const row = createUserPreferencesRow()
    const databaseMock = createDatabaseMock({
      insertedRows: [row],
    })

    const repository = new DrizzleUserPreferencesRepository(
      databaseMock.database,
    )

    const result = await repository.create({
      userId: row.userId,
    })

    expect(result).toEqual(toExpectedContract(row))

    expect(databaseMock.insert).toHaveBeenCalledWith(userPreferencesTable)

    expect(databaseMock.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: row.userId,
      }),
    )
  })

  it('throws when creating preferences does not return a row', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserPreferencesRepository(
      databaseMock.database,
    )

    await expect(
      repository.create({
        userId: 'user_123',
      }),
    ).rejects.toThrow()
  })

  it('updates and returns user preferences', async () => {
    const row = createUserPreferencesRow({
      locale: 'fr-CA',
      timezone: 'America/Toronto',
      updatedAt: new Date('2026-06-21T00:00:00.000Z'),
    })

    const databaseMock = createDatabaseMock({
      updatedRows: [row],
    })

    const repository = new DrizzleUserPreferencesRepository(
      databaseMock.database,
    )

    const result = await repository.update(row.userId, {
      locale: 'fr-CA',
      timezone: 'America/Toronto',
    })

    expect(result).toEqual(toExpectedContract(row))

    expect(databaseMock.update).toHaveBeenCalledWith(userPreferencesTable)

    expect(databaseMock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'fr-CA',
        timezone: 'America/Toronto',
        updatedAt: expect.any(Date),
      }),
    )
  })

  it('updates every optional preference field', async () => {
    const row = createUserPreferencesRow()
    const databaseMock = createDatabaseMock({ updatedRows: [row] })
    const repository = new DrizzleUserPreferencesRepository(
      databaseMock.database,
    )

    await repository.update(row.userId, {
      locale: row.locale,
      timezone: row.timezone,
      timezoneUtc: row.timezoneUtc,
      timezoneGreenwich: row.timezoneGreenwich,
      dateFormat: row.dateFormat,
      timeFormat: row.timeFormat,
      weekStartDay: row.weekStartDay,
      nameDisplayOrder: row.nameDisplayOrder,
      measurementSystem: row.measurementSystem,
      contentMaturity: row.contentMaturity,
    })

    expect(databaseMock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        timezoneUtc: row.timezoneUtc,
        timezoneGreenwich: row.timezoneGreenwich,
        dateFormat: row.dateFormat,
        timeFormat: row.timeFormat,
        weekStartDay: row.weekStartDay,
        nameDisplayOrder: row.nameDisplayOrder,
        measurementSystem: row.measurementSystem,
        contentMaturity: row.contentMaturity,
      }),
    )
  })

  it('returns existing preferences when an update has no values', async () => {
    const row = createUserPreferencesRow()
    const databaseMock = createDatabaseMock({ selectedRows: [row] })
    const repository = new DrizzleUserPreferencesRepository(
      databaseMock.database,
    )

    await expect(repository.update(row.userId, {})).resolves.toEqual(
      toExpectedContract(row),
    )
    expect(databaseMock.update).not.toHaveBeenCalled()
  })

  it('returns null when updating preferences that do not exist', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserPreferencesRepository(
      databaseMock.database,
    )

    const result = await repository.update('missing_user', {
      locale: 'fr-CA',
    })

    expect(result).toBeNull()
  })

  it('soft deletes existing user preferences', async () => {
    const databaseMock = createDatabaseMock({
      updatedRows: [
        {
          id: 'preferences_123',
        },
      ],
    })

    const repository = new DrizzleUserPreferencesRepository(
      databaseMock.database,
    )

    const result = await repository.softDeleteByUserId('user_123')

    expect(result).toBe(true)
    expect(databaseMock.update).toHaveBeenCalledWith(userPreferencesTable)

    expect(databaseMock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    )
  })

  it('returns false when there are no preferences to soft delete', async () => {
    const databaseMock = createDatabaseMock()

    const repository = new DrizzleUserPreferencesRepository(
      databaseMock.database,
    )

    const result = await repository.softDeleteByUserId('missing_user')

    expect(result).toBe(false)
  })
})
