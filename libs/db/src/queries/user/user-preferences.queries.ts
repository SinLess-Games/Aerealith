// libs/db/src/queries/user/user-preferences.queries.ts

import { and, eq, isNull } from 'drizzle-orm'

import { userPreferencesTable } from '../../schema'

/**
 * Builds a query condition for active user preferences by ID.
 *
 * Soft-deleted preference records are excluded.
 */
export function activeUserPreferencesById(id: string) {
  return and(
    eq(userPreferencesTable.id, id),
    isNull(userPreferencesTable.deletedAt),
  )
}

/**
 * Builds a query condition for active preferences belonging to a user.
 *
 * Soft-deleted preference records are excluded.
 */
export function activeUserPreferencesByUserId(userId: string) {
  return and(
    eq(userPreferencesTable.userId, userId),
    isNull(userPreferencesTable.deletedAt),
  )
}

/**
 * Builds a query condition for user preferences, including soft-deleted records.
 */
export function userPreferencesByUserId(userId: string) {
  return eq(userPreferencesTable.userId, userId)
}
