import { describe, expect, it } from 'vitest';
import type { DatabaseClient } from '../../client';
import {
  calculateDiscordRetention,
  deriveDiscordGuildMetrics,
  getDiscordChannelAnalytics,
  getDiscordGuildAnalytics,
} from './analytics.queries';

function rangeDatabase(rows: unknown[]): DatabaseClient {
  const builder: Record<string, unknown> = {};
  builder.from = () => builder;
  builder.where = () => builder;
  builder.orderBy = () => Promise.resolve(rows);
  return { select: () => builder } as unknown as DatabaseClient;
}

describe('Discord analytics queries', () => {
  it('derives dashboard rates from a rollup snapshot', () => {
    const metrics = deriveDiscordGuildMetrics({
      humanMembers: 100,
      activeMembers: 25,
      uniqueMessageAuthors: 20,
      uniqueVoiceUsers: 10,
      uniqueAiUsers: 5,
      uniqueMusicListeners: 8,
      membersLeft: 4,
      totalMembers: 96,
      netGrowth: 2,
      messagesSent: 200,
      voiceMinutes: 300,
      successfulCommands: 90,
      commandsExecuted: 100,
      aiFailures: 2,
      aiInteractions: 50,
      failedTracks: 1,
      songsPlayed: 20,
    } as never);
    expect(metrics.engagementRate).toBe(0.25);
    expect(metrics.commandSuccessRate).toBe(0.9);
    expect(metrics.aiFailureRate).toBe(0.04);
  });
  it('calculates retention from snapshot cohorts without raw event scans', () => {
    expect(
      calculateDiscordRetention(['a', 'b', 'd'], ['a', 'b', 'c']),
    ).toBeCloseTo(2 / 3);
    expect(calculateDiscordRetention([], [])).toBe(0);
  });
  it('reads guild and channel date ranges from snapshot tables', async () => {
    const snapshots = [
      { periodStart: new Date('2026-08-01T00:00:00Z'), messagesSent: 10 },
      { periodStart: new Date('2026-08-02T00:00:00Z'), messagesSent: 20 },
    ];
    const from = new Date('2026-08-01T00:00:00Z');
    const to = new Date('2026-08-02T23:59:59Z');

    await expect(
      getDiscordGuildAnalytics(rangeDatabase(snapshots), 'guild-id', from, to),
    ).resolves.toEqual(snapshots);
    await expect(
      getDiscordChannelAnalytics(
        rangeDatabase(snapshots),
        'channel-id',
        from,
        to,
      ),
    ).resolves.toEqual(snapshots);
  });
});
