import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import {
  DiscordAnalyticsGranularity,
  discordAnalyticsGranularityDbEnum,
  discordCommandTypeDbEnum,
} from '../../enums/discord';
import { discordAccountsTable } from './accounts.table';
import { discordChannelsTable } from './channels.table';
import type { JsonRecord } from './discord.types';
import { discordGuildsTable } from './guilds.table';
import { discordGuildMembersTable } from './members-roles.table';

export const discordCommandExecutionsTable = pgTable(
  'discord_command_executions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    commandName: varchar('command_name', { length: 100 }).notNull(),
    commandType: discordCommandTypeDbEnum('command_type').notNull(),
    guildId: uuid('guild_id').references(() => discordGuildsTable.id, {
      onDelete: 'restrict',
    }),
    channelId: uuid('channel_id').references(() => discordChannelsTable.id, {
      onDelete: 'set null',
    }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => discordAccountsTable.id, { onDelete: 'restrict' }),
    startedAt: timestamp('started_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true, mode: 'date' }),
    durationMilliseconds: integer('duration_milliseconds'),
    succeeded: boolean('succeeded').default(false).notNull(),
    errorCategory: varchar('error_category', { length: 100 }),
    shardId: integer('shard_id'),
    clusterId: varchar('cluster_id', { length: 100 }),
    premiumFeature: boolean('premium_feature').default(false).notNull(),
    aiCommand: boolean('ai_command').default(false).notNull(),
    musicCommand: boolean('music_command').default(false).notNull(),
    metadata: jsonb('metadata').$type<JsonRecord>().default({}).notNull(),
  },
  (table) => [
    index('discord_commands_guild_time_idx').on(table.guildId, table.startedAt),
    index('discord_commands_name_time_idx').on(
      table.commandName,
      table.startedAt,
    ),
    index('discord_commands_account_time_idx').on(
      table.accountId,
      table.startedAt,
    ),
  ],
);

/** Stable rollups power charts after high-volume event retention expires. */
export const discordGuildAnalyticsSnapshotsTable = pgTable(
  'discord_guild_analytics_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    granularity: discordAnalyticsGranularityDbEnum('granularity')
      .default(DiscordAnalyticsGranularity.Daily)
      .notNull(),
    periodStart: timestamp('period_start', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    periodEnd: timestamp('period_end', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    totalMembers: integer('total_members').default(0).notNull(),
    humanMembers: integer('human_members').default(0).notNull(),
    botMembers: integer('bot_members').default(0).notNull(),
    activeMembers: integer('active_members').default(0).notNull(),
    newMembers: integer('new_members').default(0).notNull(),
    returningMembers: integer('returning_members').default(0).notNull(),
    membersLeft: integer('members_left').default(0).notNull(),
    netGrowth: integer('net_growth').default(0).notNull(),
    onlineMembers: integer('online_members').default(0).notNull(),
    idleMembers: integer('idle_members').default(0).notNull(),
    dndMembers: integer('dnd_members').default(0).notNull(),
    offlineMembers: integer('offline_members').default(0).notNull(),
    categoryCount: integer('category_count').default(0).notNull(),
    textChannelCount: integer('text_channel_count').default(0).notNull(),
    announcementChannelCount: integer('announcement_channel_count')
      .default(0)
      .notNull(),
    voiceChannelCount: integer('voice_channel_count').default(0).notNull(),
    stageChannelCount: integer('stage_channel_count').default(0).notNull(),
    forumChannelCount: integer('forum_channel_count').default(0).notNull(),
    mediaChannelCount: integer('media_channel_count').default(0).notNull(),
    activeThreadCount: integer('active_thread_count').default(0).notNull(),
    archivedThreadCount: integer('archived_thread_count').default(0).notNull(),
    privateThreadCount: integer('private_thread_count').default(0).notNull(),
    publicThreadCount: integer('public_thread_count').default(0).notNull(),
    roleCount: integer('role_count').default(0).notNull(),
    emojiCount: integer('emoji_count').default(0).notNull(),
    animatedEmojiCount: integer('animated_emoji_count').default(0).notNull(),
    stickerCount: integer('sticker_count').default(0).notNull(),
    soundboardSoundCount: integer('soundboard_sound_count')
      .default(0)
      .notNull(),
    scheduledEventCount: integer('scheduled_event_count').default(0).notNull(),
    inviteCount: integer('invite_count').default(0).notNull(),
    boostCount: integer('boost_count').default(0).notNull(),
    boostTier: integer('boost_tier').default(0).notNull(),
    messagesSent: integer('messages_sent').default(0).notNull(),
    uniqueMessageAuthors: integer('unique_message_authors')
      .default(0)
      .notNull(),
    messagesEdited: integer('messages_edited').default(0).notNull(),
    messagesDeleted: integer('messages_deleted').default(0).notNull(),
    attachmentCount: integer('attachment_count').default(0).notNull(),
    mediaCount: integer('media_count').default(0).notNull(),
    linkCount: integer('link_count').default(0).notNull(),
    replyCount: integer('reply_count').default(0).notNull(),
    mentionCount: integer('mention_count').default(0).notNull(),
    reactionCount: integer('reaction_count').default(0).notNull(),
    threadsCreated: integer('threads_created').default(0).notNull(),
    forumPostsCreated: integer('forum_posts_created').default(0).notNull(),
    voiceSessions: integer('voice_sessions').default(0).notNull(),
    uniqueVoiceUsers: integer('unique_voice_users').default(0).notNull(),
    voiceMinutes: integer('voice_minutes').default(0).notNull(),
    peakConcurrentVoiceUsers: integer('peak_concurrent_voice_users')
      .default(0)
      .notNull(),
    stageParticipants: integer('stage_participants').default(0).notNull(),
    streamSessions: integer('stream_sessions').default(0).notNull(),
    videoSessions: integer('video_sessions').default(0).notNull(),
    musicSessions: integer('music_sessions').default(0).notNull(),
    songsPlayed: integer('songs_played').default(0).notNull(),
    musicMinutes: integer('music_minutes').default(0).notNull(),
    uniqueMusicListeners: integer('unique_music_listeners')
      .default(0)
      .notNull(),
    uniqueMusicRequesters: integer('unique_music_requesters')
      .default(0)
      .notNull(),
    musicSkips: integer('music_skips').default(0).notNull(),
    failedTracks: integer('failed_tracks').default(0).notNull(),
    aiInteractions: integer('ai_interactions').default(0).notNull(),
    uniqueAiUsers: integer('unique_ai_users').default(0).notNull(),
    aiTextInteractions: integer('ai_text_interactions').default(0).notNull(),
    aiVoiceSessions: integer('ai_voice_sessions').default(0).notNull(),
    aiVoiceMinutes: integer('ai_voice_minutes').default(0).notNull(),
    aiInputTokens: integer('ai_input_tokens').default(0).notNull(),
    aiOutputTokens: integer('ai_output_tokens').default(0).notNull(),
    aiToolCalls: integer('ai_tool_calls').default(0).notNull(),
    aiFailures: integer('ai_failures').default(0).notNull(),
    aiEstimatedCost: numeric('ai_estimated_cost', { precision: 18, scale: 8 })
      .default('0')
      .notNull(),
    commandsExecuted: integer('commands_executed').default(0).notNull(),
    successfulCommands: integer('successful_commands').default(0).notNull(),
    failedCommands: integer('failed_commands').default(0).notNull(),
    uniqueCommandUsers: integer('unique_command_users').default(0).notNull(),
    warnings: integer('warnings').default(0).notNull(),
    strikes: integer('strikes').default(0).notNull(),
    timeouts: integer('timeouts').default(0).notNull(),
    kicks: integer('kicks').default(0).notNull(),
    bans: integer('bans').default(0).notNull(),
    unbans: integer('unbans').default(0).notNull(),
    automodActions: integer('automod_actions').default(0).notNull(),
    spamDeleted: integer('spam_deleted').default(0).notNull(),
    phishingDetections: integer('phishing_detections').default(0).notNull(),
    raidIncidents: integer('raid_incidents').default(0).notNull(),
    appeals: integer('appeals').default(0).notNull(),
    ticketsOpened: integer('tickets_opened').default(0).notNull(),
    ticketsClosed: integer('tickets_closed').default(0).notNull(),
    suggestionsCreated: integer('suggestions_created').default(0).notNull(),
    suggestionsAccepted: integer('suggestions_accepted').default(0).notNull(),
    giveaways: integer('giveaways').default(0).notNull(),
    reputationEvents: integer('reputation_events').default(0).notNull(),
    xpEvents: integer('xp_events').default(0).notNull(),
    starboardEntries: integer('starboard_entries').default(0).notNull(),
    topCommands: jsonb('top_commands')
      .$type<JsonRecord[]>()
      .default([])
      .notNull(),
    calculatedMetadata: jsonb('calculated_metadata')
      .$type<JsonRecord>()
      .default({})
      .notNull(),
    calculatedAt: timestamp('calculated_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_guild_analytics_period_unique').on(
      table.guildId,
      table.granularity,
      table.periodStart,
    ),
    index('discord_guild_analytics_range_idx').on(
      table.guildId,
      table.periodStart,
    ),
  ],
);

export const discordChannelAnalyticsSnapshotsTable = pgTable(
  'discord_channel_analytics_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => discordChannelsTable.id, { onDelete: 'restrict' }),
    granularity: discordAnalyticsGranularityDbEnum('granularity')
      .default(DiscordAnalyticsGranularity.Daily)
      .notNull(),
    periodStart: timestamp('period_start', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    periodEnd: timestamp('period_end', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    messageCount: integer('message_count').default(0).notNull(),
    uniqueAuthors: integer('unique_authors').default(0).notNull(),
    reactionCount: integer('reaction_count').default(0).notNull(),
    threadsCreated: integer('threads_created').default(0).notNull(),
    forumPosts: integer('forum_posts').default(0).notNull(),
    forumReplies: integer('forum_replies').default(0).notNull(),
    unansweredForumPosts: integer('unanswered_forum_posts')
      .default(0)
      .notNull(),
    voiceMinutes: integer('voice_minutes').default(0).notNull(),
    aiInteractions: integer('ai_interactions').default(0).notNull(),
    commandExecutions: integer('command_executions').default(0).notNull(),
    calculatedAt: timestamp('calculated_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_channel_analytics_period_unique').on(
      table.channelId,
      table.granularity,
      table.periodStart,
    ),
    index('discord_channel_analytics_range_idx').on(
      table.guildId,
      table.channelId,
      table.periodStart,
    ),
  ],
);

export const discordMemberAnalyticsSnapshotsTable = pgTable(
  'discord_member_analytics_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => discordGuildMembersTable.id, { onDelete: 'restrict' }),
    granularity: discordAnalyticsGranularityDbEnum('granularity')
      .default(DiscordAnalyticsGranularity.Daily)
      .notNull(),
    periodStart: timestamp('period_start', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    periodEnd: timestamp('period_end', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    messages: integer('messages').default(0).notNull(),
    voiceMinutes: integer('voice_minutes').default(0).notNull(),
    commands: integer('commands').default(0).notNull(),
    aiInteractions: integer('ai_interactions').default(0).notNull(),
    musicRequests: integer('music_requests').default(0).notNull(),
    reactions: integer('reactions').default(0).notNull(),
    xp: integer('xp').default(0).notNull(),
    reputation: integer('reputation').default(0).notNull(),
    moderationEvents: integer('moderation_events').default(0).notNull(),
    lastActiveAt: timestamp('last_active_at', {
      withTimezone: true,
      mode: 'date',
    }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
    calculatedAt: timestamp('calculated_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_member_analytics_period_unique').on(
      table.memberId,
      table.granularity,
      table.periodStart,
    ),
    index('discord_member_analytics_range_idx').on(
      table.guildId,
      table.memberId,
      table.periodStart,
    ),
    index('discord_member_analytics_expiry_idx').on(table.expiresAt),
  ],
);

export const discordPresenceSnapshotsTable = pgTable(
  'discord_presence_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    capturedAt: timestamp('captured_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    online: integer('online').default(0).notNull(),
    idle: integer('idle').default(0).notNull(),
    dnd: integer('dnd').default(0).notNull(),
    offlineOrUnknown: integer('offline_or_unknown').default(0).notNull(),
  },
  (table) => [
    uniqueIndex('discord_presence_guild_capture_unique').on(
      table.guildId,
      table.capturedAt,
    ),
    index('discord_presence_guild_time_idx').on(
      table.guildId,
      table.capturedAt,
    ),
  ],
);

export type DiscordGuildAnalyticsSnapshotRow =
  typeof discordGuildAnalyticsSnapshotsTable.$inferSelect;
export type NewDiscordGuildAnalyticsSnapshotRow =
  typeof discordGuildAnalyticsSnapshotsTable.$inferInsert;
export type DiscordChannelAnalyticsSnapshotRow =
  typeof discordChannelAnalyticsSnapshotsTable.$inferSelect;
export type DiscordMemberAnalyticsSnapshotRow =
  typeof discordMemberAnalyticsSnapshotsTable.$inferSelect;
