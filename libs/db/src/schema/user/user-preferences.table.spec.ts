// libs/db/src/schema/user/user-preferences.table.spec.ts

import { getTableColumns, getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { userPreferencesTable } from './user-preferences.table'

describe('userPreferencesTable', () => {
  it('uses the correct database table name', () => {
    expect(getTableName(userPreferencesTable)).toBe('user_preferences')
  })

  it('defines the required columns', () => {
    const columns = getTableColumns(userPreferencesTable)

    expect(Object.keys(columns)).toEqual([
      'id',
      'userId',
      'locale',
      'timezone',
      'timezoneUtc',
      'timezoneGreenwich',
      'dateFormat',
      'timeFormat',
      'weekStartDay',
      'nameDisplayOrder',
      'measurementSystem',
      'contentMaturity',
      'createdAt',
      'updatedAt',
      'deletedAt',
    ])
  })

  it('requires a user ID', () => {
    const { userId } = getTableColumns(userPreferencesTable)

    expect(userId.notNull).toBe(true)
    expect(userId.hasDefault).toBe(false)
  })

  it('allows optional locale and timezone values', () => {
    const { locale, timezone, timezoneUtc, timezoneGreenwich } =
      getTableColumns(userPreferencesTable)

    expect(locale.notNull).toBe(false)
    expect(timezone.notNull).toBe(false)
    expect(timezoneUtc.notNull).toBe(false)
    expect(timezoneGreenwich.notNull).toBe(false)
  })

  it('requires preference values with database defaults', () => {
    const {
      dateFormat,
      timeFormat,
      weekStartDay,
      nameDisplayOrder,
      measurementSystem,
      contentMaturity,
    } = getTableColumns(userPreferencesTable)

    expect(dateFormat.notNull).toBe(true)
    expect(dateFormat.hasDefault).toBe(true)

    expect(timeFormat.notNull).toBe(true)
    expect(timeFormat.hasDefault).toBe(true)

    expect(weekStartDay.notNull).toBe(true)
    expect(weekStartDay.hasDefault).toBe(true)

    expect(nameDisplayOrder.notNull).toBe(true)
    expect(nameDisplayOrder.hasDefault).toBe(true)

    expect(measurementSystem.notNull).toBe(true)
    expect(measurementSystem.hasDefault).toBe(true)

    expect(contentMaturity.notNull).toBe(true)
    expect(contentMaturity.hasDefault).toBe(true)
  })

  it('generates IDs and record timestamps by default', () => {
    const { id, createdAt, updatedAt } = getTableColumns(userPreferencesTable)

    expect(id.notNull).toBe(true)
    expect(id.hasDefault).toBe(true)

    expect(createdAt.notNull).toBe(true)
    expect(createdAt.hasDefault).toBe(true)

    expect(updatedAt.notNull).toBe(true)
    expect(updatedAt.hasDefault).toBe(true)
  })

  it('allows soft deletion', () => {
    const { deletedAt } = getTableColumns(userPreferencesTable)

    expect(deletedAt.notNull).toBe(false)
  })
})
