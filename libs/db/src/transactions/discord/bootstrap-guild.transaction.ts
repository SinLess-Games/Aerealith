import type { DatabaseClient } from '../../client';
import {
  toDiscordGuildInsert,
  type DiscordGuildTransport,
} from '../../mappers/discord';
import {
  discordGuildModulesTable,
  discordGuildSettingsTable,
  discordGuildSyncStatesTable,
  discordGuildsTable,
} from '../../schema';
import { withTransaction } from '../with-transaction';

const DEFAULT_SYNC_RESOURCES = [
  'guild',
  'members',
  'roles',
  'channels',
  'emojis',
  'stickers',
  'scheduled_events',
  'audit_log',
] as const;
export async function bootstrapDiscordGuildTransaction(
  database: DatabaseClient,
  input: {
    guild: DiscordGuildTransport;
    settings?: Partial<typeof discordGuildSettingsTable.$inferInsert>;
    modules?: Array<{
      moduleKey: string;
      enabled: boolean;
      configuration?: Record<string, unknown>;
    }>;
  },
) {
  return withTransaction(database, async (tx) => {
    const values = toDiscordGuildInsert(input.guild);
    const [guild] = await tx
      .insert(discordGuildsTable)
      .values(values)
      .onConflictDoUpdate({
        target: discordGuildsTable.discordGuildId,
        set: {
          ...values,
          firstSeenAt: undefined,
          isBotInstalled: true,
          botLeftAt: null,
          deletedAt: null,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!guild) throw new Error('Failed to bootstrap Discord guild.');
    const [settings] = await tx
      .insert(discordGuildSettingsTable)
      .values({ ...input.settings, guildId: guild.id })
      .onConflictDoNothing({ target: discordGuildSettingsTable.guildId })
      .returning();
    for (const module of input.modules ?? [])
      await tx
        .insert(discordGuildModulesTable)
        .values({
          guildId: guild.id,
          moduleKey: module.moduleKey,
          enabled: module.enabled,
          configuration: module.configuration ?? {},
          enabledAt: module.enabled ? new Date() : null,
        })
        .onConflictDoUpdate({
          target: [
            discordGuildModulesTable.guildId,
            discordGuildModulesTable.moduleKey,
          ],
          set: {
            enabled: module.enabled,
            configuration: module.configuration ?? {},
            updatedAt: new Date(),
          },
        });
    for (const resource of DEFAULT_SYNC_RESOURCES)
      await tx
        .insert(discordGuildSyncStatesTable)
        .values({ guildId: guild.id, resource, status: 'pending' })
        .onConflictDoNothing({
          target: [
            discordGuildSyncStatesTable.guildId,
            discordGuildSyncStatesTable.resource,
          ],
        });
    return { guild, settings: settings ?? null };
  });
}
