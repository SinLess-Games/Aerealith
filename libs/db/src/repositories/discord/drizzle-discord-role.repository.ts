import { and, eq, isNull, notInArray } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  toDiscordRoleInsert,
  type DiscordRoleTransport,
} from '../../mappers/discord';
import {
  getDiscordMemberRoleAssignments,
  getDiscordRolesByGuild,
} from '../../queries/discord';
import { discordRolesTable } from '../../schema';

export class DrizzleDiscordRoleRepository {
  constructor(private readonly database: DatabaseClient) {}
  getByGuild(guildId: string) {
    return getDiscordRolesByGuild(this.database, guildId);
  }
  getMemberAssignments(
    memberId: string,
    source?: Parameters<typeof getDiscordMemberRoleAssignments>[2],
  ) {
    return getDiscordMemberRoleAssignments(this.database, memberId, source);
  }
  async synchronize(
    guildId: string,
    roles: readonly DiscordRoleTransport[],
    synchronizedAt = new Date(),
  ) {
    return this.database.transaction(async (tx) => {
      const rows = [];
      for (const role of roles) {
        const values = toDiscordRoleInsert(guildId, role, synchronizedAt);
        const [row] = await tx
          .insert(discordRolesTable)
          .values(values)
          .onConflictDoUpdate({
            target: discordRolesTable.discordRoleId,
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
      const ids = roles.map((role) => role.id);
      const missing = ids.length
        ? and(
            eq(discordRolesTable.guildId, guildId),
            isNull(discordRolesTable.deletedAt),
            notInArray(discordRolesTable.discordRoleId, ids),
          )
        : and(
            eq(discordRolesTable.guildId, guildId),
            isNull(discordRolesTable.deletedAt),
          );
      await tx
        .update(discordRolesTable)
        .set({ deletedAt: synchronizedAt, updatedAt: synchronizedAt })
        .where(missing);
      return rows;
    });
  }
}
