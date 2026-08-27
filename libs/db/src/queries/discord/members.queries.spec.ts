import { describe, expect, it } from 'vitest';

import type { DatabaseClient } from '../../client';
import {
  getDiscordGuildsForUser,
  getDiscordMutualGuilds,
  getDiscordRolesForMember,
} from './members.queries';

function sequenceDatabase(resultSets: unknown[][]): DatabaseClient {
  let selectCall = 0;
  return {
    select: () => {
      const rows = resultSets[selectCall++] ?? [];
      const builder: Record<string, unknown> = {};
      builder.from = () => builder;
      builder.innerJoin = () => builder;
      builder.where = () => Promise.resolve(rows);
      return builder;
    },
  } as unknown as DatabaseClient;
}

describe('Discord membership queries', () => {
  const active = {
    guild: { id: 'guild-one' },
    membership: { status: 'active' },
  };
  const departed = {
    guild: { id: 'guild-two' },
    membership: { status: 'left' },
  };

  it('returns multi-guild history while the current path returns active memberships', async () => {
    const historical = await getDiscordGuildsForUser(
      sequenceDatabase([[active, departed]]),
      '100000000000000001',
      true,
    );
    const current = await getDiscordGuildsForUser(
      sequenceDatabase([[active]]),
      '100000000000000001',
      false,
    );

    expect(historical).toEqual([active, departed]);
    expect(current).toEqual([active]);
  });

  it('intersects only current guilds for mutual-guild resolution', async () => {
    const shared = { guild: { id: 'shared-guild' }, membership: {} };
    const result = await getDiscordMutualGuilds(
      sequenceDatabase([
        [shared, { guild: { id: 'first-only' }, membership: {} }],
        [shared, { guild: { id: 'second-only' }, membership: {} }],
      ]),
      '100000000000000001',
      '100000000000000002',
    );

    expect(result).toEqual([shared]);
  });

  it('returns the active role relationships selected for a member', async () => {
    const roles = [
      { role: { id: 'role-one' }, assignment: { active: true } },
      { role: { id: 'role-two' }, assignment: { active: true } },
    ];

    await expect(
      getDiscordRolesForMember(sequenceDatabase([roles]), 'member-id', true),
    ).resolves.toEqual(roles);
  });
});
