import type { AnyPgColumn } from 'drizzle-orm/pg-core';
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
  DiscordDataProvenance,
  discordDataProvenanceDbEnum,
} from '../../enums/discord';
import { discordAccountsTable } from './accounts.table';
import { discordChannelsTable } from './channels.table';
import type { JsonRecord } from './discord.types';
import { discordGuildsTable } from './guilds.table';
import { discordGuildMembersTable } from './members-roles.table';
import { discordWebhooksTable } from './integrations.table';

/**
 * Durable message metadata. Content is optional encrypted material with its
 * own purge timestamp; aggregate analytics remain useful after it is purged.
 */
export const discordMessagesTable = pgTable(
  'discord_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    discordMessageId: varchar('discord_message_id', { length: 20 }).notNull(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => discordChannelsTable.id, { onDelete: 'restrict' }),
    threadChannelId: uuid('thread_channel_id').references(
      () => discordChannelsTable.id,
      { onDelete: 'set null' },
    ),
    authorAccountId: uuid('author_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    webhookId: uuid('webhook_id').references(() => discordWebhooksTable.id, {
      onDelete: 'set null',
    }),
    referencedMessageId: uuid('referenced_message_id').references(
      (): AnyPgColumn => discordMessagesTable.id,
      { onDelete: 'set null' },
    ),
    messageType: integer('message_type').notNull(),
    discordCreatedAt: timestamp('discord_created_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    editedAt: timestamp('edited_at', { withTimezone: true, mode: 'date' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    attachmentCount: integer('attachment_count').default(0).notNull(),
    embedCount: integer('embed_count').default(0).notNull(),
    mentionCount: integer('mention_count').default(0).notNull(),
    roleMentionCount: integer('role_mention_count').default(0).notNull(),
    mentionsEveryone: boolean('mentions_everyone').default(false).notNull(),
    characterCount: integer('character_count').default(0).notNull(),
    linkCount: integer('link_count').default(0).notNull(),
    reactionCount: integer('reaction_count').default(0).notNull(),
    isProxied: boolean('is_proxied').default(false).notNull(),
    isBotGenerated: boolean('is_bot_generated').default(false).notNull(),
    isCommandRelated: boolean('is_command_related').default(false).notNull(),
    isAiGenerated: boolean('is_ai_generated').default(false).notNull(),
    isModerationFlagged: boolean('is_moderation_flagged')
      .default(false)
      .notNull(),
    provenance: discordDataProvenanceDbEnum('provenance')
      .default(DiscordDataProvenance.Discord)
      .notNull(),
    contentCiphertext: text('content_ciphertext'),
    contentStoragePolicy: varchar('content_storage_policy', { length: 32 })
      .default('none')
      .notNull(),
    contentStoredAt: timestamp('content_stored_at', {
      withTimezone: true,
      mode: 'date',
    }),
    contentPurgeAt: timestamp('content_purge_at', {
      withTimezone: true,
      mode: 'date',
    }),
    attachmentMetadata: jsonb('attachment_metadata')
      .$type<JsonRecord[]>()
      .default([])
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_messages_discord_id_unique').on(
      table.discordMessageId,
    ),
    index('discord_messages_guild_time_idx').on(
      table.guildId,
      table.discordCreatedAt,
    ),
    index('discord_messages_channel_time_idx').on(
      table.channelId,
      table.discordCreatedAt,
    ),
    index('discord_messages_author_time_idx').on(
      table.authorAccountId,
      table.discordCreatedAt,
    ),
    index('discord_messages_content_purge_idx').on(table.contentPurgeAt),
  ],
);

export const discordMessageEventsTable = pgTable(
  'discord_message_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    messageId: uuid('message_id').references(() => discordMessagesTable.id, {
      onDelete: 'set null',
    }),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => discordChannelsTable.id, { onDelete: 'restrict' }),
    eventType: varchar('event_type', { length: 32 }).notNull(),
    actorAccountId: uuid('actor_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    metadata: jsonb('metadata').$type<JsonRecord>().default({}).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    index('discord_message_events_guild_time_idx').on(
      table.guildId,
      table.occurredAt,
    ),
    index('discord_message_events_message_time_idx').on(
      table.messageId,
      table.occurredAt,
    ),
    index('discord_message_events_expiry_idx').on(table.expiresAt),
  ],
);

export const discordReactionsTable = pgTable(
  'discord_reactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => discordMessagesTable.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => discordAccountsTable.id, { onDelete: 'cascade' }),
    emojiKey: varchar('emoji_key', { length: 128 }).notNull(),
    burst: boolean('burst').default(false).notNull(),
    reactedAt: timestamp('reacted_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    removedAt: timestamp('removed_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    uniqueIndex('discord_reactions_message_user_emoji_unique').on(
      table.messageId,
      table.accountId,
      table.emojiKey,
    ),
    index('discord_reactions_message_active_idx').on(
      table.messageId,
      table.removedAt,
    ),
  ],
);

export const discordVoiceSessionsTable = pgTable(
  'discord_voice_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => discordGuildMembersTable.id, { onDelete: 'restrict' }),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => discordChannelsTable.id, { onDelete: 'restrict' }),
    sessionType: varchar('session_type', { length: 16 })
      .$type<'voice' | 'stage'>()
      .notNull(),
    startedAt: timestamp('started_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true, mode: 'date' }),
    durationSeconds: integer('duration_seconds'),
    streamed: boolean('streamed').default(false).notNull(),
    usedVideo: boolean('used_video').default(false).notNull(),
    serverMuteSeconds: integer('server_mute_seconds').default(0).notNull(),
    serverDeafSeconds: integer('server_deaf_seconds').default(0).notNull(),
    selfMuteSeconds: integer('self_mute_seconds').default(0).notNull(),
    selfDeafSeconds: integer('self_deaf_seconds').default(0).notNull(),
    metadata: jsonb('metadata').$type<JsonRecord>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('discord_voice_sessions_guild_time_idx').on(
      table.guildId,
      table.startedAt,
    ),
    index('discord_voice_sessions_member_time_idx').on(
      table.memberId,
      table.startedAt,
    ),
    index('discord_voice_sessions_channel_time_idx').on(
      table.channelId,
      table.startedAt,
    ),
  ],
);

export type DiscordMessageRow = typeof discordMessagesTable.$inferSelect;
export type NewDiscordMessageRow = typeof discordMessagesTable.$inferInsert;
export type DiscordVoiceSessionRow =
  typeof discordVoiceSessionsTable.$inferSelect;
