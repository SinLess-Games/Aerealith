import {
  boolean,
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
  DiscordSyncStatus,
  discordSyncStatusDbEnum,
} from '../../enums/discord';
import { discordAccountsTable } from './accounts.table';
import type {
  DiscordGuildAiSettings,
  DiscordGuildAnalyticsSettings,
  DiscordGuildCommunitySettings,
  DiscordGuildCoreSettings,
  DiscordGuildModerationSettings,
  DiscordGuildMusicSettings,
  JsonRecord,
} from './discord.types';

export const discordGuildsTable = pgTable(
  'discord_guilds',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    discordGuildId: varchar('discord_guild_id', { length: 20 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    ownerDiscordUserId: varchar('owner_discord_user_id', {
      length: 20,
    }).notNull(),
    ownerAccountId: uuid('owner_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    iconHash: varchar('icon_hash', { length: 128 }),
    bannerHash: varchar('banner_hash', { length: 128 }),
    splashHash: varchar('splash_hash', { length: 128 }),
    discoverySplashHash: varchar('discovery_splash_hash', { length: 128 }),
    vanityUrlCode: varchar('vanity_url_code', { length: 100 }),
    preferredLocale: varchar('preferred_locale', { length: 35 }),
    discordCreatedAt: timestamp('discord_created_at', {
      withTimezone: true,
      mode: 'date',
    }),
    firstSeenAt: timestamp('first_seen_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
    botJoinedAt: timestamp('bot_joined_at', {
      withTimezone: true,
      mode: 'date',
    }),
    botLeftAt: timestamp('bot_left_at', { withTimezone: true, mode: 'date' }),
    lastSyncedAt: timestamp('last_synced_at', {
      withTimezone: true,
      mode: 'date',
    }),
    isBotInstalled: boolean('is_bot_installed').default(true).notNull(),
    isAvailable: boolean('is_available').default(true).notNull(),
    isDiscordUnavailable: boolean('is_discord_unavailable')
      .default(false)
      .notNull(),
    shardId: integer('shard_id'),
    clusterId: varchar('cluster_id', { length: 100 }),
    verificationLevel: integer('verification_level').default(0).notNull(),
    defaultNotificationLevel: integer('default_notification_level')
      .default(0)
      .notNull(),
    explicitContentFilter: integer('explicit_content_filter')
      .default(0)
      .notNull(),
    mfaLevel: integer('mfa_level').default(0).notNull(),
    nsfwLevel: integer('nsfw_level').default(0).notNull(),
    premiumTier: integer('premium_tier').default(0).notNull(),
    premiumSubscriptionCount: integer('premium_subscription_count')
      .default(0)
      .notNull(),
    premiumProgressBarEnabled: boolean('premium_progress_bar_enabled')
      .default(false)
      .notNull(),
    maxMembers: integer('max_members'),
    maxPresences: integer('max_presences'),
    maxVideoChannelUsers: integer('max_video_channel_users'),
    maxStageVideoChannelUsers: integer('max_stage_video_channel_users'),
    approximateMemberCount: integer('approximate_member_count'),
    approximatePresenceCount: integer('approximate_presence_count'),
    afkChannelDiscordId: varchar('afk_channel_discord_id', { length: 20 }),
    afkTimeoutSeconds: integer('afk_timeout_seconds'),
    systemChannelDiscordId: varchar('system_channel_discord_id', {
      length: 20,
    }),
    rulesChannelDiscordId: varchar('rules_channel_discord_id', { length: 20 }),
    publicUpdatesChannelDiscordId: varchar(
      'public_updates_channel_discord_id',
      { length: 20 },
    ),
    safetyAlertsChannelDiscordId: varchar('safety_alerts_channel_discord_id', {
      length: 20,
    }),
    widgetEnabled: boolean('widget_enabled').default(false).notNull(),
    widgetChannelDiscordId: varchar('widget_channel_discord_id', {
      length: 20,
    }),
    applicationDiscordId: varchar('application_discord_id', { length: 20 }),
    isPartnered: boolean('is_partnered').default(false).notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),
    isCommunity: boolean('is_community').default(false).notNull(),
    isDiscoverable: boolean('is_discoverable').default(false).notNull(),
    discoveryEnabledAt: timestamp('discovery_enabled_at', {
      withTimezone: true,
      mode: 'date',
    }),
    welcomeScreenEnabled: boolean('welcome_screen_enabled')
      .default(false)
      .notNull(),
    discordFeatures: jsonb('discord_features')
      .$type<string[]>()
      .default([])
      .notNull(),
    sourceMetadata: jsonb('source_metadata')
      .$type<JsonRecord>()
      .default({})
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_guilds_discord_id_unique').on(table.discordGuildId),
    index('discord_guilds_owner_account_idx').on(table.ownerAccountId),
    index('discord_guilds_installation_idx').on(
      table.isBotInstalled,
      table.deletedAt,
    ),
    index('discord_guilds_discovery_idx').on(
      table.isDiscoverable,
      table.deletedAt,
    ),
  ],
);

export const discordGuildSettingsTable = pgTable(
  'discord_guild_settings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'cascade' }),
    botEnabled: boolean('bot_enabled').default(true).notNull(),
    core: jsonb('core')
      .$type<DiscordGuildCoreSettings>()
      .default({
        prefix: '!',
        slashCommands: true,
        textCommands: false,
        locale: 'en-US',
        timezone: 'UTC',
        adminRoleId: null,
        moderatorRoleIds: [],
        staffRoleIds: [],
        managementRoleIds: [],
      })
      .notNull(),
    ai: jsonb('ai')
      .$type<DiscordGuildAiSettings>()
      .default({
        enabled: false,
        chatEnabled: false,
        voiceEnabled: false,
        moderationEnabled: false,
        summariesEnabled: false,
        memoryEnabled: false,
        knowledgeEnabled: false,
        allowedChannelIds: [],
        blockedChannelIds: [],
      })
      .notNull(),
    music: jsonb('music')
      .$type<DiscordGuildMusicSettings>()
      .default({
        enabled: true,
        defaultVolume: 80,
        autoplay: false,
        explicitContent: 'filter',
      })
      .notNull(),
    moderation: jsonb('moderation')
      .$type<DiscordGuildModerationSettings>()
      .default({
        enabled: true,
        automodEnabled: false,
        raidProtection: true,
        antiSpam: true,
        antiPhishing: true,
      })
      .notNull(),
    community: jsonb('community')
      .$type<DiscordGuildCommunitySettings>()
      .default({
        welcomeEnabled: false,
        goodbyeEnabled: false,
        levelingEnabled: false,
        reputationEnabled: false,
        ticketsEnabled: false,
      })
      .notNull(),
    analytics: jsonb('analytics')
      .$type<DiscordGuildAnalyticsSettings>()
      .default({
        enabled: true,
        retentionDays: 730,
        messageAnalytics: true,
        voiceAnalytics: true,
        aiAnalytics: true,
        musicAnalytics: true,
        memberAnalytics: true,
        moderationAnalytics: true,
        contentStorage: 'moderation_only',
        privacyMode: 'standard',
      })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_guild_settings_guild_unique').on(table.guildId),
  ],
);

export const discordGuildModulesTable = pgTable(
  'discord_guild_modules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'cascade' }),
    moduleKey: varchar('module_key', { length: 100 }).notNull(),
    enabled: boolean('enabled').default(false).notNull(),
    configuration: jsonb('configuration')
      .$type<JsonRecord>()
      .default({})
      .notNull(),
    enabledAt: timestamp('enabled_at', { withTimezone: true, mode: 'date' }),
    disabledAt: timestamp('disabled_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_guild_modules_key_unique').on(
      table.guildId,
      table.moduleKey,
    ),
    index('discord_guild_modules_enabled_idx').on(table.guildId, table.enabled),
  ],
);

export const discordGuildSyncStatesTable = pgTable(
  'discord_guild_sync_states',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'cascade' }),
    resource: varchar('resource', { length: 64 }).notNull(),
    status: discordSyncStatusDbEnum('status')
      .default(DiscordSyncStatus.Pending)
      .notNull(),
    lastAttemptAt: timestamp('last_attempt_at', {
      withTimezone: true,
      mode: 'date',
    }),
    lastSuccessfulAt: timestamp('last_successful_at', {
      withTimezone: true,
      mode: 'date',
    }),
    failureCount: integer('failure_count').default(0).notNull(),
    lastFailureCode: varchar('last_failure_code', { length: 100 }),
    lastFailureMessage: text('last_failure_message'),
    cursor: text('cursor'),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_guild_sync_resource_unique').on(
      table.guildId,
      table.resource,
    ),
    index('discord_guild_sync_status_idx').on(
      table.status,
      table.lastAttemptAt,
    ),
  ],
);

export type DiscordGuildRow = typeof discordGuildsTable.$inferSelect;
export type NewDiscordGuildRow = typeof discordGuildsTable.$inferInsert;
export type DiscordGuildSettingsRow =
  typeof discordGuildSettingsTable.$inferSelect;
