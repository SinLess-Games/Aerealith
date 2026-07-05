// libs/db/src/enums/user-account-status.db-enum.ts

import { pgEnum } from 'drizzle-orm/pg-core'

import type { UserAccountStatus } from '@aerealith-ai/core'

export const userAccountStatusDbValues = [
  'active',
  'revoked',
  'suspended',
  'expired',
] as const satisfies readonly [UserAccountStatus, ...UserAccountStatus[]]

/**
 * PostgreSQL enum for linked account status.
 *
 * UserAccountStatus is currently a type-only core union, so these values are
 * checked against that core type to keep database values aligned.
 */
export const userAccountStatusDbEnum = pgEnum(
  'user_account_status',
  userAccountStatusDbValues,
)
