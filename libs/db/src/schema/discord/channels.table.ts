import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  text,
} from 'drizzle-orm/pg-core';

import { discordAccountsTable } from './accounts.table';
import type { DiscordForumTagDefinition, JsonRecord } from './discord.types';
import { discordGuildsTable } from './guilds.table';

/** Channel type remains Discord's numeric value for forward compatibility. */
export const discordChannelsTable = pgTable(
  'discord_channels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    discordChannelId: varchar('discord_channel_id', { length: 20 }).notNull(),
    parentChannelId: uuid('parent_channel_id').references(
      (): AnyPgColumn => discordChannelsTable.id,
      { onDelete: 'set null' },
    ),
    parentDiscordChannelId: varchar('parent_discord_channel_id', {
      length: 20,
    }),
    channelType: integer('channel_type').notNull(),
    name: varchar('name', { length: 100 }),
    position: integer('position').default(0).notNull(),
    topic: text('topic'),
    nsfw: boolean('nsfw').default(false).notNull(),
    rateLimitPerUserSeconds: integer('rate_limit_per_user_seconds')
      .default(0)
      .notNull(),
    defaultAutoArchiveMinutes: integer('default_auto_archive_minutes'),
    permissionsSynced: boolean('permissions_synced').default(false).notNull(),
    lastMessageDiscordId: varchar('last_message_discord_id', { length: 20 }),
    bitrate: integer('bitrate'),
    userLimit: integer('user_limit'),
    rtcRegion: varchar('rtc_region', { length: 100 }),
    videoQualityMode: integer('video_quality_mode'),
    defaultReactionEmoji: jsonb(
      'default_reaction_emoji',
    ).$type<JsonRecord | null>(),
    defaultThreadRateLimitSeconds: integer('default_thread_rate_limit_seconds'),
    defaultSortOrder: integer('default_sort_order'),
    defaultForumLayout: integer('default_forum_layout'),
    availableTags: jsonb('available_tags')
      .$type<DiscordForumTagDefinition[]>()
      .default([])
      .notNull(),
    flags: varchar('flags', { length: 32 }).default('0').notNull(),
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
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_channels_discord_id_unique').on(
      table.discordChannelId,
    ),
    index('discord_channels_guild_type_idx').on(
      table.guildId,
      table.channelType,
    ),
    index('discord_channels_parent_idx').on(table.parentChannelId),
    index('discord_channels_guild_deleted_idx').on(
      table.guildId,
      table.deletedAt,
    ),
  ],
);

export const discordChannelPermissionOverwritesTable = pgTable(
  'discord_channel_permission_overwrites',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'cascade' }),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => discordChannelsTable.id, { onDelete: 'cascade' }),
    targetDiscordId: varchar('target_discord_id', { length: 20 }).notNull(),
    targetType: varchar('target_type', { length: 16 })
      .$type<'role' | 'member'>()
      .notNull(),
    allowPermissions: varchar('allow_permissions', { length: 32 })
      .default('0')
      .notNull(),
    denyPermissions: varchar('deny_permissions', { length: 32 })
      .default('0')
      .notNull(),
    lastSyncedAt: timestamp('last_synced_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_channel_overwrite_target_unique').on(
      table.channelId,
      table.targetDiscordId,
      table.targetType,
    ),
    index('discord_channel_overwrites_guild_idx').on(table.guildId),
  ],
);

export const discordThreadsTable = pgTable(
  'discord_threads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => discordChannelsTable.id, { onDelete: 'cascade' }),
    parentChannelId: uuid('parent_channel_id')
      .notNull()
      .references(() => discordChannelsTable.id, { onDelete: 'restrict' }),
    ownerAccountId: uuid('owner_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    threadType: integer('thread_type').notNull(),
    archived: boolean('archived').default(false).notNull(),
    autoArchiveDurationMinutes: integer(
      'auto_archive_duration_minutes',
    ).notNull(),
    archiveTimestamp: timestamp('archive_timestamp', {
      withTimezone: true,
      mode: 'date',
    }),
    locked: boolean('locked').default(false).notNull(),
    invitable: boolean('invitable').default(true).notNull(),
    threadCreatedAt: timestamp('thread_created_at', {
      withTimezone: true,
      mode: 'date',
    }),
    messageCount: integer('message_count').default(0).notNull(),
    memberCount: integer('member_count').default(0).notNull(),
    totalMessagesSent: integer('total_messages_sent').default(0).notNull(),
    appliedTagDiscordIds: jsonb('applied_tag_discord_ids')
      .$type<string[]>()
      .default([])
      .notNull(),
    lastActivityAt: timestamp('last_activity_at', {
      withTimezone: true,
      mode: 'date',
    }),
    lastSyncedAt: timestamp('last_synced_at', {
      withTimezone: true,
      mode: 'date',
    }),
  },
  (table) => [
    uniqueIndex('discord_threads_channel_unique').on(table.channelId),
    index('discord_threads_parent_archive_idx').on(
      table.parentChannelId,
      table.archived,
    ),
  ],
);

export const discordForumTagsTable = pgTable(
  'discord_forum_tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    forumChannelId: uuid('forum_channel_id')
      .notNull()
      .references(() => discordChannelsTable.id, { onDelete: 'cascade' }),
    discordTagId: varchar('discord_tag_id', { length: 20 }).notNull(),
    name: varchar('name', { length: 20 }).notNull(),
    moderated: boolean('moderated').default(false).notNull(),
    emojiDiscordId: varchar('emoji_discord_id', { length: 20 }),
    emojiName: varchar('emoji_name', { length: 100 }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_forum_tags_discord_id_unique').on(table.discordTagId),
    index('discord_forum_tags_channel_idx').on(
      table.forumChannelId,
      table.deletedAt,
    ),
  ],
);

export const discordForumPostStateTable = pgTable(
  'discord_forum_post_state',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    forumChannelId: uuid('forum_channel_id')
      .notNull()
      .references(() => discordChannelsTable.id, { onDelete: 'restrict' }),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => discordThreadsTable.id, { onDelete: 'restrict' }),
    authorAccountId: uuid('author_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    lastActivityAt: timestamp('last_activity_at', {
      withTimezone: true,
      mode: 'date',
    }),
    replyCount: integer('reply_count').default(0).notNull(),
    participantCount: integer('participant_count').default(0).notNull(),
    archived: boolean('archived').default(false).notNull(),
    locked: boolean('locked').default(false).notNull(),
  },
  (table) => [
    uniqueIndex('discord_forum_post_thread_unique').on(table.threadId),
    index('discord_forum_post_activity_idx').on(
      table.forumChannelId,
      table.lastActivityAt,
    ),
  ],
);

export type DiscordChannelRow = typeof discordChannelsTable.$inferSelect;
export type NewDiscordChannelRow = typeof discordChannelsTable.$inferInsert;
