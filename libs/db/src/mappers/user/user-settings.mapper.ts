// libs/db/src/mappers/user/user-settings.mapper.ts

import {
  UserSettingsEntity,
  type UserSettingsContract,
} from '@aerealith-ai/core';

import type {
  NewUserSettingsRow,
  UserSettingsRow,
} from '../../schema';

/**
 * Converts a database user-settings row into the core entity.
 */
export function toUserSettingsEntity(
  row: UserSettingsRow,
): UserSettingsEntity {
  return new UserSettingsEntity({
    id: row.id,
    userId: row.userId,

    metadata: row.metadata,
    accessibility: row.accessibility,
    appearance: row.appearance,
    communication: row.communication,
    notifications: row.notifications,
    privacy: row.privacy,
    security: row.security,

    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  });
}

/**
 * Converts a core user-settings entity into an API-safe contract.
 */
export function toUserSettingsContract(
  entity: UserSettingsEntity,
): UserSettingsContract {
  return {
    id: entity.id,
    userId: entity.userId,

    metadata: entity.metadata,
    accessibility: entity.accessibility,
    appearance: entity.appearance,
    communication: entity.communication,
    notifications: entity.notifications,
    privacy: entity.privacy,
    security: entity.security,

    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

/**
 * Converts a core user-settings entity into a database insert row.
 *
 * The database generates the record ID and timestamps.
 */
export function toNewUserSettingsRow(
  entity: UserSettingsEntity,
): NewUserSettingsRow {
  return {
    userId: entity.userId,

    metadata: entity.metadata,
    accessibility: entity.accessibility,
    appearance: entity.appearance,
    communication: entity.communication,
    notifications: entity.notifications,
    privacy: entity.privacy,
    security: entity.security,
  };
}
