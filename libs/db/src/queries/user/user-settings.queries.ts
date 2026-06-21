// libs/db/src/queries/user/user-settings.queries.ts

import { and, eq, isNull } from 'drizzle-orm';

import { userSettingsTable } from '../../schema';

/**
 * Builds a query condition for active user settings by ID.
 *
 * Soft-deleted settings records are excluded.
 */
export function activeUserSettingsById(id: string) {
  return and(
    eq(userSettingsTable.id, id),
    isNull(userSettingsTable.deletedAt),
  );
}

/**
 * Builds a query condition for active settings belonging to a user.
 *
 * Soft-deleted settings records are excluded.
 */
export function activeUserSettingsByUserId(userId: string) {
  return and(
    eq(userSettingsTable.userId, userId),
    isNull(userSettingsTable.deletedAt),
  );
}

/**
 * Builds a query condition for user settings, including soft-deleted records.
 */
export function userSettingsByUserId(userId: string) {
  return eq(userSettingsTable.userId, userId);
}
