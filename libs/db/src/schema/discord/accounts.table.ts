import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import {
  DiscordAgeVerificationStatus,
  discordAgeVerificationMethodDbEnum,
  discordAgeVerificationStatusDbEnum,
} from '../../enums/discord';
import { userAccountsTable, usersTable } from '../user';
import type {
  DiscordAiUserSettings,
  DiscordNotificationSettings,
  DiscordPrivacySettings,
  JsonRecord,
} from './discord.types';

/**
 * Durable Discord identity. `discordUserId` is a lossless decimal string.
 * Linking is delegated to the canonical `user_accounts` record so billing,
 * authentication, and ownership never acquire a second user source of truth.
 */
export const discordAccountsTable = pgTable(
  'discord_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userAccountId: uuid('user_account_id').references(
      () => userAccountsTable.id,
      { onDelete: 'set null', onUpdate: 'cascade' },
    ),
    discordUserId: varchar('discord_user_id', { length: 20 }).notNull(),
    username: varchar('username', { length: 32 }).notNull(),
    globalDisplayName: varchar('global_display_name', { length: 100 }),
    discriminator: varchar('discriminator', { length: 4 }),
    avatarHash: varchar('avatar_hash', { length: 128 }),
    avatarDecoration: jsonb('avatar_decoration').$type<JsonRecord | null>(),
    bannerHash: varchar('banner_hash', { length: 128 }),
    accentColor: integer('accent_color'),
    isBot: boolean('is_bot').default(false).notNull(),
    isSystem: boolean('is_system').default(false).notNull(),
    publicFlags: varchar('public_flags', { length: 32 }).default('0').notNull(),
    userFlags: varchar('user_flags', { length: 32 }),
    locale: varchar('locale', { length: 35 }),
    oauthScopes: jsonb('oauth_scopes').$type<string[]>().default([]).notNull(),
    sourceMetadata: jsonb('source_metadata')
      .$type<JsonRecord>()
      .default({})
      .notNull(),
    firstSeenAt: timestamp('first_seen_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    lastSyncedAt: timestamp('last_synced_at', {
      withTimezone: true,
      mode: 'date',
    }),
    linkedAt: timestamp('linked_at', { withTimezone: true, mode: 'date' }),
    unlinkedAt: timestamp('unlinked_at', { withTimezone: true, mode: 'date' }),
    isLinkedActive: boolean('is_linked_active').default(false).notNull(),
    isUnavailable: boolean('is_unavailable').default(false).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_accounts_user_id_unique').on(table.discordUserId),
    uniqueIndex('discord_accounts_connected_account_unique').on(
      table.userAccountId,
    ),
    index('discord_accounts_last_seen_idx').on(table.lastSeenAt),
    check(
      'discord_accounts_snowflake_check',
      sql`${table.discordUserId} ~ '^[0-9]{1,20}$'`,
    ),
    check(
      'discord_accounts_link_state_check',
      sql`(${table.userAccountId} is null and ${table.isLinkedActive} = false) or ${table.userAccountId} is not null`,
    ),
  ],
);

export const discordUserSettingsTable = pgTable(
  'discord_user_settings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    discordAccountId: uuid('discord_account_id')
      .notNull()
      .references(() => discordAccountsTable.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    locale: varchar('locale', { length: 35 }),
    timezone: varchar('timezone', { length: 100 }),
    notifications: jsonb('notifications')
      .$type<DiscordNotificationSettings>()
      .default({
        dm: true,
        mentions: true,
        moderation: true,
        tickets: true,
        reminders: true,
      })
      .notNull(),
    ai: jsonb('ai')
      .$type<DiscordAiUserSettings>()
      .default({
        responseMode: 'ask',
        voiceEnabled: true,
        preferredVoice: null,
        personalityId: null,
        memoryOptIn: false,
        crossGuildPersonalization: false,
      })
      .notNull(),
    privacy: jsonb('privacy')
      .$type<DiscordPrivacySettings>()
      .default({
        analyticsPersonalization: false,
        profileVisibility: 'mutual_guilds',
        activityVisible: true,
        mutualGuildsVisible: true,
        dataSharing: false,
        discoverable: false,
      })
      .notNull(),
    music: jsonb('music')
      .$type<JsonRecord>()
      .default({
        defaultVolume: 80,
        autoplay: false,
        explicitContent: 'filter',
      })
      .notNull(),
    commands: jsonb('commands')
      .$type<JsonRecord>()
      .default({ ephemeralByDefault: false })
      .notNull(),
    accessibility: jsonb('accessibility')
      .$type<JsonRecord>()
      .default({ reduceMotion: false })
      .notNull(),
    personas: jsonb('personas')
      .$type<JsonRecord>()
      .default({ enabled: true })
      .notNull(),
    metadata: jsonb('metadata')
      .$type<JsonRecord>()
      .default({ schemaVersion: 1 })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_user_settings_account_unique').on(
      table.discordAccountId,
    ),
  ],
);

/** No raw document identifiers or images are stored in this boundary. */
export const discordAgeVerificationsTable = pgTable(
  'discord_age_verifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    discordAccountId: uuid('discord_account_id')
      .notNull()
      .references(() => discordAccountsTable.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),
    status: discordAgeVerificationStatusDbEnum('status')
      .default(DiscordAgeVerificationStatus.Unverified)
      .notNull(),
    is18Plus: boolean('is_18_plus').default(false).notNull(),
    method: discordAgeVerificationMethodDbEnum('method'),
    provider: varchar('provider', { length: 100 }),
    providerReference: text('provider_reference'),
    evidenceObjectReference: text('evidence_object_reference'),
    evidenceRetentionStatus: varchar('evidence_retention_status', {
      length: 32,
    })
      .default('not_collected')
      .notNull(),
    documentType: varchar('document_type', { length: 64 }),
    issuingCountry: varchar('issuing_country', { length: 2 }),
    attemptCount: integer('attempt_count').default(0).notNull(),
    rejectionReasonCode: varchar('rejection_reason_code', { length: 100 }),
    manualReviewState: varchar('manual_review_state', { length: 32 }),
    reviewerUserId: uuid('reviewer_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    verifiedAt: timestamp('verified_at', { withTimezone: true, mode: 'date' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
    purgedAt: timestamp('purged_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_age_verifications_account_unique').on(
      table.discordAccountId,
    ),
    index('discord_age_verifications_status_idx').on(table.status),
    index('discord_age_verifications_expires_idx').on(table.expiresAt),
    check('discord_age_attempt_count_check', sql`${table.attemptCount} >= 0`),
    check(
      'discord_age_verified_state_check',
      sql`${table.status} <> 'verified' or (${table.verifiedAt} is not null and ${table.method} is not null)`,
    ),
  ],
);

export const discordAgeVerificationEventsTable = pgTable(
  'discord_age_verification_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    verificationId: uuid('verification_id')
      .notNull()
      .references(() => discordAgeVerificationsTable.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),
    previousStatus: discordAgeVerificationStatusDbEnum('previous_status'),
    nextStatus: discordAgeVerificationStatusDbEnum('next_status').notNull(),
    actorUserId: uuid('actor_user_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    reasonCode: varchar('reason_code', { length: 100 }),
    metadata: jsonb('metadata').$type<JsonRecord>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('discord_age_events_verification_time_idx').on(
      table.verificationId,
      table.createdAt,
    ),
  ],
);

export type DiscordAccountRow = typeof discordAccountsTable.$inferSelect;
export type NewDiscordAccountRow = typeof discordAccountsTable.$inferInsert;
export type DiscordUserSettingsRow =
  typeof discordUserSettingsTable.$inferSelect;
export type DiscordAgeVerificationRow =
  typeof discordAgeVerificationsTable.$inferSelect;
