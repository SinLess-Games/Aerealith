// libs/db/src/queries/user/user-session.queries.ts

import { and, eq, gt, isNull } from 'drizzle-orm';

import { userSessionsTable } from '../../schema';

/**
 * Builds a query condition for an active user session by ID.
 *
 * Revoked, expired, and soft-deleted sessions are excluded.
 */
export function activeUserSessionById(
  id: string,
  now: Date = new Date(),
) {
  return and(
    eq(userSessionsTable.id, id),
    isNull(userSessionsTable.revokedAt),
    isNull(userSessionsTable.deletedAt),
    gt(userSessionsTable.expiresAt, now),
  );
}

/**
 * Builds a query condition for an active user session by token hash.
 *
 * Revoked, expired, and soft-deleted sessions are excluded.
 */
export function activeUserSessionByTokenHash(
  tokenHash: string,
  now: Date = new Date(),
) {
  return and(
    eq(userSessionsTable.tokenHash, tokenHash),
    isNull(userSessionsTable.revokedAt),
    isNull(userSessionsTable.deletedAt),
    gt(userSessionsTable.expiresAt, now),
  );
}

/**
 * Builds a query condition for every active session belonging to a user.
 *
 * Revoked, expired, and soft-deleted sessions are excluded.
 */
export function activeUserSessionsByUserId(
  userId: string,
  now: Date = new Date(),
) {
  return and(
    eq(userSessionsTable.userId, userId),
    isNull(userSessionsTable.revokedAt),
    isNull(userSessionsTable.deletedAt),
    gt(userSessionsTable.expiresAt, now),
  );
}

/**
 * Builds a query condition for all sessions belonging to a user,
 * including revoked, expired, and soft-deleted sessions.
 */
export function userSessionsByUserId(userId: string) {
  return eq(userSessionsTable.userId, userId);
}

/**
 * Builds a query condition for all non-deleted sessions belonging to a user.
 *
 * Revoked and expired sessions are included.
 */
export function userSessionHistoryByUserId(userId: string) {
  return and(
    eq(userSessionsTable.userId, userId),
    isNull(userSessionsTable.deletedAt),
  );
}
