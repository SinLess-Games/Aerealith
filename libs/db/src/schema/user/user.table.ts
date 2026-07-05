// libs/db/src/schema/user/user.table.ts

import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import {
  DefaultUserRole,
  DefaultUserTier,
  UserLifecycleStatus,
} from '@aerealith-ai/core'

import {
  userLifecycleStatusDbEnum,
  userRoleDbEnum,
  userTierDbEnum,
} from '../../enums'

/**
 * Stores the primary Aerealith user account record.
 *
 * Related user tables reference this table:
 * - user_profiles
 * - user_preferences
 * - user_settings
 * - user_sessions
 * - user_consents
 * - user_accounts
 */
export const usersTable = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    username: varchar('username', {
      length: 32,
    }).notNull(),

    email: varchar('email', {
      length: 320,
    }).notNull(),

    passwordHash: text('password_hash'),

    status: userLifecycleStatusDbEnum('status')
      .default(UserLifecycleStatus.Active)
      .notNull(),

    emailVerified: boolean('email_verified').default(false).notNull(),

    emailVerifiedAt: timestamp('email_verified_at', {
      withTimezone: true,
      mode: 'date',
    }),

    role: userRoleDbEnum('role').default(DefaultUserRole).notNull(),

    tier: userTierDbEnum('tier').default(DefaultUserTier).notNull(),

    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),

    deletedAt: timestamp('deleted_at', {
      withTimezone: true,
      mode: 'date',
    }),
  },
  (table) => [
    uniqueIndex('users_username_unique').on(table.username),
    uniqueIndex('users_email_unique').on(table.email),
    index('users_status_index').on(table.status),
    index('users_created_at_index').on(table.createdAt),
  ],
)

export type UserRow = typeof usersTable.$inferSelect
export type NewUserRow = typeof usersTable.$inferInsert
