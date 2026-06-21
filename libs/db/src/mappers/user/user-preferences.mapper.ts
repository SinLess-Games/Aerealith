// libs/db/src/mappers/user/user-preferences.mapper.ts

import {
  UserPreferencesEntity,
  type UserPreferencesContract,
} from '@aerealith-ai/core';

import type {
  NewUserPreferencesRow,
  UserPreferencesRow,
} from '../../schema';

/**
 * Converts a database user-preferences row into the core entity.
 */
export function toUserPreferencesEntity(
  row: UserPreferencesRow,
): UserPreferencesEntity {
  return new UserPreferencesEntity({
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
  });
}

/**
 * Converts a core user-preferences entity into an API-safe contract.
 */
export function toUserPreferencesContract(
  entity: UserPreferencesEntity,
): UserPreferencesContract {
  return {
    id: entity.id,
    userId: entity.userId,

    locale: entity.locale,
    timezone: entity.timezone,
    timezoneUtc: entity.timezoneUtc,
    timezoneGreenwich: entity.timezoneGreenwich,

    dateFormat: entity.dateFormat,
    timeFormat: entity.timeFormat,
    weekStartDay: entity.weekStartDay,
    nameDisplayOrder: entity.nameDisplayOrder,
    measurementSystem: entity.measurementSystem,
    contentMaturity: entity.contentMaturity,

    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

/**
 * Converts a core user-preferences entity into a database insert row.
 *
 * The database generates the record ID and timestamps.
 */
export function toNewUserPreferencesRow(
  entity: UserPreferencesEntity,
): NewUserPreferencesRow {
  return {
    userId: entity.userId,

    locale: entity.locale,
    timezone: entity.timezone,
    timezoneUtc: entity.timezoneUtc,
    timezoneGreenwich: entity.timezoneGreenwich,

    dateFormat: entity.dateFormat,
    timeFormat: entity.timeFormat,
    weekStartDay: entity.weekStartDay,
    nameDisplayOrder: entity.nameDisplayOrder,
    measurementSystem: entity.measurementSystem,
    contentMaturity: entity.contentMaturity,
  };
}
