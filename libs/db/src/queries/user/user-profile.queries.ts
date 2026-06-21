// libs/db/src/queries/user/user-profile.queries.ts

import { and, eq, isNull } from 'drizzle-orm';

import { userProfilesTable } from '../../schema';

/**
 * Builds a query condition for an active user profile by ID.
 *
 * Soft-deleted profile records are excluded.
 */
export function activeUserProfileById(id: string) {
  return and(
    eq(userProfilesTable.id, id),
    isNull(userProfilesTable.deletedAt),
  );
}

/**
 * Builds a query condition for an active profile belonging to a user.
 *
 * Soft-deleted profile records are excluded.
 */
export function activeUserProfileByUserId(userId: string) {
  return and(
    eq(userProfilesTable.userId, userId),
    isNull(userProfilesTable.deletedAt),
  );
}

/**
 * Builds a query condition for an active profile by public handle.
 *
 * Soft-deleted profile records are excluded.
 */
export function activeUserProfileByHandle(handle: string) {
  return and(
    eq(userProfilesTable.handle, normalizeHandle(handle)),
    isNull(userProfilesTable.deletedAt),
  );
}

/**
 * Builds a query condition for a profile belonging to a user,
 * including soft-deleted records.
 */
export function userProfileByUserId(userId: string) {
  return eq(userProfilesTable.userId, userId);
}

/**
 * Builds a query condition for a profile by handle,
 * including soft-deleted records.
 */
export function userProfileByHandle(handle: string) {
  return eq(userProfilesTable.handle, normalizeHandle(handle));
}

function normalizeHandle(handle: string): string {
  return handle.trim().toLowerCase();
}
