// libs/db/src/enums/user-consent-type.db-enum.ts

import { pgEnum } from 'drizzle-orm/pg-core';

import { UserConsentType } from '@aerealith-ai/core';

/**
 * PostgreSQL enum for user consent categories.
 *
 * Values come directly from core so application and database values
 * stay aligned.
 */
export const userConsentTypeDbEnum = pgEnum(
  'user_consent_type',
  Object.values(UserConsentType) as [string, ...string[]],
);
