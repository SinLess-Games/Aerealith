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
  DiscordScheduledActionStatus,
  discordScheduledActionStatusDbEnum,
  discordScheduledActionTypeDbEnum,
} from '../../enums/discord';
import { discordAccountsTable } from './accounts.table';
import { discordChannelsTable } from './channels.table';
import type { JsonRecord } from './discord.types';
import { discordGuildsTable } from './guilds.table';
import {
  discordGuildMembersTable,
  discordRolesTable,
} from './members-roles.table';
import { discordMessagesTable } from './messages-voice.table';

export const discordSuggestionsTable = pgTable(
  'discord_suggestions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    authorAccountId: uuid('author_account_id')
      .notNull()
      .references(() => discordAccountsTable.id, { onDelete: 'restrict' }),
    channelId: uuid('channel_id').references(() => discordChannelsTable.id, {
      onDelete: 'set null',
    }),
    messageId: uuid('message_id').references(() => discordMessagesTable.id, {
      onDelete: 'set null',
    }),
    content: text('content').notNull(),
    status: varchar('status', { length: 32 }).default('pending').notNull(),
    upvotes: integer('upvotes').default(0).notNull(),
    downvotes: integer('downvotes').default(0).notNull(),
    staffResponse: text('staff_response'),
    reviewerAccountId: uuid('reviewer_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'date' }),
    completedAt: timestamp('completed_at', {
      withTimezone: true,
      mode: 'date',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('discord_suggestions_guild_status_idx').on(
      table.guildId,
      table.status,
      table.createdAt,
    ),
  ],
);

export const discordStarboardConfigurationsTable = pgTable(
  'discord_starboard_configurations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'cascade' }),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => discordChannelsTable.id, { onDelete: 'restrict' }),
    emojiKey: varchar('emoji_key', { length: 128 }).default('⭐').notNull(),
    threshold: integer('threshold').default(3).notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    settings: jsonb('settings').$type<JsonRecord>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_starboard_config_guild_unique').on(table.guildId),
  ],
);

export const discordStarboardEntriesTable = pgTable(
  'discord_starboard_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    sourceMessageId: uuid('source_message_id')
      .notNull()
      .references(() => discordMessagesTable.id, { onDelete: 'restrict' }),
    starboardMessageId: uuid('starboard_message_id').references(
      () => discordMessagesTable.id,
      { onDelete: 'set null' },
    ),
    starCount: integer('star_count').default(0).notNull(),
    state: varchar('state', { length: 32 }).default('active').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_starboard_source_unique').on(table.sourceMessageId),
    index('discord_starboard_guild_count_idx').on(
      table.guildId,
      table.starCount,
    ),
  ],
);

export const discordMemberLevelsTable = pgTable(
  'discord_member_levels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => discordGuildMembersTable.id, { onDelete: 'cascade' }),
    currentXp: integer('current_xp').default(0).notNull(),
    lifetimeXp: integer('lifetime_xp').default(0).notNull(),
    level: integer('level').default(0).notNull(),
    messageXp: integer('message_xp').default(0).notNull(),
    voiceXp: integer('voice_xp').default(0).notNull(),
    bonusXp: integer('bonus_xp').default(0).notNull(),
    rank: integer('rank'),
    lastXpAt: timestamp('last_xp_at', { withTimezone: true, mode: 'date' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_member_levels_member_unique').on(table.memberId),
    index('discord_member_levels_guild_rank_idx').on(
      table.guildId,
      table.lifetimeXp,
    ),
  ],
);

export const discordLevelRoleRewardsTable = pgTable(
  'discord_level_role_rewards',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => discordRolesTable.id, { onDelete: 'cascade' }),
    level: integer('level').notNull(),
    removePrevious: boolean('remove_previous').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_level_rewards_guild_level_unique').on(
      table.guildId,
      table.level,
    ),
  ],
);

export const discordMemberReputationTable = pgTable(
  'discord_member_reputation',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => discordGuildMembersTable.id, { onDelete: 'cascade' }),
    score: integer('score').default(0).notNull(),
    lifetimeScore: integer('lifetime_score').default(0).notNull(),
    givesReceived: integer('gives_received').default(0).notNull(),
    givesSent: integer('gives_sent').default(0).notNull(),
    lastGivenAt: timestamp('last_given_at', {
      withTimezone: true,
      mode: 'date',
    }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_member_reputation_member_unique').on(table.memberId),
    index('discord_member_reputation_guild_score_idx').on(
      table.guildId,
      table.score,
    ),
  ],
);

export const discordReputationEventsTable = pgTable(
  'discord_reputation_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    receiverMemberId: uuid('receiver_member_id')
      .notNull()
      .references(() => discordGuildMembersTable.id, { onDelete: 'restrict' }),
    giverMemberId: uuid('giver_member_id').references(
      () => discordGuildMembersTable.id,
      { onDelete: 'set null' },
    ),
    amount: integer('amount').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    index('discord_reputation_events_receiver_idx').on(
      table.receiverMemberId,
      table.createdAt,
    ),
  ],
);

export const discordRoleAssignmentConfigurationsTable = pgTable(
  'discord_role_assignment_configurations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'cascade' }),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => discordChannelsTable.id, { onDelete: 'restrict' }),
    messageId: uuid('message_id')
      .notNull()
      .references(() => discordMessagesTable.id, { onDelete: 'restrict' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => discordRolesTable.id, { onDelete: 'cascade' }),
    triggerType: varchar('trigger_type', { length: 16 })
      .$type<'reaction' | 'button'>()
      .notNull(),
    triggerKey: varchar('trigger_key', { length: 128 }).notNull(),
    behavior: varchar('behavior', { length: 32 }).default('toggle').notNull(),
    exclusiveGroup: varchar('exclusive_group', { length: 100 }),
    requiredRoleIds: jsonb('required_role_ids')
      .$type<string[]>()
      .default([])
      .notNull(),
    prohibitedRoleIds: jsonb('prohibited_role_ids')
      .$type<string[]>()
      .default([])
      .notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_role_assignment_trigger_unique').on(
      table.messageId,
      table.triggerKey,
    ),
  ],
);

export const discordAutorolesTable = pgTable(
  'discord_autoroles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => discordRolesTable.id, { onDelete: 'cascade' }),
    targetType: varchar('target_type', { length: 16 })
      .default('human')
      .notNull(),
    delaySeconds: integer('delay_seconds').default(0).notNull(),
    requirements: jsonb('requirements')
      .$type<JsonRecord>()
      .default({})
      .notNull(),
    minimumTier: varchar('minimum_tier', { length: 32 }),
    requiresAgeVerification: boolean('requires_age_verification')
      .default(false)
      .notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_autoroles_guild_role_unique').on(
      table.guildId,
      table.roleId,
    ),
  ],
);

export const discordGreetingConfigurationsTable = pgTable(
  'discord_greeting_configurations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'cascade' }),
    greetingType: varchar('greeting_type', { length: 16 })
      .$type<'welcome' | 'goodbye'>()
      .notNull(),
    channelId: uuid('channel_id').references(() => discordChannelsTable.id, {
      onDelete: 'set null',
    }),
    dmEnabled: boolean('dm_enabled').default(false).notNull(),
    template: text('template').notNull(),
    embed: jsonb('embed').$type<JsonRecord>().default({}).notNull(),
    imageObjectReference: text('image_object_reference'),
    enabled: boolean('enabled').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_greeting_guild_type_unique').on(
      table.guildId,
      table.greetingType,
    ),
  ],
);

export const discordGreetingEventsTable = pgTable(
  'discord_greeting_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => discordGuildMembersTable.id, { onDelete: 'restrict' }),
    greetingType: varchar('greeting_type', { length: 16 }).notNull(),
    delivered: boolean('delivered').default(false).notNull(),
    failureCode: varchar('failure_code', { length: 100 }),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('discord_greeting_events_guild_time_idx').on(
      table.guildId,
      table.occurredAt,
    ),
  ],
);

export const discordCustomCommandsTable = pgTable(
  'discord_custom_commands',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 64 }).notNull(),
    aliases: jsonb('aliases').$type<string[]>().default([]).notNull(),
    triggerType: varchar('trigger_type', { length: 32 })
      .default('exact')
      .notNull(),
    response: text('response').notNull(),
    embed: jsonb('embed').$type<JsonRecord>().default({}).notNull(),
    requiredRoleIds: jsonb('required_role_ids')
      .$type<string[]>()
      .default([])
      .notNull(),
    blockedRoleIds: jsonb('blocked_role_ids')
      .$type<string[]>()
      .default([])
      .notNull(),
    allowedChannelIds: jsonb('allowed_channel_ids')
      .$type<string[]>()
      .default([])
      .notNull(),
    cooldownSeconds: integer('cooldown_seconds').default(0).notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    createdByAccountId: uuid('created_by_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    usageCount: integer('usage_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_custom_commands_guild_name_unique').on(
      table.guildId,
      table.name,
    ),
  ],
);

export const discordScheduledActionsTable = pgTable(
  'discord_scheduled_actions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id').references(() => discordGuildsTable.id, {
      onDelete: 'cascade',
    }),
    accountId: uuid('account_id').references(() => discordAccountsTable.id, {
      onDelete: 'set null',
    }),
    actionType: discordScheduledActionTypeDbEnum('action_type').notNull(),
    status: discordScheduledActionStatusDbEnum('status')
      .default(DiscordScheduledActionStatus.Pending)
      .notNull(),
    executeAt: timestamp('execute_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    payload: jsonb('payload').$type<JsonRecord>().default({}).notNull(),
    queueReference: varchar('queue_reference', { length: 128 }),
    attemptCount: integer('attempt_count').default(0).notNull(),
    lastFailureCode: varchar('last_failure_code', { length: 100 }),
    lockedAt: timestamp('locked_at', { withTimezone: true, mode: 'date' }),
    completedAt: timestamp('completed_at', {
      withTimezone: true,
      mode: 'date',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('discord_scheduled_actions_due_idx').on(
      table.status,
      table.executeAt,
    ),
    index('discord_scheduled_actions_guild_idx').on(
      table.guildId,
      table.executeAt,
    ),
  ],
);

export const discordGiveawaysTable = pgTable(
  'discord_giveaways',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    hostAccountId: uuid('host_account_id')
      .notNull()
      .references(() => discordAccountsTable.id, { onDelete: 'restrict' }),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => discordChannelsTable.id, { onDelete: 'restrict' }),
    messageId: uuid('message_id').references(() => discordMessagesTable.id, {
      onDelete: 'set null',
    }),
    prize: text('prize').notNull(),
    description: text('description'),
    startsAt: timestamp('starts_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    endsAt: timestamp('ends_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    winnerCount: integer('winner_count').default(1).notNull(),
    requirements: jsonb('requirements')
      .$type<JsonRecord>()
      .default({})
      .notNull(),
    status: varchar('status', { length: 32 }).default('scheduled').notNull(),
    rerollCount: integer('reroll_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('discord_giveaways_guild_status_idx').on(
      table.guildId,
      table.status,
      table.endsAt,
    ),
  ],
);

export const discordGiveawayEntrantsTable = pgTable(
  'discord_giveaway_entrants',
  {
    giveawayId: uuid('giveaway_id')
      .notNull()
      .references(() => discordGiveawaysTable.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => discordAccountsTable.id, { onDelete: 'cascade' }),
    enteredAt: timestamp('entered_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    selectedAsWinner: boolean('selected_as_winner').default(false).notNull(),
    selectedAt: timestamp('selected_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    uniqueIndex('discord_giveaway_entrant_unique').on(
      table.giveawayId,
      table.accountId,
    ),
  ],
);

export const discordPollsTable = pgTable(
  'discord_polls',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => discordChannelsTable.id, { onDelete: 'restrict' }),
    messageId: uuid('message_id').references(() => discordMessagesTable.id, {
      onDelete: 'set null',
    }),
    creatorAccountId: uuid('creator_account_id')
      .notNull()
      .references(() => discordAccountsTable.id, { onDelete: 'restrict' }),
    question: text('question').notNull(),
    options: jsonb('options').$type<JsonRecord[]>().default([]).notNull(),
    anonymous: boolean('anonymous').default(false).notNull(),
    multiSelect: boolean('multi_select').default(false).notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true, mode: 'date' }),
    status: varchar('status', { length: 32 }).default('open').notNull(),
  },
  (table) => [
    index('discord_polls_guild_status_idx').on(table.guildId, table.status),
  ],
);

export const discordPollVotesTable = pgTable(
  'discord_poll_votes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    pollId: uuid('poll_id')
      .notNull()
      .references(() => discordPollsTable.id, { onDelete: 'cascade' }),
    voterAccountId: uuid('voter_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'cascade' },
    ),
    voterKeyHash: varchar('voter_key_hash', { length: 128 }).notNull(),
    optionKey: varchar('option_key', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_poll_vote_option_unique').on(
      table.pollId,
      table.voterKeyHash,
      table.optionKey,
    ),
  ],
);

export const discordFeedConfigurationsTable = pgTable(
  'discord_feed_configurations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'cascade' }),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => discordChannelsTable.id, { onDelete: 'restrict' }),
    provider: varchar('provider', { length: 64 }).notNull(),
    externalReference: text('external_reference').notNull(),
    configuration: jsonb('configuration')
      .$type<JsonRecord>()
      .default({})
      .notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    lastCursor: text('last_cursor'),
    lastSyncedAt: timestamp('last_synced_at', {
      withTimezone: true,
      mode: 'date',
    }),
    lastFailureCode: varchar('last_failure_code', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('discord_feeds_guild_provider_idx').on(
      table.guildId,
      table.provider,
      table.enabled,
    ),
  ],
);

export type DiscordScheduledActionRow =
  typeof discordScheduledActionsTable.$inferSelect;
