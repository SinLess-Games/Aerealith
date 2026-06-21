// libs/db/src/queries/user/user-consent.queries.ts

import type { UserConsentType } from '@aerealith-ai/core';
import { and, eq, isNull } from 'drizzle-orm';

import { userConsentsTable } from '../../schema';

/**
 * Builds a query condition for an active user consent by ID.
 *
 * Soft-deleted consent records are excluded.
 */
export function activeUserConsentById(id: string) {
  return and(
    eq(userConsentsTable.id, id),
    isNull(userConsentsTable.deletedAt),
  );
}

/**
 * Builds a query condition for an active consent record for a user and type.
 *
 * Soft-deleted consent records are excluded.
 */
export function activeUserConsentByUserIdAndType(
  userId: string,
  type: UserConsentType,
) {
  return and(
    eq(userConsentsTable.userId, userId),
    eq(userConsentsTable.type, type),
    isNull(userConsentsTable.deletedAt),
  );
}

/**
 * Builds a query condition for every active consent record belonging to a user.
 *
 * Soft-deleted consent records are excluded.
 */
export function activeUserConsentsByUserId(userId: string) {
  return and(
    eq(userConsentsTable.userId, userId),
    isNull(userConsentsTable.deletedAt),
  );
}

/**
 * Builds a query condition for all consent records belonging to a user,
 * including soft-deleted records.
 */
export function userConsentsByUserId(userId: string) {
  return eq(userConsentsTable.userId, userId);
}
