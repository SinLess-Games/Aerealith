// libs/db/src/schema/user/user-settings.table.ts

import {
  index,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import type {
  UserAccessibilitySettings,
  UserAppearanceSettings,
  UserCommunicationSettings,
  UserNotificationSettings,
  UserPrivacySettings,
  UserSecuritySettings,
  UserSettingsMetadata,
} from '@aerealith-ai/core'

import { usersTable } from './user.table'

/**
 * Stores application settings for a user.
 *
 * Each user has one settings record. Individual settings groups are stored as
 * JSON so new settings can be added without requiring a database migration.
 */
export const userSettingsTable = pgTable(
  'user_settings',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, {
        onDelete: 'cascade',
      }),

    metadata: jsonb('metadata')
      .$type<UserSettingsMetadata>()
      .default({
        schemaVersion: 1,
      })
      .notNull(),

    accessibility: jsonb('accessibility')
      .$type<UserAccessibilitySettings>()
      .default({
        reduceMotion: false,
        highContrast: false,
        textScale: 1,
      })
      .notNull(),

    appearance: jsonb('appearance')
      .$type<UserAppearanceSettings>()
      .default({
        theme: 'system',
        compactMode: false,
      })
      .notNull(),

    communication: jsonb('communication')
      .$type<UserCommunicationSettings>()
      .default({
        progressUpdates: true,
        quietMode: false,
      })
      .notNull(),

    notifications: jsonb('notifications')
      .$type<UserNotificationSettings>()
      .default({
        email: true,
        push: false,
        productUpdates: true,
        securityAlerts: true,
      })
      .notNull(),

    privacy: jsonb('privacy')
      .$type<UserPrivacySettings>()
      .default({
        analytics: false,
        personalization: true,
      })
      .notNull(),

    security: jsonb('security')
      .$type<UserSecuritySettings>()
      .default({
        mfaEnabled: false,
      })
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
    uniqueIndex('user_settings_user_id_unique').on(table.userId),
    index('user_settings_created_at_index').on(table.createdAt),
  ],
)

export type UserSettingsRow = typeof userSettingsTable.$inferSelect

export type NewUserSettingsRow = typeof userSettingsTable.$inferInsert
