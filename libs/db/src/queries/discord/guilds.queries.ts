import { and, count, desc, eq, isNull } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  discordChannelsTable,
  discordEmojisTable,
  discordGuildAnalyticsSnapshotsTable,
  discordGuildMembersTable,
  discordGuildModulesTable,
  discordGuildSettingsTable,
  discordGuildSyncStatesTable,
  discordGuildsTable,
  discordRolesTable,
  discordSoundboardSoundsTable,
  discordStickersTable,
} from '../../schema';
import { toDiscordSnowflake } from '../../utils/discord';

export function discordGuildByDiscordId(discordGuildId: string) {
  return eq(
    discordGuildsTable.discordGuildId,
    toDiscordSnowflake(discordGuildId),
  );
}
export function existingDiscordGuildByDiscordId(discordGuildId: string) {
  return and(
    discordGuildByDiscordId(discordGuildId),
    isNull(discordGuildsTable.deletedAt),
  );
}
export function discordGuildById(id: string) {
  return eq(discordGuildsTable.id, id);
}
export function installedDiscordGuilds() {
  return and(
    eq(discordGuildsTable.isBotInstalled, true),
    isNull(discordGuildsTable.deletedAt),
  );
}
export function installedDiscordGuildsByShard(shardId: number) {
  return and(installedDiscordGuilds(), eq(discordGuildsTable.shardId, shardId));
}
export async function getDiscordGuildWithSettings(
  database: DatabaseClient,
  discordGuildId: string,
) {
  const [result] = await database
    .select({ guild: discordGuildsTable, settings: discordGuildSettingsTable })
    .from(discordGuildsTable)
    .leftJoin(
      discordGuildSettingsTable,
      eq(discordGuildsTable.id, discordGuildSettingsTable.guildId),
    )
    .where(existingDiscordGuildByDiscordId(discordGuildId))
    .limit(1);
  return result ?? null;
}
export async function getDiscordGuildModules(
  database: DatabaseClient,
  guildId: string,
  enabledOnly = false,
) {
  return database
    .select()
    .from(discordGuildModulesTable)
    .where(
      enabledOnly
        ? and(
            eq(discordGuildModulesTable.guildId, guildId),
            eq(discordGuildModulesTable.enabled, true),
          )
        : eq(discordGuildModulesTable.guildId, guildId),
    );
}
export async function getDiscordGuildSyncState(
  database: DatabaseClient,
  guildId: string,
) {
  return database
    .select()
    .from(discordGuildSyncStatesTable)
    .where(eq(discordGuildSyncStatesTable.guildId, guildId));
}
export async function getInstalledDiscordGuilds(
  database: DatabaseClient,
  shardId?: number,
) {
  return database
    .select()
    .from(discordGuildsTable)
    .where(
      shardId === undefined
        ? installedDiscordGuilds()
        : installedDiscordGuildsByShard(shardId),
    );
}
export async function getDiscordGuildResourceCounts(
  database: DatabaseClient,
  guildId: string,
) {
  const [members, channels, roles, emojis, stickers, sounds] =
    await Promise.all([
      database
        .select({ count: count() })
        .from(discordGuildMembersTable)
        .where(
          and(
            eq(discordGuildMembersTable.guildId, guildId),
            eq(discordGuildMembersTable.status, 'active'),
          ),
        ),
      database
        .select({ count: count() })
        .from(discordChannelsTable)
        .where(
          and(
            eq(discordChannelsTable.guildId, guildId),
            isNull(discordChannelsTable.deletedAt),
          ),
        ),
      database
        .select({ count: count() })
        .from(discordRolesTable)
        .where(
          and(
            eq(discordRolesTable.guildId, guildId),
            isNull(discordRolesTable.deletedAt),
          ),
        ),
      database
        .select({ count: count() })
        .from(discordEmojisTable)
        .where(
          and(
            eq(discordEmojisTable.guildId, guildId),
            isNull(discordEmojisTable.deletedAt),
          ),
        ),
      database
        .select({ count: count() })
        .from(discordStickersTable)
        .where(
          and(
            eq(discordStickersTable.guildId, guildId),
            isNull(discordStickersTable.deletedAt),
          ),
        ),
      database
        .select({ count: count() })
        .from(discordSoundboardSoundsTable)
        .where(
          and(
            eq(discordSoundboardSoundsTable.guildId, guildId),
            isNull(discordSoundboardSoundsTable.deletedAt),
          ),
        ),
    ]);
  return {
    members: members[0]?.count ?? 0,
    channels: channels[0]?.count ?? 0,
    roles: roles[0]?.count ?? 0,
    emojis: emojis[0]?.count ?? 0,
    stickers: stickers[0]?.count ?? 0,
    soundboardSounds: sounds[0]?.count ?? 0,
  };
}
export async function getDiscordGuildDashboardSummary(
  database: DatabaseClient,
  discordGuildId: string,
) {
  const aggregate = await getDiscordGuildWithSettings(database, discordGuildId);
  if (!aggregate) return null;
  const [snapshot] = await database
    .select()
    .from(discordGuildAnalyticsSnapshotsTable)
    .where(
      and(
        eq(discordGuildAnalyticsSnapshotsTable.guildId, aggregate.guild.id),
        eq(discordGuildAnalyticsSnapshotsTable.granularity, 'daily'),
      ),
    )
    .orderBy(desc(discordGuildAnalyticsSnapshotsTable.periodStart))
    .limit(1);
  return { ...aggregate, latestDailySnapshot: snapshot ?? null };
}
