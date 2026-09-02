import { lte } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  deriveDiscordGuildMetrics,
  getDiscordChannelAnalytics,
  getDiscordGuildAnalytics,
  getDiscordMemberAnalytics,
} from '../../queries/discord';
import {
  discordChannelAnalyticsSnapshotsTable,
  discordGuildAnalyticsSnapshotsTable,
  discordMemberAnalyticsSnapshotsTable,
  discordPresenceSnapshotsTable,
} from '../../schema';

export class DrizzleDiscordAnalyticsRepository {
  constructor(private readonly database: DatabaseClient) {}
  getGuildRange(
    guildId: string,
    from: Date,
    to: Date,
    granularity: Parameters<typeof getDiscordGuildAnalytics>[4] = 'daily',
  ) {
    return getDiscordGuildAnalytics(
      this.database,
      guildId,
      from,
      to,
      granularity,
    );
  }
  getChannelRange(
    channelId: string,
    from: Date,
    to: Date,
    granularity: Parameters<typeof getDiscordChannelAnalytics>[4] = 'daily',
  ) {
    return getDiscordChannelAnalytics(
      this.database,
      channelId,
      from,
      to,
      granularity,
    );
  }
  getMemberRange(
    memberId: string,
    from: Date,
    to: Date,
    granularity: Parameters<typeof getDiscordMemberAnalytics>[4] = 'daily',
  ) {
    return getDiscordMemberAnalytics(
      this.database,
      memberId,
      from,
      to,
      granularity,
    );
  }
  deriveGuildMetrics(
    snapshot: typeof discordGuildAnalyticsSnapshotsTable.$inferSelect,
  ) {
    return deriveDiscordGuildMetrics(snapshot);
  }
  async writeGuildSnapshot(
    input: typeof discordGuildAnalyticsSnapshotsTable.$inferInsert,
  ) {
    const [row] = await this.database
      .insert(discordGuildAnalyticsSnapshotsTable)
      .values(input)
      .onConflictDoUpdate({
        target: [
          discordGuildAnalyticsSnapshotsTable.guildId,
          discordGuildAnalyticsSnapshotsTable.granularity,
          discordGuildAnalyticsSnapshotsTable.periodStart,
        ],
        set: { ...input, calculatedAt: new Date() },
      })
      .returning();
    if (!row)
      throw new Error('Failed to write Discord guild analytics snapshot.');
    return row;
  }
  async writeChannelSnapshot(
    input: typeof discordChannelAnalyticsSnapshotsTable.$inferInsert,
  ) {
    const [row] = await this.database
      .insert(discordChannelAnalyticsSnapshotsTable)
      .values(input)
      .onConflictDoUpdate({
        target: [
          discordChannelAnalyticsSnapshotsTable.channelId,
          discordChannelAnalyticsSnapshotsTable.granularity,
          discordChannelAnalyticsSnapshotsTable.periodStart,
        ],
        set: { ...input, calculatedAt: new Date() },
      })
      .returning();
    if (!row)
      throw new Error('Failed to write Discord channel analytics snapshot.');
    return row;
  }
  async writeMemberSnapshot(
    input: typeof discordMemberAnalyticsSnapshotsTable.$inferInsert,
  ) {
    const [row] = await this.database
      .insert(discordMemberAnalyticsSnapshotsTable)
      .values(input)
      .onConflictDoUpdate({
        target: [
          discordMemberAnalyticsSnapshotsTable.memberId,
          discordMemberAnalyticsSnapshotsTable.granularity,
          discordMemberAnalyticsSnapshotsTable.periodStart,
        ],
        set: { ...input, calculatedAt: new Date() },
      })
      .returning();
    if (!row)
      throw new Error('Failed to write Discord member analytics snapshot.');
    return row;
  }
  async writePresenceSnapshot(
    input: typeof discordPresenceSnapshotsTable.$inferInsert,
  ) {
    const [row] = await this.database
      .insert(discordPresenceSnapshotsTable)
      .values(input)
      .onConflictDoUpdate({
        target: [
          discordPresenceSnapshotsTable.guildId,
          discordPresenceSnapshotsTable.capturedAt,
        ],
        set: input,
      })
      .returning();
    if (!row) throw new Error('Failed to write Discord presence snapshot.');
    return row;
  }
  async removeExpiredMemberSnapshots(now = new Date()) {
    return this.database
      .delete(discordMemberAnalyticsSnapshotsTable)
      .where(lte(discordMemberAnalyticsSnapshotsTable.expiresAt, now))
      .returning({ id: discordMemberAnalyticsSnapshotsTable.id });
  }
}
