import type { DatabaseClient } from '../../client';
import {
  discordChannelAnalyticsSnapshotsTable,
  discordGuildAnalyticsSnapshotsTable,
  discordMemberAnalyticsSnapshotsTable,
} from '../../schema';
import { withTransaction } from '../with-transaction';

export async function writeDiscordAnalyticsRollupTransaction(
  database: DatabaseClient,
  input: {
    guild: typeof discordGuildAnalyticsSnapshotsTable.$inferInsert;
    channels?: Array<typeof discordChannelAnalyticsSnapshotsTable.$inferInsert>;
    members?: Array<typeof discordMemberAnalyticsSnapshotsTable.$inferInsert>;
  },
) {
  return withTransaction(database, async (tx) => {
    const [guild] = await tx
      .insert(discordGuildAnalyticsSnapshotsTable)
      .values(input.guild)
      .onConflictDoUpdate({
        target: [
          discordGuildAnalyticsSnapshotsTable.guildId,
          discordGuildAnalyticsSnapshotsTable.granularity,
          discordGuildAnalyticsSnapshotsTable.periodStart,
        ],
        set: { ...input.guild, calculatedAt: new Date() },
      })
      .returning();
    if (!guild) throw new Error('Failed to write Discord analytics rollup.');
    const channels = [];
    for (const item of input.channels ?? []) {
      const [row] = await tx
        .insert(discordChannelAnalyticsSnapshotsTable)
        .values(item)
        .onConflictDoUpdate({
          target: [
            discordChannelAnalyticsSnapshotsTable.channelId,
            discordChannelAnalyticsSnapshotsTable.granularity,
            discordChannelAnalyticsSnapshotsTable.periodStart,
          ],
          set: { ...item, calculatedAt: new Date() },
        })
        .returning();
      if (row) channels.push(row);
    }
    const members = [];
    for (const item of input.members ?? []) {
      const [row] = await tx
        .insert(discordMemberAnalyticsSnapshotsTable)
        .values(item)
        .onConflictDoUpdate({
          target: [
            discordMemberAnalyticsSnapshotsTable.memberId,
            discordMemberAnalyticsSnapshotsTable.granularity,
            discordMemberAnalyticsSnapshotsTable.periodStart,
          ],
          set: { ...item, calculatedAt: new Date() },
        })
        .returning();
      if (row) members.push(row);
    }
    return { guild, channels, members };
  });
}
