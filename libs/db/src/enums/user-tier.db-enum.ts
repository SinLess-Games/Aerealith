// libs/db/src/enums/user-tier.db-enum.ts

import { pgEnum } from 'drizzle-orm/pg-core'

import { UserTier } from '@aerealith-ai/core'

/**
 * PostgreSQL enum for user subscription or access tiers.
 *
 * Values come directly from core so application and database values
 * stay aligned.
 */
export const userTierDbEnum = pgEnum(
  'user_tier',
  Object.values(UserTier) as [string, ...string[]],
)
