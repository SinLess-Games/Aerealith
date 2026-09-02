import { getTableColumns, getTableName } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import * as discordSchema from './index';
import {
  discordAccountsTable,
  discordAgeVerificationsTable,
  discordChannelAnalyticsSnapshotsTable,
  discordGuildAnalyticsSnapshotsTable,
  discordGuildModulesTable,
  discordGuildMembersTable,
  discordGuildSettingsTable,
  discordGuildsTable,
  discordMessagesTable,
  discordModerationCasesTable,
  discordProxiedMessagesTable,
} from './index';

describe('Discord schema', () => {
  it('exports the complete bounded table surface', () => {
    const tables = Object.entries(discordSchema).filter(([name]) =>
      name.endsWith('Table'),
    );
    expect(tables).toHaveLength(71);
    expect(
      new Set(
        tables.map(([, table]) =>
          getTableName(table as typeof discordAccountsTable),
        ),
      ).size,
    ).toBe(71);
  });
  it('keeps the canonical connected-account relationship nullable', () => {
    const columns = getTableColumns(discordAccountsTable);
    expect(columns.userAccountId.notNull).toBe(false);
    expect(columns.discordUserId.dataType).toBe('string');
    expect(columns.discordUserId.length).toBe(20);
  });
  it('models durable many-guild membership lifecycle', () => {
    const columns = getTableColumns(discordGuildMembersTable);
    expect(columns.guildId.notNull).toBe(true);
    expect(columns.discordAccountId.notNull).toBe(true);
    expect(columns.leftAt.notNull).toBe(false);
    expect(columns.rejoinCount.hasDefault).toBe(true);
  });
  it('retains guild history independently of installation state', () => {
    const columns = getTableColumns(discordGuildsTable);
    expect(columns.isBotInstalled.hasDefault).toBe(true);
    expect(columns.botLeftAt.notNull).toBe(false);
    expect(columns.deletedAt.notNull).toBe(false);
  });
  it('uses period snapshots for dashboard analytics', () => {
    const columns = getTableColumns(discordGuildAnalyticsSnapshotsTable);
    expect(columns.guildId.notNull).toBe(true);
    expect(columns.granularity.notNull).toBe(true);
    expect(columns.periodStart.notNull).toBe(true);
    expect(columns.messagesSent.hasDefault).toBe(true);
  });
  it('separates purgeable encrypted content from message metadata', () => {
    const columns = getTableColumns(discordMessagesTable);
    expect(columns.contentCiphertext.notNull).toBe(false);
    expect(columns.contentPurgeAt.notNull).toBe(false);
    expect(columns.characterCount.hasDefault).toBe(true);
  });
  it('stores only opaque verification references, not raw identity material', () => {
    const names = Object.keys(getTableColumns(discordAgeVerificationsTable));
    expect(names).toContain('providerReference');
    expect(names).toContain('evidenceObjectReference');
    expect(names).not.toContain('governmentIdNumber');
    expect(names).not.toContain('documentImage');
  });
  it('maps proxied messages back to the actual account and persona', () => {
    const columns = getTableColumns(discordProxiedMessagesTable);
    expect(columns.originalAuthorAccountId.notNull).toBe(true);
    expect(columns.personaId.notNull).toBe(true);
    expect(columns.resultingDiscordMessageId.notNull).toBe(true);
  });
  it('constrains guild settings, modules, and analytics rollups for idempotent writes', () => {
    expect(
      getTableConfig(discordGuildSettingsTable).indexes.map(
        (index) => index.config.name,
      ),
    ).toContain('discord_guild_settings_guild_unique');
    expect(
      getTableConfig(discordGuildModulesTable).indexes.map(
        (index) => index.config.name,
      ),
    ).toContain('discord_guild_modules_key_unique');
    expect(
      getTableConfig(discordGuildAnalyticsSnapshotsTable).indexes.map(
        (index) => index.config.name,
      ),
    ).toContain('discord_guild_analytics_period_unique');
    expect(
      getTableConfig(discordChannelAnalyticsSnapshotsTable).indexes.map(
        (index) => index.config.name,
      ),
    ).toContain('discord_channel_analytics_period_unique');
  });
  it('keeps moderation history when a membership record is removed', () => {
    const columns = getTableColumns(discordModerationCasesTable);
    const memberForeignKey = getTableConfig(
      discordModerationCasesTable,
    ).foreignKeys.find(
      (foreignKey) =>
        foreignKey.reference().columns[0] === columns.targetMemberId,
    );

    expect(columns.targetAccountId.notNull).toBe(true);
    expect(columns.targetMemberId.notNull).toBe(false);
    expect(memberForeignKey?.onDelete).toBe('set null');
  });
});
