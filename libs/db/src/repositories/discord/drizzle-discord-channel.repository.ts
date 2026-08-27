import { and, eq, isNull, notInArray } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  toDiscordChannelInsert,
  type DiscordChannelTransport,
} from '../../mappers/discord';
import {
  getActiveDiscordThreads,
  getDiscordChannelPermissionOverwrites,
  getDiscordChannelsByGuild,
  getDiscordForumActivity,
  getDiscordForumChannels,
} from '../../queries/discord';
import { discordChannelsTable } from '../../schema';

export class DrizzleDiscordChannelRepository {
  constructor(private readonly database: DatabaseClient) {}
  getByGuild(guildId: string, channelType?: number) {
    return getDiscordChannelsByGuild(this.database, guildId, channelType);
  }
  getActiveThreads(guildId: string) {
    return getActiveDiscordThreads(this.database, guildId);
  }
  getForumChannels(guildId: string) {
    return getDiscordForumChannels(this.database, guildId);
  }
  getForumActivity(channelId: string) {
    return getDiscordForumActivity(this.database, channelId);
  }
  getPermissionOverwrites(channelId: string) {
    return getDiscordChannelPermissionOverwrites(this.database, channelId);
  }
  async synchronize(
    guildId: string,
    channels: readonly DiscordChannelTransport[],
    synchronizedAt = new Date(),
  ) {
    return this.database.transaction(async (tx) => {
      const rows = [];
      for (const channel of channels) {
        const values = toDiscordChannelInsert(guildId, channel, synchronizedAt);
        const [row] = await tx
          .insert(discordChannelsTable)
          .values(values)
          .onConflictDoUpdate({
            target: discordChannelsTable.discordChannelId,
            set: {
              ...values,
              firstSeenAt: undefined,
              deletedAt: null,
              updatedAt: synchronizedAt,
            },
          })
          .returning();
        if (row) rows.push(row);
      }
      const ids = channels.map((channel) => channel.id);
      const missing = ids.length
        ? and(
            eq(discordChannelsTable.guildId, guildId),
            isNull(discordChannelsTable.deletedAt),
            notInArray(discordChannelsTable.discordChannelId, ids),
          )
        : and(
            eq(discordChannelsTable.guildId, guildId),
            isNull(discordChannelsTable.deletedAt),
          );
      await tx
        .update(discordChannelsTable)
        .set({ deletedAt: synchronizedAt, updatedAt: synchronizedAt })
        .where(missing);
      return rows;
    });
  }
}
