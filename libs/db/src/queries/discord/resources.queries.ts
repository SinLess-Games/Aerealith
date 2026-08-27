import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  discordChannelPermissionOverwritesTable,
  discordChannelsTable,
  discordForumPostStateTable,
  discordForumTagsTable,
  discordGuildMemberRolesTable,
  discordRolesTable,
  discordThreadsTable,
} from '../../schema';

export async function getDiscordChannelsByGuild(
  database: DatabaseClient,
  guildId: string,
  channelType?: number,
) {
  return database
    .select()
    .from(discordChannelsTable)
    .where(
      and(
        eq(discordChannelsTable.guildId, guildId),
        isNull(discordChannelsTable.deletedAt),
        channelType === undefined
          ? undefined
          : eq(discordChannelsTable.channelType, channelType),
      ),
    )
    .orderBy(asc(discordChannelsTable.position));
}
export async function getActiveDiscordThreads(
  database: DatabaseClient,
  guildId: string,
) {
  return database
    .select({ channel: discordChannelsTable, thread: discordThreadsTable })
    .from(discordThreadsTable)
    .innerJoin(
      discordChannelsTable,
      eq(discordThreadsTable.channelId, discordChannelsTable.id),
    )
    .where(
      and(
        eq(discordChannelsTable.guildId, guildId),
        eq(discordThreadsTable.archived, false),
        isNull(discordChannelsTable.deletedAt),
      ),
    )
    .orderBy(desc(discordThreadsTable.lastActivityAt));
}
export async function getDiscordForumChannels(
  database: DatabaseClient,
  guildId: string,
) {
  return getDiscordChannelsByGuild(database, guildId, 15);
}
export async function getDiscordForumActivity(
  database: DatabaseClient,
  forumChannelId: string,
) {
  return database
    .select()
    .from(discordForumPostStateTable)
    .where(eq(discordForumPostStateTable.forumChannelId, forumChannelId))
    .orderBy(desc(discordForumPostStateTable.lastActivityAt));
}
export async function getDiscordChannelPermissionOverwrites(
  database: DatabaseClient,
  channelId: string,
) {
  return database
    .select()
    .from(discordChannelPermissionOverwritesTable)
    .where(eq(discordChannelPermissionOverwritesTable.channelId, channelId));
}
export async function getDiscordForumTags(
  database: DatabaseClient,
  forumChannelId: string,
) {
  return database
    .select()
    .from(discordForumTagsTable)
    .where(
      and(
        eq(discordForumTagsTable.forumChannelId, forumChannelId),
        isNull(discordForumTagsTable.deletedAt),
      ),
    );
}
export async function getDiscordRolesByGuild(
  database: DatabaseClient,
  guildId: string,
) {
  return database
    .select()
    .from(discordRolesTable)
    .where(
      and(
        eq(discordRolesTable.guildId, guildId),
        isNull(discordRolesTable.deletedAt),
      ),
    )
    .orderBy(desc(discordRolesTable.position));
}
export async function getDiscordMemberRoleAssignments(
  database: DatabaseClient,
  memberId: string,
  source?: typeof discordGuildMemberRolesTable.$inferSelect.source,
) {
  return database
    .select({
      assignment: discordGuildMemberRolesTable,
      role: discordRolesTable,
    })
    .from(discordGuildMemberRolesTable)
    .innerJoin(
      discordRolesTable,
      eq(discordGuildMemberRolesTable.roleId, discordRolesTable.id),
    )
    .where(
      and(
        eq(discordGuildMemberRolesTable.memberId, memberId),
        source ? eq(discordGuildMemberRolesTable.source, source) : undefined,
      ),
    );
}
