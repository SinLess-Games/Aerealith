import { and, eq } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  toDiscordGuildMemberInsert,
  type DiscordMemberTransport,
} from '../../mappers/discord';
import {
  discordGuildMemberEventsTable,
  discordGuildMemberRoleEventsTable,
  discordGuildMemberRolesTable,
  discordGuildMembersTable,
} from '../../schema';
import { withTransaction } from '../with-transaction';

export async function synchronizeDiscordGuildMemberTransaction(
  database: DatabaseClient,
  input: {
    guildId: string;
    accountId: string;
    member: DiscordMemberTransport;
    roleIds: readonly string[];
    roleSource?: typeof discordGuildMemberRolesTable.$inferSelect.source;
  },
) {
  return withTransaction(database, async (tx) => {
    const existing = await tx
      .select()
      .from(discordGuildMembersTable)
      .where(
        and(
          eq(discordGuildMembersTable.guildId, input.guildId),
          eq(discordGuildMembersTable.discordAccountId, input.accountId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);
    const values = toDiscordGuildMemberInsert(
      input.guildId,
      input.accountId,
      input.member,
    );
    const rejoining = existing !== undefined && existing.status !== 'active';
    const [member] = await tx
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
          rejoinCount: rejoining
            ? existing.rejoinCount + 1
            : existing?.rejoinCount,
          leftAt: null,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!member) throw new Error('Failed to synchronize Discord guild member.');
    if (!existing || rejoining)
      await tx.insert(discordGuildMemberEventsTable).values({
        memberId: member.id,
        guildId: member.guildId,
        status: 'active',
        occurredAt: new Date(),
        metadata: { lifecycle: rejoining ? 'rejoined' : 'joined' },
      });
    const source = input.roleSource ?? 'discord';
    const current = await tx
      .select()
      .from(discordGuildMemberRolesTable)
      .where(
        and(
          eq(discordGuildMemberRolesTable.memberId, member.id),
          eq(discordGuildMemberRolesTable.active, true),
        ),
      );
    const desired = new Set(input.roleIds);
    const currentIds = new Set(current.map((row) => row.roleId));
    const now = new Date();
    for (const row of current)
      if (!desired.has(row.roleId)) {
        await tx
          .update(discordGuildMemberRolesTable)
          .set({ active: false, removedAt: now })
          .where(
            and(
              eq(discordGuildMemberRolesTable.memberId, member.id),
              eq(discordGuildMemberRolesTable.roleId, row.roleId),
            ),
          );
        await tx.insert(discordGuildMemberRoleEventsTable).values({
          memberId: member.id,
          roleId: row.roleId,
          action: 'removed',
          source,
          occurredAt: now,
        });
      }
    for (const roleId of desired)
      if (!currentIds.has(roleId)) {
        await tx
          .insert(discordGuildMemberRolesTable)
          .values({
            memberId: member.id,
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
        await tx.insert(discordGuildMemberRoleEventsTable).values({
          memberId: member.id,
          roleId,
          action: 'assigned',
          source,
          occurredAt: now,
        });
      }
    return member;
  });
}

export async function leaveDiscordGuildMemberTransaction(
  database: DatabaseClient,
  input: {
    memberId: string;
    status?: 'left' | 'kicked' | 'banned';
    actorAccountId?: string;
    reason?: string;
    occurredAt?: Date;
  },
) {
  return withTransaction(database, async (tx) => {
    const occurredAt = input.occurredAt ?? new Date();
    const status = input.status ?? 'left';
    const [member] = await tx
      .update(discordGuildMembersTable)
      .set({
        status,
        isPresent: false,
        leftAt: occurredAt,
        updatedAt: occurredAt,
      })
      .where(eq(discordGuildMembersTable.id, input.memberId))
      .returning();
    if (!member) return null;
    await tx
      .update(discordGuildMemberRolesTable)
      .set({ active: false, removedAt: occurredAt })
      .where(
        and(
          eq(discordGuildMemberRolesTable.memberId, input.memberId),
          eq(discordGuildMemberRolesTable.active, true),
        ),
      );
    await tx.insert(discordGuildMemberEventsTable).values({
      memberId: member.id,
      guildId: member.guildId,
      status,
      actorAccountId: input.actorAccountId,
      reason: input.reason,
      occurredAt,
    });
    return member;
  });
}

export async function rejoinDiscordGuildMemberTransaction(
  database: DatabaseClient,
  input: Parameters<typeof synchronizeDiscordGuildMemberTransaction>[1],
) {
  return synchronizeDiscordGuildMemberTransaction(database, input);
}
