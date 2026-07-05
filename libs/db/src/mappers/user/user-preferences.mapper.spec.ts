// libs/db/src/mappers/user/user-preferences.mapper.spec.ts

import { UserPreferencesEntity } from '@aerealith-ai/core'
import { describe, expect, it } from 'vitest'

import type { UserPreferencesRow } from '../../schema'
import {
  toNewUserPreferencesRow,
  toUserPreferencesContract,
  toUserPreferencesEntity,
} from './user-preferences.mapper'

function createUserPreferencesRow(
  overrides: Partial<UserPreferencesRow> = {},
): UserPreferencesRow {
  return {
    id: 'preferences_123',
    userId: 'user_123',

    locale: 'en-US',
    timezone: 'America/Boise',
    timezoneUtc: 'UTC-06:00' as UserPreferencesRow['timezoneUtc'],
    timezoneGreenwich: 'GMT-06:00' as UserPreferencesRow['timezoneGreenwich'],

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

describe('user preferences mapper', () => {
  it('converts a database row into a user preferences entity', () => {
    const row = createUserPreferencesRow()

    const entity = toUserPreferencesEntity(row)

    expect(entity).toBeInstanceOf(UserPreferencesEntity)

    expect(entity).toEqual(
      expect.objectContaining({
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

        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
      }),
    )
  })

  it('preserves a soft-deletion timestamp when converting to an entity', () => {
    const deletedAt = new Date('2026-06-21T00:00:00.000Z')

    const entity = toUserPreferencesEntity(
      createUserPreferencesRow({
        deletedAt,
      }),
    )

    expect(entity.deletedAt).toBe(deletedAt)
  })

  it('converts a user preferences entity into a database insert row', () => {
    const row = createUserPreferencesRow()
    const entity = toUserPreferencesEntity(row)

    const newRow = toNewUserPreferencesRow(entity)

    expect(newRow).toEqual({
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
    })
  })

  it('converts an entity into a public user preferences contract', () => {
    const row = createUserPreferencesRow()
    const entity = toUserPreferencesEntity(row)

    const contract = toUserPreferencesContract(entity)

    expect(contract).toEqual(
      expect.objectContaining({
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
      }),
    )
  })

  it('does not expose the soft-deletion timestamp in the contract', () => {
    const entity = toUserPreferencesEntity(
      createUserPreferencesRow({
        deletedAt: new Date('2026-06-21T00:00:00.000Z'),
      }),
    )

    const contract = toUserPreferencesContract(entity)

    expect(contract).not.toHaveProperty('deletedAt')
  })

  it('preserves locale and timezone preferences through every mapper boundary', () => {
    const row = createUserPreferencesRow({
      locale: 'fr-CA',
      timezone: 'America/Toronto',
      timezoneUtc: 'UTC-04:00' as UserPreferencesRow['timezoneUtc'],
      timezoneGreenwich: 'GMT-04:00' as UserPreferencesRow['timezoneGreenwich'],
    })

    const entity = toUserPreferencesEntity(row)
    const contract = toUserPreferencesContract(entity)

    expect(entity.locale).toBe('fr-CA')
    expect(entity.timezone).toBe('America/Toronto')
    expect(entity.timezoneUtc).toBe('UTC-04:00')
    expect(entity.timezoneGreenwich).toBe('GMT-04:00')

    expect(contract.locale).toBe('fr-CA')
    expect(contract.timezone).toBe('America/Toronto')
    expect(contract.timezoneUtc).toBe('UTC-04:00')
    expect(contract.timezoneGreenwich).toBe('GMT-04:00')
  })

  it('preserves display and content preferences through every mapper boundary', () => {
    const row = createUserPreferencesRow({
      dateFormat: 'MM/DD/YYYY' as UserPreferencesRow['dateFormat'],
      timeFormat: '24h' as UserPreferencesRow['timeFormat'],
      weekStartDay: 'monday' as UserPreferencesRow['weekStartDay'],
      nameDisplayOrder:
        'family_given' as UserPreferencesRow['nameDisplayOrder'],
      measurementSystem: 'metric' as UserPreferencesRow['measurementSystem'],
      contentMaturity: 'mature' as UserPreferencesRow['contentMaturity'],
    })

    const entity = toUserPreferencesEntity(row)
    const contract = toUserPreferencesContract(entity)

    expect(entity.dateFormat).toBe('MM/DD/YYYY')
    expect(entity.timeFormat).toBe('24h')
    expect(entity.weekStartDay).toBe('monday')
    expect(entity.nameDisplayOrder).toBe('family_given')
    expect(entity.measurementSystem).toBe('metric')
    expect(entity.contentMaturity).toBe('mature')

    expect(contract.dateFormat).toBe('MM/DD/YYYY')
    expect(contract.timeFormat).toBe('24h')
    expect(contract.weekStartDay).toBe('monday')
    expect(contract.nameDisplayOrder).toBe('family_given')
    expect(contract.measurementSystem).toBe('metric')
    expect(contract.contentMaturity).toBe('mature')
  })
})
