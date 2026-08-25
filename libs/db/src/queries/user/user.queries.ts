// libs/db/src/queries/user/user.queries.ts

import { and, eq, isNotNull, isNull } from 'drizzle-orm';

import { UserLifecycleStatus } from '@aerealith-ai/core';

import { usersTable } from '../../schema';

/**
 * Builds a query condition for an active user by ID.
 *
 * Soft-deleted users are excluded.
 */
export function activeUserById(id: string) {
  return and(eq(usersTable.id, id), isNull(usersTable.deletedAt));
}

/**
 * Finds a user that may continue authenticating through an existing session.
 * Lifecycle and verification changes therefore take effect immediately,
 * without waiting for every previously issued session to expire.
 */
export function authenticationEligibleUserById(id: string) {
  return and(
    eq(usersTable.id, id),
    eq(usersTable.status, UserLifecycleStatus.Active),
    eq(usersTable.emailVerified, true),
    isNotNull(usersTable.emailVerifiedAt),
    isNull(usersTable.deletedAt),
  );
}

/**
 * Builds a query condition for an active user by username.
 *
 * Soft-deleted users are excluded.
 */
export function activeUserByUsername(username: string) {
  return and(
    eq(usersTable.username, normalizeUsername(username)),
    isNull(usersTable.deletedAt),
  );
}

/**
 * Builds a query condition for an active user by email address.
 *
 * Soft-deleted users are excluded.
 */
export function activeUserByEmail(email: string) {
  return and(
    eq(usersTable.email, normalizeEmail(email)),
    isNull(usersTable.deletedAt),
  );
}

/**
 * Builds a query condition for a user by ID,
 * including soft-deleted users.
 */
export function userById(id: string) {
  return eq(usersTable.id, id);
}

/**
 * Builds a query condition for a user by username,
 * including soft-deleted users.
 */
export function userByUsername(username: string) {
  return eq(usersTable.username, normalizeUsername(username));
}

/**
 * Builds a query condition for a user by email address,
 * including soft-deleted users.
 */
export function userByEmail(email: string) {
  return eq(usersTable.email, normalizeEmail(email));
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
