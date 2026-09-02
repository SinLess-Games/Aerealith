import { describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '../../client';
import {
  discordGuildModulesTable,
  discordGuildSettingsTable,
} from '../../schema';
import { DrizzleDiscordGuildRepository } from './drizzle-discord-guild.repository';

describe('DrizzleDiscordGuildRepository', () => {
  it('reads and upserts guild settings and module state', async () => {
    const reads = [
      [
        {
          guild: { id: 'guild-id' },
          settings: { guildId: 'guild-id', locale: 'en-US' },
        },
      ],
      [{ guildId: 'guild-id', moduleKey: 'moderation', enabled: true }],
    ];
    const writes: Array<{
      table: unknown;
      values?: Record<string, unknown>;
      conflict?: Record<string, unknown>;
    }> = [];
    let selectCall = 0;
    const database = {
      select: vi.fn(() => {
        const rows = reads[selectCall++] ?? [];
        const builder: Record<string, unknown> = {};
        builder.from = () => builder;
        builder.leftJoin = () => builder;
        builder.where = () => builder;
        builder.limit = () => Promise.resolve(rows);
        builder.then = (
          resolve: (value: unknown[]) => unknown,
          reject?: (reason: unknown) => unknown,
        ) => Promise.resolve(rows).then(resolve, reject);
        return builder;
      }),
      insert: vi.fn((table: unknown) => {
        const write: (typeof writes)[number] = { table };
        writes.push(write);
        const builder: Record<string, unknown> = {};
        builder.values = (values: Record<string, unknown>) => {
          write.values = values;
          return builder;
        };
        builder.onConflictDoUpdate = (conflict: Record<string, unknown>) => {
          write.conflict = conflict;
          return builder;
        };
        builder.returning = () =>
          Promise.resolve([
            table === discordGuildSettingsTable
              ? { guildId: 'guild-id', locale: 'en-US' }
              : {
                  guildId: 'guild-id',
                  moduleKey: 'moderation',
                  enabled: true,
                },
          ]);
        return builder;
      }),
    } as unknown as DatabaseClient;
    const repository = new DrizzleDiscordGuildRepository(database);

    await expect(
      repository.getWithSettings('200000000000000001'),
    ).resolves.toMatchObject({
      guild: { id: 'guild-id' },
      settings: { locale: 'en-US' },
    });
    await expect(repository.getModules('guild-id', true)).resolves.toEqual([
      { guildId: 'guild-id', moduleKey: 'moderation', enabled: true },
    ]);
    await expect(
      repository.updateSettings('guild-id', { locale: 'en-US' }),
    ).resolves.toMatchObject({ locale: 'en-US' });
    await expect(
      repository.setModule('guild-id', 'moderation', true),
    ).resolves.toMatchObject({ enabled: true });

    expect(writes[0]).toMatchObject({
      table: discordGuildSettingsTable,
      values: { guildId: 'guild-id', locale: 'en-US' },
    });
    expect(writes[0]?.conflict).toHaveProperty('target');
    expect(writes[1]).toMatchObject({
      table: discordGuildModulesTable,
      values: { guildId: 'guild-id', moduleKey: 'moderation', enabled: true },
    });
    expect(writes[1]?.conflict).toHaveProperty('target');
  });
});
