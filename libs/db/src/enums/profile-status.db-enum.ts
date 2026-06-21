// libs/db/src/enums/profile-status.db-enum.ts

import { pgEnum } from 'drizzle-orm/pg-core';

import { ProfileStatus } from '@aerealith-ai/core';

/**
 * PostgreSQL enum for user profile setup and lifecycle status.
 *
 * Values come directly from core so application and database values
 * stay in sync.
 */
export const profileStatusDbEnum = pgEnum(
  'profile_status',
  Object.values(ProfileStatus) as [string, ...string[]],
);
