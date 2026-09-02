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
  DiscordProxyStatus,
  DiscordTicketPriority,
  DiscordTicketStatus,
  discordProxyStatusDbEnum,
  discordTicketPriorityDbEnum,
  discordTicketStatusDbEnum,
} from '../../enums/discord';
import { discordAccountsTable } from './accounts.table';
import { discordChannelsTable } from './channels.table';
import type { JsonRecord } from './discord.types';
import { discordGuildsTable } from './guilds.table';
import { discordMessagesTable } from './messages-voice.table';
import { discordWebhooksTable } from './integrations.table';

export const discordPersonasTable = pgTable(
  'discord_personas',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerAccountId: uuid('owner_account_id')
      .notNull()
      .references(() => discordAccountsTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    avatarObjectReference: text('avatar_object_reference'),
    description: text('description'),
    color: integer('color'),
    pronouns: varchar('pronouns', { length: 100 }),
    profile: jsonb('profile').$type<JsonRecord>().default({}).notNull(),
    groupName: varchar('group_name', { length: 100 }),
    tags: jsonb('tags').$type<string[]>().default([]).notNull(),
    status: discordProxyStatusDbEnum('status')
      .default(DiscordProxyStatus.Active)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    uniqueIndex('discord_personas_owner_name_unique').on(
      table.ownerAccountId,
      table.name,
    ),
    index('discord_personas_owner_status_idx').on(
      table.ownerAccountId,
      table.status,
    ),
  ],
);

export const discordPersonaProxyPatternsTable = pgTable(
  'discord_persona_proxy_patterns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    personaId: uuid('persona_id')
      .notNull()
      .references(() => discordPersonasTable.id, { onDelete: 'cascade' }),
    prefix: varchar('prefix', { length: 100 }).default('').notNull(),
    suffix: varchar('suffix', { length: 100 }).default('').notNull(),
    regexPattern: text('regex_pattern'),
    priority: integer('priority').default(0).notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_proxy_patterns_persona_pattern_unique').on(
      table.personaId,
      table.prefix,
      table.suffix,
    ),
    index('discord_proxy_patterns_enabled_idx').on(
      table.enabled,
      table.priority,
    ),
  ],
);

export const discordPersonaGuildSettingsTable = pgTable(
  'discord_persona_guild_settings',
  {
    personaId: uuid('persona_id')
      .notNull()
      .references(() => discordPersonasTable.id, { onDelete: 'cascade' }),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'cascade' }),
    enabled: boolean('enabled').default(true).notNull(),
    nicknameOverride: varchar('nickname_override', { length: 100 }),
    avatarObjectReference: text('avatar_object_reference'),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_persona_guild_unique').on(
      table.personaId,
      table.guildId,
    ),
  ],
);

export const discordProxiedMessagesTable = pgTable(
  'discord_proxied_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => discordChannelsTable.id, { onDelete: 'restrict' }),
    originalAuthorAccountId: uuid('original_author_account_id')
      .notNull()
      .references(() => discordAccountsTable.id, { onDelete: 'restrict' }),
    personaId: uuid('persona_id')
      .notNull()
      .references(() => discordPersonasTable.id, { onDelete: 'restrict' }),
    webhookId: uuid('webhook_id').references(() => discordWebhooksTable.id, {
      onDelete: 'set null',
    }),
    resultingMessageId: uuid('resulting_message_id').references(
      () => discordMessagesTable.id,
      { onDelete: 'set null' },
    ),
    resultingDiscordMessageId: varchar('resulting_discord_message_id', {
      length: 20,
    }).notNull(),
    originalDiscordMessageId: varchar('original_discord_message_id', {
      length: 20,
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    editedAt: timestamp('edited_at', { withTimezone: true, mode: 'date' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    uniqueIndex('discord_proxied_messages_result_unique').on(
      table.resultingDiscordMessageId,
    ),
    index('discord_proxied_messages_owner_idx').on(
      table.originalAuthorAccountId,
      table.createdAt,
    ),
    index('discord_proxied_messages_guild_idx').on(
      table.guildId,
      table.createdAt,
    ),
  ],
);

export const discordTicketsTable = pgTable(
  'discord_tickets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    ticketNumber: integer('ticket_number').notNull(),
    creatorAccountId: uuid('creator_account_id')
      .notNull()
      .references(() => discordAccountsTable.id, { onDelete: 'restrict' }),
    assignedStaffAccountId: uuid('assigned_staff_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    category: varchar('category', { length: 100 }),
    channelId: uuid('channel_id').references(() => discordChannelsTable.id, {
      onDelete: 'set null',
    }),
    status: discordTicketStatusDbEnum('status')
      .default(DiscordTicketStatus.Open)
      .notNull(),
    priority: discordTicketPriorityDbEnum('priority')
      .default(DiscordTicketPriority.Normal)
      .notNull(),
    subject: text('subject').notNull(),
    claimedAt: timestamp('claimed_at', { withTimezone: true, mode: 'date' }),
    closedAt: timestamp('closed_at', { withTimezone: true, mode: 'date' }),
    reopenedAt: timestamp('reopened_at', { withTimezone: true, mode: 'date' }),
    archivedAt: timestamp('archived_at', { withTimezone: true, mode: 'date' }),
    closureReason: text('closure_reason'),
    transcriptObjectReference: text('transcript_object_reference'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_tickets_guild_number_unique').on(
      table.guildId,
      table.ticketNumber,
    ),
    index('discord_tickets_guild_status_idx').on(
      table.guildId,
      table.status,
      table.createdAt,
    ),
    index('discord_tickets_creator_idx').on(
      table.creatorAccountId,
      table.createdAt,
    ),
  ],
);

export const discordTicketParticipantsTable = pgTable(
  'discord_ticket_participants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => discordTicketsTable.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => discordAccountsTable.id, { onDelete: 'restrict' }),
    role: varchar('role', { length: 32 }).default('participant').notNull(),
    addedAt: timestamp('added_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    removedAt: timestamp('removed_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    uniqueIndex('discord_ticket_participant_unique').on(
      table.ticketId,
      table.accountId,
    ),
  ],
);

export const discordTicketEventsTable = pgTable(
  'discord_ticket_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => discordTicketsTable.id, { onDelete: 'cascade' }),
    actorAccountId: uuid('actor_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    eventType: varchar('event_type', { length: 32 }).notNull(),
    details: jsonb('details').$type<JsonRecord>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('discord_ticket_events_ticket_time_idx').on(
      table.ticketId,
      table.createdAt,
    ),
  ],
);

export type DiscordPersonaRow = typeof discordPersonasTable.$inferSelect;
export type DiscordTicketRow = typeof discordTicketsTable.$inferSelect;
