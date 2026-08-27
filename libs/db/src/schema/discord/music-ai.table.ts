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

import {
  discordAiSessionTypeDbEnum,
  discordMusicTrackEndReasonDbEnum,
} from '../../enums/discord';
import { discordAccountsTable } from './accounts.table';
import { discordChannelsTable } from './channels.table';
import type { JsonRecord } from './discord.types';
import { discordGuildsTable } from './guilds.table';

export const discordMusicSessionsTable = pgTable(
  'discord_music_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    voiceChannelId: uuid('voice_channel_id')
      .notNull()
      .references(() => discordChannelsTable.id, { onDelete: 'restrict' }),
    controlChannelId: uuid('control_channel_id').references(
      () => discordChannelsTable.id,
      { onDelete: 'set null' },
    ),
    initiatedByAccountId: uuid('initiated_by_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    lavalinkNode: varchar('lavalink_node', { length: 100 }),
    startedAt: timestamp('started_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true, mode: 'date' }),
    durationSeconds: integer('duration_seconds'),
    trackCount: integer('track_count').default(0).notNull(),
    uniqueListenerCount: integer('unique_listener_count').default(0).notNull(),
    metadata: jsonb('metadata').$type<JsonRecord>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('discord_music_sessions_guild_time_idx').on(
      table.guildId,
      table.startedAt,
    ),
  ],
);

export const discordMusicTracksTable = pgTable(
  'discord_music_tracks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => discordMusicSessionsTable.id, { onDelete: 'cascade' }),
    requestedByAccountId: uuid('requested_by_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    trackReference: text('track_reference').notNull(),
    title: text('title').notNull(),
    author: text('author'),
    uri: text('uri'),
    source: varchar('source', { length: 64 }),
    durationMilliseconds: integer('duration_milliseconds'),
    requestedAt: timestamp('requested_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
    finishedAt: timestamp('finished_at', { withTimezone: true, mode: 'date' }),
    endReason: discordMusicTrackEndReasonDbEnum('end_reason'),
    skipped: boolean('skipped').default(false).notNull(),
    failed: boolean('failed').default(false).notNull(),
    failureCode: varchar('failure_code', { length: 100 }),
  },
  (table) => [
    index('discord_music_tracks_session_time_idx').on(
      table.sessionId,
      table.requestedAt,
    ),
    index('discord_music_tracks_guild_time_idx').on(
      table.guildId,
      table.requestedAt,
    ),
    index('discord_music_tracks_requester_idx').on(
      table.requestedByAccountId,
      table.requestedAt,
    ),
  ],
);

export const discordMusicPlaylistsTable = pgTable(
  'discord_music_playlists',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerAccountId: uuid('owner_account_id')
      .notNull()
      .references(() => discordAccountsTable.id, { onDelete: 'cascade' }),
    guildId: uuid('guild_id').references(() => discordGuildsTable.id, {
      onDelete: 'set null',
    }),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    isPublic: boolean('is_public').default(false).notNull(),
    tracks: jsonb('tracks').$type<JsonRecord[]>().default([]).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    index('discord_music_playlists_owner_idx').on(
      table.ownerAccountId,
      table.deletedAt,
    ),
  ],
);

/** Links Discord context to the canonical AI session without copying it. */
export const discordAiSessionsTable = pgTable(
  'discord_ai_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id').references(() => discordGuildsTable.id, {
      onDelete: 'restrict',
    }),
    channelId: uuid('channel_id').references(() => discordChannelsTable.id, {
      onDelete: 'set null',
    }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => discordAccountsTable.id, { onDelete: 'restrict' }),
    aerealithSessionReference: varchar('aerealith_session_reference', {
      length: 128,
    }).notNull(),
    sessionType: discordAiSessionTypeDbEnum('session_type').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true, mode: 'date' }),
    provider: varchar('provider', { length: 100 }),
    model: varchar('model', { length: 160 }),
    usageReference: varchar('usage_reference', { length: 128 }),
    memoryEnabled: boolean('memory_enabled').default(false).notNull(),
    serverContextEnabled: boolean('server_context_enabled')
      .default(false)
      .notNull(),
    metadata: jsonb('metadata').$type<JsonRecord>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_ai_sessions_core_ref_unique').on(
      table.aerealithSessionReference,
    ),
    index('discord_ai_sessions_guild_time_idx').on(
      table.guildId,
      table.startedAt,
    ),
    index('discord_ai_sessions_account_time_idx').on(
      table.accountId,
      table.startedAt,
    ),
  ],
);

export const discordAiUsageEventsTable = pgTable(
  'discord_ai_usage_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => discordAiSessionsTable.id, { onDelete: 'cascade' }),
    guildId: uuid('guild_id').references(() => discordGuildsTable.id, {
      onDelete: 'restrict',
    }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => discordAccountsTable.id, { onDelete: 'restrict' }),
    requestType: varchar('request_type', { length: 32 }).notNull(),
    inputTokens: integer('input_tokens').default(0).notNull(),
    outputTokens: integer('output_tokens').default(0).notNull(),
    cachedTokens: integer('cached_tokens').default(0).notNull(),
    toolCalls: integer('tool_calls').default(0).notNull(),
    voiceSeconds: integer('voice_seconds').default(0).notNull(),
    latencyMilliseconds: integer('latency_milliseconds'),
    failed: boolean('failed').default(false).notNull(),
    failureCode: varchar('failure_code', { length: 100 }),
    estimatedProviderCost: numeric('estimated_provider_cost', {
      precision: 18,
      scale: 8,
    }),
    billingUsageReference: varchar('billing_usage_reference', { length: 128 }),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('discord_ai_usage_guild_time_idx').on(
      table.guildId,
      table.occurredAt,
    ),
    index('discord_ai_usage_account_time_idx').on(
      table.accountId,
      table.occurredAt,
    ),
  ],
);

export type DiscordMusicSessionRow =
  typeof discordMusicSessionsTable.$inferSelect;
export type DiscordAiSessionRow = typeof discordAiSessionsTable.$inferSelect;
