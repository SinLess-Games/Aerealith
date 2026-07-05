// libs/db/src/enums/user-role.db-enum.ts

import { pgEnum } from 'drizzle-orm/pg-core'

import { UserRole } from '@aerealith-ai/core'

/**
 * PostgreSQL enum for user authorization roles.
 *
 * Values come directly from core so application and database values
 * stay aligned.
 */
export const userRoleDbEnum = pgEnum(
  'user_role',
  Object.values(UserRole) as [string, ...string[]],
)
