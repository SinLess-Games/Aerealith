import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import {
  DiscordDataProvenance,
  DiscordMembershipStatus,
  DiscordRoleAssignmentSource,
  discordDataProvenanceDbEnum,
  discordMembershipStatusDbEnum,
  discordRoleAssignmentSourceDbEnum,
} from '../../enums/discord';
import { discordAccountsTable } from './accounts.table';
import type { JsonRecord } from './discord.types';
import { discordGuildsTable } from './guilds.table';

export const discordGuildMembersTable = pgTable(
  'discord_guild_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    discordAccountId: uuid('discord_account_id')
      .notNull()
      .references(() => discordAccountsTable.id, { onDelete: 'restrict' }),
    discordUserId: varchar('discord_user_id', { length: 20 }).notNull(),
    nickname: varchar('nickname', { length: 100 }),
    guildAvatarHash: varchar('guild_avatar_hash', { length: 128 }),
    guildProfileMetadata: jsonb('guild_profile_metadata')
      .$type<JsonRecord>()
      .default({})
      .notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true, mode: 'date' }),
    firstSeenAt: timestamp('first_seen_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    leftAt: timestamp('left_at', { withTimezone: true, mode: 'date' }),
    premiumSince: timestamp('premium_since', {
      withTimezone: true,
      mode: 'date',
    }),
    pending: boolean('pending').default(false).notNull(),
    flags: varchar('flags', { length: 32 }).default('0').notNull(),
    serverMuted: boolean('server_muted').default(false).notNull(),
    serverDeafened: boolean('server_deafened').default(false).notNull(),
    communicationDisabledUntil: timestamp('communication_disabled_until', {
      withTimezone: true,
      mode: 'date',
    }),
    status: discordMembershipStatusDbEnum('status')
      .default(DiscordMembershipStatus.Active)
      .notNull(),
    isBot: boolean('is_bot').default(false).notNull(),
    isPresent: boolean('is_present').default(true).notNull(),
    rejoinCount: integer('rejoin_count').default(0).notNull(),
    lastSyncedAt: timestamp('last_synced_at', {
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
    uniqueIndex('discord_members_guild_account_unique').on(
      table.guildId,
      table.discordAccountId,
    ),
    index('discord_members_guild_status_idx').on(table.guildId, table.status),
    index('discord_members_account_status_idx').on(
      table.discordAccountId,
      table.status,
    ),
    index('discord_members_guild_user_idx').on(
      table.guildId,
      table.discordUserId,
    ),
    index('discord_members_last_seen_idx').on(table.guildId, table.lastSeenAt),
  ],
);

export const discordGuildMemberEventsTable = pgTable(
  'discord_guild_member_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => discordGuildMembersTable.id, { onDelete: 'restrict' }),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    status: discordMembershipStatusDbEnum('status').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    actorAccountId: uuid('actor_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    reason: text('reason'),
    metadata: jsonb('metadata').$type<JsonRecord>().default({}).notNull(),
  },
  (table) => [
    index('discord_member_events_member_time_idx').on(
      table.memberId,
      table.occurredAt,
    ),
    index('discord_member_events_guild_time_idx').on(
      table.guildId,
      table.occurredAt,
    ),
  ],
);

export const discordRolesTable = pgTable(
  'discord_roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    discordRoleId: varchar('discord_role_id', { length: 20 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    position: integer('position').default(0).notNull(),
    color: integer('color').default(0).notNull(),
    hoisted: boolean('hoisted').default(false).notNull(),
    managed: boolean('managed').default(false).notNull(),
    mentionable: boolean('mentionable').default(false).notNull(),
    permissions: varchar('permissions', { length: 32 }).default('0').notNull(),
    iconHash: varchar('icon_hash', { length: 128 }),
    unicodeEmoji: varchar('unicode_emoji', { length: 32 }),
    tags: jsonb('tags').$type<JsonRecord>().default({}).notNull(),
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
    uniqueIndex('discord_roles_discord_id_unique').on(table.discordRoleId),
    index('discord_roles_guild_position_idx').on(table.guildId, table.position),
    index('discord_roles_guild_deleted_idx').on(table.guildId, table.deletedAt),
  ],
);

export const discordGuildMemberRolesTable = pgTable(
  'discord_guild_member_roles',
  {
    memberId: uuid('member_id')
      .notNull()
      .references(() => discordGuildMembersTable.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => discordRolesTable.id, { onDelete: 'cascade' }),
    source: discordRoleAssignmentSourceDbEnum('source')
      .default(DiscordRoleAssignmentSource.Discord)
      .notNull(),
    assignedAt: timestamp('assigned_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    removedAt: timestamp('removed_at', { withTimezone: true, mode: 'date' }),
    active: boolean('active').default(true).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
    metadata: jsonb('metadata').$type<JsonRecord>().default({}).notNull(),
  },
  (table) => [
    primaryKey({
      name: 'discord_guild_member_roles_pk',
      columns: [table.memberId, table.roleId],
    }),
    index('discord_member_roles_role_active_idx').on(
      table.roleId,
      table.active,
    ),
    index('discord_member_roles_expiry_idx').on(table.expiresAt),
  ],
);

export const discordGuildMemberRoleEventsTable = pgTable(
  'discord_guild_member_role_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => discordGuildMembersTable.id, { onDelete: 'restrict' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => discordRolesTable.id, { onDelete: 'restrict' }),
    action: varchar('action', { length: 16 })
      .$type<'assigned' | 'removed'>()
      .notNull(),
    source: discordRoleAssignmentSourceDbEnum('source')
      .default(DiscordRoleAssignmentSource.Discord)
      .notNull(),
    provenance: discordDataProvenanceDbEnum('provenance')
      .default(DiscordDataProvenance.Discord)
      .notNull(),
    actorAccountId: uuid('actor_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    metadata: jsonb('metadata').$type<JsonRecord>().default({}).notNull(),
  },
  (table) => [
    index('discord_member_role_events_member_time_idx').on(
      table.memberId,
      table.occurredAt,
    ),
  ],
);

export type DiscordGuildMemberRow =
  typeof discordGuildMembersTable.$inferSelect;
export type NewDiscordGuildMemberRow =
  typeof discordGuildMembersTable.$inferInsert;
export type DiscordRoleRow = typeof discordRolesTable.$inferSelect;
export type NewDiscordRoleRow = typeof discordRolesTable.$inferInsert;
