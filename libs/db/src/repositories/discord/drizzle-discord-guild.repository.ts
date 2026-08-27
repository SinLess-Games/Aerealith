import { eq } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  toDiscordGuildInsert,
  type DiscordGuildTransport,
} from '../../mappers/discord';
import {
  getDiscordGuildDashboardSummary,
  getDiscordGuildModules,
  getDiscordGuildResourceCounts,
  getDiscordGuildSyncState,
  getDiscordGuildWithSettings,
} from '../../queries/discord';
import {
  discordGuildModulesTable,
  discordGuildSettingsTable,
  discordGuildSyncStatesTable,
  discordGuildsTable,
} from '../../schema';

export class DrizzleDiscordGuildRepository {
  constructor(private readonly database: DatabaseClient) {}
  async findById(id: string) {
    const [row] = await this.database
      .select()
      .from(discordGuildsTable)
      .where(eq(discordGuildsTable.id, id))
      .limit(1);
    return row ?? null;
  }
  getWithSettings(discordGuildId: string) {
    return getDiscordGuildWithSettings(this.database, discordGuildId);
  }
  getDashboardSummary(discordGuildId: string) {
    return getDiscordGuildDashboardSummary(this.database, discordGuildId);
  }
  getResourceCounts(guildId: string) {
    return getDiscordGuildResourceCounts(this.database, guildId);
  }
  getModules(guildId: string, enabledOnly = false) {
    return getDiscordGuildModules(this.database, guildId, enabledOnly);
  }
  getSyncState(guildId: string) {
    return getDiscordGuildSyncState(this.database, guildId);
  }
  async upsert(guild: DiscordGuildTransport) {
    const values = toDiscordGuildInsert(guild);
    const [row] = await this.database
      .insert(discordGuildsTable)
      .values(values)
      .onConflictDoUpdate({
        target: discordGuildsTable.discordGuildId,
        set: {
          ...values,
          firstSeenAt: undefined,
          updatedAt: new Date(),
          deletedAt: null,
        },
      })
      .returning();
    if (!row) throw new Error('Failed to upsert Discord guild.');
    return row;
  }
  async setInstallationState(
    guildId: string,
    installed: boolean,
    occurredAt = new Date(),
  ) {
    const [row] = await this.database
      .update(discordGuildsTable)
      .set({
        isBotInstalled: installed,
        botJoinedAt: installed ? occurredAt : undefined,
        botLeftAt: installed ? null : occurredAt,
        updatedAt: occurredAt,
      })
      .where(eq(discordGuildsTable.id, guildId))
      .returning();
    return row ?? null;
  }
  async updateSettings(
    guildId: string,
    input: Partial<typeof discordGuildSettingsTable.$inferInsert>,
  ) {
    const [row] = await this.database
      .insert(discordGuildSettingsTable)
      .values({ ...input, guildId })
      .onConflictDoUpdate({
        target: discordGuildSettingsTable.guildId,
        set: { ...input, updatedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error('Failed to update Discord guild settings.');
    return row;
  }
  async setModule(
    guildId: string,
    moduleKey: string,
    enabled: boolean,
    configuration: Record<string, unknown> = {},
  ) {
    const now = new Date();
    const [row] = await this.database
      .insert(discordGuildModulesTable)
      .values({
        guildId,
        moduleKey,
        enabled,
        configuration,
        enabledAt: enabled ? now : null,
        disabledAt: enabled ? null : now,
      })
      .onConflictDoUpdate({
        target: [
          discordGuildModulesTable.guildId,
          discordGuildModulesTable.moduleKey,
        ],
        set: {
          enabled,
          configuration,
          enabledAt: enabled ? now : null,
          disabledAt: enabled ? null : now,
          updatedAt: now,
        },
      })
      .returning();
    if (!row) throw new Error('Failed to update Discord guild module.');
    return row;
  }
  async updateSyncState(
    guildId: string,
    resource: string,
    input: Partial<typeof discordGuildSyncStatesTable.$inferInsert>,
  ) {
    const [row] = await this.database
      .insert(discordGuildSyncStatesTable)
      .values({ ...input, guildId, resource })
      .onConflictDoUpdate({
        target: [
          discordGuildSyncStatesTable.guildId,
          discordGuildSyncStatesTable.resource,
        ],
        set: { ...input, updatedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error('Failed to update Discord sync state.');
    return row;
  }
}
