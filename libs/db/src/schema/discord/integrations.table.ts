import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { discordAccountsTable } from './accounts.table';
import { discordChannelsTable } from './channels.table';
import type { JsonRecord } from './discord.types';
import { discordGuildsTable } from './guilds.table';

export const discordEmojisTable = pgTable(
  'discord_emojis',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    discordEmojiId: varchar('discord_emoji_id', { length: 20 }).notNull(),
    name: varchar('name', { length: 100 }),
    animated: boolean('animated').default(false).notNull(),
    available: boolean('available').default(true).notNull(),
    managed: boolean('managed').default(false).notNull(),
    requireColons: boolean('require_colons').default(true).notNull(),
    creatorAccountId: uuid('creator_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    restrictedRoleDiscordIds: jsonb('restricted_role_discord_ids')
      .$type<string[]>()
      .default([])
      .notNull(),
    firstSeenAt: timestamp('first_seen_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
    lastSyncedAt: timestamp('last_synced_at', {
      withTimezone: true,
      mode: 'date',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    uniqueIndex('discord_emojis_discord_id_unique').on(table.discordEmojiId),
    index('discord_emojis_guild_deleted_idx').on(
      table.guildId,
      table.deletedAt,
    ),
  ],
);

export const discordStickersTable = pgTable(
  'discord_stickers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    discordStickerId: varchar('discord_sticker_id', { length: 20 }).notNull(),
    name: varchar('name', { length: 30 }).notNull(),
    description: text('description'),
    tags: text('tags'),
    stickerType: integer('sticker_type').notNull(),
    formatType: integer('format_type').notNull(),
    available: boolean('available').default(true).notNull(),
    creatorAccountId: uuid('creator_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    firstSeenAt: timestamp('first_seen_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
    lastSyncedAt: timestamp('last_synced_at', {
      withTimezone: true,
      mode: 'date',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    uniqueIndex('discord_stickers_discord_id_unique').on(
      table.discordStickerId,
    ),
    index('discord_stickers_guild_deleted_idx').on(
      table.guildId,
      table.deletedAt,
    ),
  ],
);

export const discordSoundboardSoundsTable = pgTable(
  'discord_soundboard_sounds',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    discordSoundId: varchar('discord_sound_id', { length: 20 }).notNull(),
    name: varchar('name', { length: 32 }).notNull(),
    volume: numeric('volume', { precision: 5, scale: 4 })
      .default('1')
      .notNull(),
    emojiDiscordId: varchar('emoji_discord_id', { length: 20 }),
    emojiName: varchar('emoji_name', { length: 100 }),
    available: boolean('available').default(true).notNull(),
    creatorAccountId: uuid('creator_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_soundboard_discord_id_unique').on(
      table.discordSoundId,
    ),
    index('discord_soundboard_guild_deleted_idx').on(
      table.guildId,
      table.deletedAt,
    ),
  ],
);

/** `tokenSecretReference` points to encrypted secret storage, never the token. */
export const discordWebhooksTable = pgTable(
  'discord_webhooks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id').references(() => discordGuildsTable.id, {
      onDelete: 'restrict',
    }),
    channelId: uuid('channel_id').references(() => discordChannelsTable.id, {
      onDelete: 'set null',
    }),
    discordWebhookId: varchar('discord_webhook_id', { length: 20 }).notNull(),
    webhookType: integer('webhook_type').notNull(),
    name: varchar('name', { length: 100 }),
    avatarHash: varchar('avatar_hash', { length: 128 }),
    applicationDiscordId: varchar('application_discord_id', { length: 20 }),
    ownerAccountId: uuid('owner_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    managedByAerealith: boolean('managed_by_aerealith')
      .default(false)
      .notNull(),
    purpose: varchar('purpose', { length: 64 }),
    tokenSecretReference: text('token_secret_reference'),
    lastValidatedAt: timestamp('last_validated_at', {
      withTimezone: true,
      mode: 'date',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_webhooks_discord_id_unique').on(
      table.discordWebhookId,
    ),
    index('discord_webhooks_guild_purpose_idx').on(
      table.guildId,
      table.purpose,
    ),
    index('discord_webhooks_channel_idx').on(table.channelId),
  ],
);

export const discordInvitesTable = pgTable(
  'discord_invites',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: varchar('code', { length: 32 }).notNull(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    channelId: uuid('channel_id').references(() => discordChannelsTable.id, {
      onDelete: 'set null',
    }),
    inviterAccountId: uuid('inviter_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    targetDiscordUserId: varchar('target_discord_user_id', { length: 20 }),
    targetApplicationDiscordId: varchar('target_application_discord_id', {
      length: 20,
    }),
    maxAgeSeconds: integer('max_age_seconds').default(0).notNull(),
    maxUses: integer('max_uses').default(0).notNull(),
    temporary: boolean('temporary').default(false).notNull(),
    uses: integer('uses').default(0).notNull(),
    lastObservedUses: integer('last_observed_uses').default(0).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_invites_code_unique').on(table.code),
    index('discord_invites_guild_active_idx').on(
      table.guildId,
      table.revokedAt,
    ),
  ],
);

export const discordScheduledEventsTable = pgTable(
  'discord_scheduled_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    discordEventId: varchar('discord_event_id', { length: 20 }).notNull(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    channelId: uuid('channel_id').references(() => discordChannelsTable.id, {
      onDelete: 'set null',
    }),
    creatorAccountId: uuid('creator_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    scheduledStartAt: timestamp('scheduled_start_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    scheduledEndAt: timestamp('scheduled_end_at', {
      withTimezone: true,
      mode: 'date',
    }),
    privacyLevel: integer('privacy_level').notNull(),
    status: integer('status').notNull(),
    entityType: integer('entity_type').notNull(),
    entityMetadata: jsonb('entity_metadata')
      .$type<JsonRecord>()
      .default({})
      .notNull(),
    imageHash: varchar('image_hash', { length: 128 }),
    interestedUserCount: integer('interested_user_count').default(0).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_scheduled_events_id_unique').on(table.discordEventId),
    index('discord_scheduled_events_guild_start_idx').on(
      table.guildId,
      table.scheduledStartAt,
    ),
  ],
);

export const discordStageInstancesTable = pgTable(
  'discord_stage_instances',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => discordChannelsTable.id, { onDelete: 'restrict' }),
    scheduledEventId: uuid('scheduled_event_id').references(
      () => discordScheduledEventsTable.id,
      { onDelete: 'set null' },
    ),
    topic: text('topic').notNull(),
    privacyLevel: integer('privacy_level').notNull(),
    discoverableDisabled: boolean('discoverable_disabled')
      .default(false)
      .notNull(),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    index('discord_stage_instances_guild_time_idx').on(
      table.guildId,
      table.startedAt,
    ),
  ],
);

export const discordNativeAutomodRulesTable = pgTable(
  'discord_native_automod_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    discordRuleId: varchar('discord_rule_id', { length: 20 }).notNull(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    creatorAccountId: uuid('creator_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    name: varchar('name', { length: 100 }).notNull(),
    eventType: integer('event_type').notNull(),
    triggerType: integer('trigger_type').notNull(),
    triggerMetadata: jsonb('trigger_metadata')
      .$type<JsonRecord>()
      .default({})
      .notNull(),
    actions: jsonb('actions').$type<JsonRecord[]>().default([]).notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    exemptRoleDiscordIds: jsonb('exempt_role_discord_ids')
      .$type<string[]>()
      .default([])
      .notNull(),
    exemptChannelDiscordIds: jsonb('exempt_channel_discord_ids')
      .$type<string[]>()
      .default([])
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
    uniqueIndex('discord_native_automod_id_unique').on(table.discordRuleId),
    index('discord_native_automod_guild_enabled_idx').on(
      table.guildId,
      table.enabled,
    ),
  ],
);

export const discordAuditLogEntriesTable = pgTable(
  'discord_audit_log_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    discordEntryId: varchar('discord_entry_id', { length: 20 }).notNull(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    actorAccountId: uuid('actor_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    targetDiscordId: varchar('target_discord_id', { length: 20 }),
    targetType: varchar('target_type', { length: 64 }),
    actionType: integer('action_type').notNull(),
    reason: text('reason'),
    changes: jsonb('changes').$type<JsonRecord[]>().default([]).notNull(),
    options: jsonb('options').$type<JsonRecord>().default({}).notNull(),
    discordCreatedAt: timestamp('discord_created_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    ingestedAt: timestamp('ingested_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_audit_entries_discord_id_unique').on(
      table.discordEntryId,
    ),
    index('discord_audit_entries_guild_time_idx').on(
      table.guildId,
      table.discordCreatedAt,
    ),
    index('discord_audit_entries_target_idx').on(
      table.guildId,
      table.targetDiscordId,
    ),
  ],
);

export type DiscordEmojiRow = typeof discordEmojisTable.$inferSelect;
export type DiscordWebhookRow = typeof discordWebhooksTable.$inferSelect;
export type DiscordScheduledEventRow =
  typeof discordScheduledEventsTable.$inferSelect;
