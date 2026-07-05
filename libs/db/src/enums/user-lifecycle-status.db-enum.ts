// libs/db/src/enums/user-lifecycle-status.db-enum.ts

import { pgEnum } from 'drizzle-orm/pg-core'

import { UserLifecycleStatus } from '@aerealith-ai/core'

/**
 * PostgreSQL enum for the user account lifecycle.
 *
 * Values come directly from core so application and database values
 * stay aligned.
 */
export const userLifecycleStatusDbEnum = pgEnum(
  'user_lifecycle_status',
  Object.values(UserLifecycleStatus) as [string, ...string[]],
)
