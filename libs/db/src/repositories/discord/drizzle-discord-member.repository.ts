import { and, eq } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  toDiscordGuildMemberInsert,
  type DiscordMemberTransport,
} from '../../mappers/discord';
import {
  getActiveDiscordGuildMembers,
  getDiscordGuildsForUser,
  getDiscordMember,
  getDiscordMutualGuilds,
  getDiscordRolesForMember,
} from '../../queries/discord';
import {
  discordGuildMemberEventsTable,
  discordGuildMemberRoleEventsTable,
  discordGuildMemberRolesTable,
  discordGuildMembersTable,
} from '../../schema';

export class DrizzleDiscordMemberRepository {
  constructor(private readonly database: DatabaseClient) {}
  getByGuildAndDiscordUser(discordGuildId: string, discordUserId: string) {
    return getDiscordMember(this.database, discordGuildId, discordUserId);
  }
  getGuilds(discordUserId: string, historical = true) {
    return getDiscordGuildsForUser(this.database, discordUserId, historical);
  }
  getMutualGuilds(firstUserId: string, secondUserId: string) {
    return getDiscordMutualGuilds(this.database, firstUserId, secondUserId);
  }
  getActiveMembers(guildId: string) {
    return getActiveDiscordGuildMembers(this.database, guildId);
  }
  getRoles(memberId: string, activeOnly = true) {
    return getDiscordRolesForMember(this.database, memberId, activeOnly);
  }
  async upsert(
    guildId: string,
    accountId: string,
    member: DiscordMemberTransport,
  ) {
    const values = toDiscordGuildMemberInsert(guildId, accountId, member);
    const [row] = await this.database
      .insert(discordGuildMembersTable)
      .values(values)
      .onConflictDoUpdate({
        target: [
          discordGuildMembersTable.guildId,
          discordGuildMembersTable.discordAccountId,
        ],
        set: {
          ...values,
          firstSeenAt: undefined,
          rejoinCount: undefined,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!row) throw new Error('Failed to upsert Discord guild member.');
    return row;
  }
  async updateProfile(
    memberId: string,
    input: Pick<
      Partial<typeof discordGuildMembersTable.$inferInsert>,
      | 'nickname'
      | 'guildAvatarHash'
      | 'guildProfileMetadata'
      | 'communicationDisabledUntil'
      | 'pending'
      | 'flags'
    >,
  ) {
    const [row] = await this.database
      .update(discordGuildMembersTable)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(discordGuildMembersTable.id, memberId))
      .returning();
    return row ?? null;
  }
  async synchronizeRoles(
    memberId: string,
    roleIds: readonly string[],
    source: typeof discordGuildMemberRolesTable.$inferSelect.source = 'discord',
  ) {
    return this.database.transaction(async (tx) => {
      const current = await tx
        .select()
        .from(discordGuildMemberRolesTable)
        .where(
          and(
            eq(discordGuildMemberRolesTable.memberId, memberId),
            eq(discordGuildMemberRolesTable.active, true),
          ),
        );
      const desired = new Set(roleIds),
        currentIds = new Set(current.map((row) => row.roleId)),
        now = new Date();
      for (const row of current)
        if (!desired.has(row.roleId)) {
          await tx
            .update(discordGuildMemberRolesTable)
            .set({ active: false, removedAt: now })
            .where(
              and(
                eq(discordGuildMemberRolesTable.memberId, memberId),
                eq(discordGuildMemberRolesTable.roleId, row.roleId),
              ),
            );
          await tx.insert(discordGuildMemberRoleEventsTable).values({
            memberId,
            roleId: row.roleId,
            action: 'removed',
            source,
          });
        }
      for (const roleId of desired)
        if (!currentIds.has(roleId)) {
          await tx
            .insert(discordGuildMemberRolesTable)
            .values({
              memberId,
              roleId,
              source,
              active: true,
              assignedAt: now,
              removedAt: null,
            })
            .onConflictDoUpdate({
              target: [
                discordGuildMemberRolesTable.memberId,
                discordGuildMemberRolesTable.roleId,
              ],
              set: { source, active: true, assignedAt: now, removedAt: null },
            });
          await tx
            .insert(discordGuildMemberRoleEventsTable)
            .values({ memberId, roleId, action: 'assigned', source });
        }
      return tx
        .select()
        .from(discordGuildMemberRolesTable)
        .where(eq(discordGuildMemberRolesTable.memberId, memberId));
    });
  }
  async recordLifecycle(
    memberId: string,
    guildId: string,
    status: typeof discordGuildMembersTable.$inferSelect.status,
    occurredAt = new Date(),
    reason?: string,
  ) {
    const [row] = await this.database
      .insert(discordGuildMemberEventsTable)
      .values({ memberId, guildId, status, occurredAt, reason })
      .returning();
    return row;
  }
}
