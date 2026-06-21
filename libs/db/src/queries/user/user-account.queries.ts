// libs/db/src/queries/user/user-account.queries.ts

import { and, eq, isNull } from 'drizzle-orm';

import { userAccountsTable } from '../../schema';

/**
 * Builds a query condition for an active user account by ID.
 *
 * Soft-deleted accounts are excluded.
 */
export function activeUserAccountById(id: string) {
  return and(
    eq(userAccountsTable.id, id),
    isNull(userAccountsTable.deletedAt),
  );
}

/**
 * Builds a query condition for an active user account by provider and
 * provider-specific account ID.
 *
 * Soft-deleted accounts are excluded.
 */
export function activeUserAccountByProviderAccount(
  provider: string,
  accountId: string,
) {
  return and(
    eq(userAccountsTable.provider, normalizeProvider(provider)),
    eq(userAccountsTable.accountId, accountId.trim()),
    isNull(userAccountsTable.deletedAt),
  );
}

/**
 * Builds a query condition for every active account connected to a user.
 *
 * Soft-deleted accounts are excluded.
 */
export function activeUserAccountsByUserId(userId: string) {
  return and(
    eq(userAccountsTable.userId, userId),
    isNull(userAccountsTable.deletedAt),
  );
}

/**
 * Builds a query condition for all accounts connected to a user,
 * including soft-deleted accounts.
 */
export function userAccountsByUserId(userId: string) {
  return eq(userAccountsTable.userId, userId);
}

function normalizeProvider(provider: string): string {
  return provider.trim().toLowerCase();
}
