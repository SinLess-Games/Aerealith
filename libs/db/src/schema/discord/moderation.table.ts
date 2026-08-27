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
  DiscordAppealStatus,
  DiscordDataProvenance,
  DiscordModerationCaseStatus,
  discordAppealStatusDbEnum,
  discordDataProvenanceDbEnum,
  discordModerationActionDbEnum,
  discordModerationCaseStatusDbEnum,
} from '../../enums/discord';
import { discordAccountsTable } from './accounts.table';
import { discordChannelsTable } from './channels.table';
import type { JsonRecord } from './discord.types';
import { discordGuildsTable } from './guilds.table';
import {
  discordAuditLogEntriesTable,
  discordNativeAutomodRulesTable,
} from './integrations.table';
import { discordGuildMembersTable } from './members-roles.table';
import { discordMessagesTable } from './messages-voice.table';

export const discordModerationCasesTable = pgTable(
  'discord_moderation_cases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    caseNumber: integer('case_number').notNull(),
    targetAccountId: uuid('target_account_id')
      .notNull()
      .references(() => discordAccountsTable.id, { onDelete: 'restrict' }),
    targetMemberId: uuid('target_member_id').references(
      () => discordGuildMembersTable.id,
      { onDelete: 'set null' },
    ),
    moderatorAccountId: uuid('moderator_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    action: discordModerationActionDbEnum('action').notNull(),
    status: discordModerationCaseStatusDbEnum('status')
      .default(DiscordModerationCaseStatus.Open)
      .notNull(),
    source: varchar('source', { length: 64 }).default('manual').notNull(),
    provenance: discordDataProvenanceDbEnum('provenance')
      .default(DiscordDataProvenance.Moderator)
      .notNull(),
    reason: text('reason'),
    publicReason: text('public_reason'),
    internalNotesCiphertext: text('internal_notes_ciphertext'),
    durationSeconds: integer('duration_seconds'),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
    relatedAuditLogEntryId: uuid('related_audit_log_entry_id').references(
      () => discordAuditLogEntriesTable.id,
      { onDelete: 'set null' },
    ),
    relatedNativeAutomodRuleId: uuid(
      'related_native_automod_rule_id',
    ).references(() => discordNativeAutomodRulesTable.id, {
      onDelete: 'set null',
    }),
    relatedMessageId: uuid('related_message_id').references(
      () => discordMessagesTable.id,
      { onDelete: 'set null' },
    ),
    relatedChannelId: uuid('related_channel_id').references(
      () => discordChannelsTable.id,
      { onDelete: 'set null' },
    ),
    resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'date' }),
    reversedAt: timestamp('reversed_at', { withTimezone: true, mode: 'date' }),
    expiredAt: timestamp('expired_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('discord_mod_cases_guild_number_unique').on(
      table.guildId,
      table.caseNumber,
    ),
    index('discord_mod_cases_guild_status_idx').on(table.guildId, table.status),
    index('discord_mod_cases_target_time_idx').on(
      table.targetAccountId,
      table.createdAt,
    ),
    index('discord_mod_cases_expiry_idx').on(table.status, table.expiresAt),
  ],
);

export const discordModerationEvidenceTable = pgTable(
  'discord_moderation_evidence',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => discordModerationCasesTable.id, {
        onDelete: 'cascade',
      }),
    evidenceType: varchar('evidence_type', { length: 32 }).notNull(),
    messageId: uuid('message_id').references(() => discordMessagesTable.id, {
      onDelete: 'set null',
    }),
    objectReference: text('object_reference'),
    externalUrl: text('external_url'),
    noteCiphertext: text('note_ciphertext'),
    evidenceHash: varchar('evidence_hash', { length: 128 }),
    collectedByAccountId: uuid('collected_by_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    capturedAt: timestamp('captured_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    purgeAt: timestamp('purge_at', { withTimezone: true, mode: 'date' }),
    purgedAt: timestamp('purged_at', { withTimezone: true, mode: 'date' }),
    metadata: jsonb('metadata').$type<JsonRecord>().default({}).notNull(),
  },
  (table) => [
    index('discord_mod_evidence_case_idx').on(table.caseId, table.capturedAt),
    index('discord_mod_evidence_purge_idx').on(table.purgeAt),
  ],
);

export const discordModerationAppealsTable = pgTable(
  'discord_moderation_appeals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    caseId: uuid('case_id')
      .notNull()
      .references(() => discordModerationCasesTable.id, {
        onDelete: 'restrict',
      }),
    appellantAccountId: uuid('appellant_account_id')
      .notNull()
      .references(() => discordAccountsTable.id, { onDelete: 'restrict' }),
    contentCiphertext: text('content_ciphertext').notNull(),
    status: discordAppealStatusDbEnum('status')
      .default(DiscordAppealStatus.Pending)
      .notNull(),
    reviewerAccountId: uuid('reviewer_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    responseCiphertext: text('response_ciphertext'),
    submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'date' }),
    closedAt: timestamp('closed_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    index('discord_mod_appeals_guild_status_idx').on(
      table.guildId,
      table.status,
    ),
    index('discord_mod_appeals_case_idx').on(table.caseId),
  ],
);

export const discordAutomodRulesTable = pgTable(
  'discord_automod_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    priority: integer('priority').default(0).notNull(),
    triggerType: varchar('trigger_type', { length: 64 }).notNull(),
    triggerConfiguration: jsonb('trigger_configuration')
      .$type<JsonRecord>()
      .default({})
      .notNull(),
    conditions: jsonb('conditions').$type<JsonRecord>().default({}).notNull(),
    exemptAccountIds: jsonb('exempt_account_ids')
      .$type<string[]>()
      .default([])
      .notNull(),
    exemptRoleDiscordIds: jsonb('exempt_role_discord_ids')
      .$type<string[]>()
      .default([])
      .notNull(),
    exemptChannelDiscordIds: jsonb('exempt_channel_discord_ids')
      .$type<string[]>()
      .default([])
      .notNull(),
    actions: jsonb('actions').$type<JsonRecord[]>().default([]).notNull(),
    escalation: jsonb('escalation').$type<JsonRecord>().default({}).notNull(),
    createdByAccountId: uuid('created_by_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    uniqueIndex('discord_automod_rules_guild_name_unique').on(
      table.guildId,
      table.name,
    ),
    index('discord_automod_rules_guild_enabled_idx').on(
      table.guildId,
      table.enabled,
      table.priority,
    ),
  ],
);

export const discordRaidIncidentsTable = pgTable(
  'discord_raid_incidents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => discordGuildsTable.id, { onDelete: 'restrict' }),
    startedAt: timestamp('started_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true, mode: 'date' }),
    detectionSource: varchar('detection_source', { length: 64 }).notNull(),
    joinVelocityPerMinute: integer('join_velocity_per_minute')
      .default(0)
      .notNull(),
    accountIds: jsonb('account_ids').$type<string[]>().default([]).notNull(),
    actionsTaken: jsonb('actions_taken')
      .$type<JsonRecord[]>()
      .default([])
      .notNull(),
    lockdownActive: boolean('lockdown_active').default(false).notNull(),
    acknowledgedByAccountId: uuid('acknowledged_by_account_id').references(
      () => discordAccountsTable.id,
      { onDelete: 'set null' },
    ),
    acknowledgedAt: timestamp('acknowledged_at', {
      withTimezone: true,
      mode: 'date',
    }),
    resolution: text('resolution'),
    notesCiphertext: text('notes_ciphertext'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('discord_raid_incidents_guild_time_idx').on(
      table.guildId,
      table.startedAt,
    ),
  ],
);

export type DiscordModerationCaseRow =
  typeof discordModerationCasesTable.$inferSelect;
export type NewDiscordModerationCaseRow =
  typeof discordModerationCasesTable.$inferInsert;
