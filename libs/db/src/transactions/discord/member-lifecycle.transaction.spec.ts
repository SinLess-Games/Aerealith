import { describe, expect, it, vi } from 'vitest';
import type { DatabaseClient } from '../../client';
import {
  discordGuildMemberEventsTable,
  discordGuildMemberRoleEventsTable,
  discordGuildMemberRolesTable,
  discordGuildMembersTable,
} from '../../schema';
import {
  leaveDiscordGuildMemberTransaction,
  synchronizeDiscordGuildMemberTransaction,
} from './member-lifecycle.transaction';

describe('Discord member lifecycle transaction', () => {
  it('marks roles inactive and records history instead of deleting membership', async () => {
    const updates: Array<Record<string, unknown>> = [];
    const insertedEvents: Array<Record<string, unknown>> = [];
    let updateCall = 0;
    const tx = {
      update: vi.fn(() => ({
        set: (values: Record<string, unknown>) => {
          updates.push(values);
          updateCall += 1;
          return {
            where: () =>
              updateCall === 1
                ? {
                    returning: async () => [
                      { id: 'member-id', guildId: 'guild-id' },
                    ],
                  }
                : Promise.resolve([]),
          };
        },
      })),
      insert: vi.fn(() => ({
        values: (value: Record<string, unknown>) => {
          insertedEvents.push(value);
          return Promise.resolve([]);
        },
      })),
    };
    const database = {
      transaction: (callback: (value: typeof tx) => unknown) => callback(tx),
    } as unknown as DatabaseClient;
    const result = await leaveDiscordGuildMemberTransaction(database, {
      memberId: 'member-id',
      status: 'left',
      reason: 'departed',
    });
    expect(result?.id).toBe('member-id');
    expect(updates[0]).toMatchObject({ status: 'left', isPresent: false });
    expect(updates[1]).toMatchObject({ active: false });
    expect(insertedEvents[0]).toMatchObject({
      memberId: 'member-id',
      guildId: 'guild-id',
      status: 'left',
      reason: 'departed',
    });
  });

  it('rejoins a retained member and synchronizes assigned and removed roles', async () => {
    const existing = {
      id: 'member-id',
      guildId: 'guild-id',
      status: 'left',
      rejoinCount: 1,
    };
    const synchronized = {
      ...existing,
      status: 'active',
      rejoinCount: 2,
      leftAt: null,
    };
    const inserts: Array<{
      table: unknown;
      values?: unknown;
      conflict?: Record<string, unknown>;
    }> = [];
    const updates: Array<{
      table: unknown;
      values?: Record<string, unknown>;
    }> = [];
    let selectCall = 0;
    const tx = {
      select: vi.fn(() => {
        const rows =
          selectCall++ === 0
            ? [existing]
            : [
                { memberId: 'member-id', roleId: 'role-remove', active: true },
                { memberId: 'member-id', roleId: 'role-keep', active: true },
              ];
        const builder: Record<string, unknown> = {};
        builder.from = () => builder;
        builder.where = () => builder;
        builder.limit = () => Promise.resolve(rows);
        builder.then = (
          resolve: (value: unknown[]) => unknown,
          reject?: (reason: unknown) => unknown,
        ) => Promise.resolve(rows).then(resolve, reject);
        return builder;
      }),
      insert: vi.fn((table: unknown) => {
        const write: (typeof inserts)[number] = { table };
        inserts.push(write);
        const rows = table === discordGuildMembersTable ? [synchronized] : [];
        const builder: Record<string, unknown> = {};
        builder.values = (values: unknown) => {
          write.values = values;
          return builder;
        };
        builder.onConflictDoUpdate = (conflict: Record<string, unknown>) => {
          write.conflict = conflict;
          return builder;
        };
        builder.returning = () => Promise.resolve(rows);
        builder.then = (
          resolve: (value: unknown[]) => unknown,
          reject?: (reason: unknown) => unknown,
        ) => Promise.resolve(rows).then(resolve, reject);
        return builder;
      }),
      update: vi.fn((table: unknown) => {
        const write: (typeof updates)[number] = { table };
        updates.push(write);
        const builder: Record<string, unknown> = {};
        builder.set = (values: Record<string, unknown>) => {
          write.values = values;
          return builder;
        };
        builder.where = () => builder;
        builder.then = (
          resolve: (value: unknown[]) => unknown,
          reject?: (reason: unknown) => unknown,
        ) => Promise.resolve([]).then(resolve, reject);
        return builder;
      }),
    };
    const database = {
      transaction: (callback: (value: typeof tx) => unknown) => callback(tx),
    } as unknown as DatabaseClient;

    const result = await synchronizeDiscordGuildMemberTransaction(database, {
      guildId: 'guild-id',
      accountId: 'account-id',
      member: {
        user: { id: '100000000000000001' },
        joinedAt: new Date('2026-08-01T00:00:00Z'),
      },
      roleIds: ['role-keep', 'role-add'],
    });

    expect(result).toEqual(synchronized);
    const memberWrite = inserts.find(
      (write) => write.table === discordGuildMembersTable,
    );
    expect(memberWrite?.conflict?.set).toMatchObject({
      rejoinCount: 2,
      leftAt: null,
    });
    expect(
      inserts.find((write) => write.table === discordGuildMemberEventsTable)
        ?.values,
    ).toMatchObject({ metadata: { lifecycle: 'rejoined' } });
    expect(updates).toContainEqual({
      table: discordGuildMemberRolesTable,
      values: expect.objectContaining({ active: false }),
    });
    expect(
      inserts
        .filter((write) => write.table === discordGuildMemberRoleEventsTable)
        .map((write) => write.values),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ roleId: 'role-remove', action: 'removed' }),
        expect.objectContaining({ roleId: 'role-add', action: 'assigned' }),
      ]),
    );
  });
});
