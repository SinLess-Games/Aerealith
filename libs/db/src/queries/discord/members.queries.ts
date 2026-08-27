import { and, desc, eq, gte, inArray } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  discordAccountsTable,
  discordGuildMemberRolesTable,
  discordGuildMembersTable,
  discordGuildsTable,
  discordRolesTable,
} from '../../schema';
import { toDiscordSnowflake } from '../../utils/discord';

export function discordGuildMemberByGuildAndAccount(
  guildId: string,
  accountId: string,
) {
  return and(
    eq(discordGuildMembersTable.guildId, guildId),
    eq(discordGuildMembersTable.discordAccountId, accountId),
  );
}
export async function getDiscordMember(
  database: DatabaseClient,
  discordGuildId: string,
  discordUserId: string,
) {
  const [result] = await database
    .select({ member: discordGuildMembersTable, account: discordAccountsTable })
    .from(discordGuildMembersTable)
    .innerJoin(
      discordGuildsTable,
      eq(discordGuildMembersTable.guildId, discordGuildsTable.id),
    )
    .innerJoin(
      discordAccountsTable,
      eq(discordGuildMembersTable.discordAccountId, discordAccountsTable.id),
    )
    .where(
      and(
        eq(
          discordGuildsTable.discordGuildId,
          toDiscordSnowflake(discordGuildId),
        ),
        eq(
          discordAccountsTable.discordUserId,
          toDiscordSnowflake(discordUserId),
        ),
      ),
    )
    .limit(1);
  return result ?? null;
}
export async function getDiscordGuildsForUser(
  database: DatabaseClient,
  discordUserId: string,
  includeHistorical = true,
) {
  return database
    .select({ guild: discordGuildsTable, membership: discordGuildMembersTable })
    .from(discordGuildMembersTable)
    .innerJoin(
      discordAccountsTable,
      eq(discordGuildMembersTable.discordAccountId, discordAccountsTable.id),
    )
    .innerJoin(
      discordGuildsTable,
      eq(discordGuildMembersTable.guildId, discordGuildsTable.id),
    )
    .where(
      and(
        eq(
          discordAccountsTable.discordUserId,
          toDiscordSnowflake(discordUserId),
        ),
        includeHistorical
          ? undefined
          : eq(discordGuildMembersTable.status, 'active'),
      ),
    );
}
export async function getDiscordMutualGuilds(
  database: DatabaseClient,
  firstUserId: string,
  secondUserId: string,
) {
  const [first, second] = await Promise.all([
    getDiscordGuildsForUser(database, firstUserId, false),
    getDiscordGuildsForUser(database, secondUserId, false),
  ]);
  const secondGuildIds = new Set(second.map((row) => row.guild.id));
  return first.filter((row) => secondGuildIds.has(row.guild.id));
}
export async function getDiscordRolesForMember(
  database: DatabaseClient,
  memberId: string,
  activeOnly = true,
) {
  return database
    .select({
      role: discordRolesTable,
      assignment: discordGuildMemberRolesTable,
    })
    .from(discordGuildMemberRolesTable)
    .innerJoin(
      discordRolesTable,
      eq(discordGuildMemberRolesTable.roleId, discordRolesTable.id),
    )
    .where(
      and(
        eq(discordGuildMemberRolesTable.memberId, memberId),
        activeOnly ? eq(discordGuildMemberRolesTable.active, true) : undefined,
      ),
    );
}
export async function getActiveDiscordGuildMembers(
  database: DatabaseClient,
  guildId: string,
) {
  return database
    .select()
    .from(discordGuildMembersTable)
    .where(
      and(
        eq(discordGuildMembersTable.guildId, guildId),
        eq(discordGuildMembersTable.status, 'active'),
      ),
    )
    .orderBy(desc(discordGuildMembersTable.joinedAt));
}
export async function getRecentlyJoinedDiscordMembers(
  database: DatabaseClient,
  guildId: string,
  since: Date,
) {
  return database
    .select()
    .from(discordGuildMembersTable)
    .where(
      and(
        eq(discordGuildMembersTable.guildId, guildId),
        eq(discordGuildMembersTable.status, 'active'),
        gte(discordGuildMembersTable.joinedAt, since),
      ),
    )
    .orderBy(desc(discordGuildMembersTable.joinedAt));
}
export async function getRecentlyDepartedDiscordMembers(
  database: DatabaseClient,
  guildId: string,
  since: Date,
) {
  return database
    .select()
    .from(discordGuildMembersTable)
    .where(
      and(
        eq(discordGuildMembersTable.guildId, guildId),
        inArray(discordGuildMembersTable.status, ['left', 'kicked', 'banned']),
        gte(discordGuildMembersTable.leftAt, since),
      ),
    )
    .orderBy(desc(discordGuildMembersTable.leftAt));
}
export async function getDiscordMembershipStatus(
  database: DatabaseClient,
  guildId: string,
  accountId: string,
) {
  const [record] = await database
    .select({
      status: discordGuildMembersTable.status,
      isPresent: discordGuildMembersTable.isPresent,
      joinedAt: discordGuildMembersTable.joinedAt,
      leftAt: discordGuildMembersTable.leftAt,
    })
    .from(discordGuildMembersTable)
    .where(discordGuildMemberByGuildAndAccount(guildId, accountId))
    .limit(1);
  return record ?? null;
}
