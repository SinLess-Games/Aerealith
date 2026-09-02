import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import type { DiscordAnalyticsGranularity } from '../../enums/discord';
import {
  discordChannelAnalyticsSnapshotsTable,
  discordGuildAnalyticsSnapshotsTable,
  discordMemberAnalyticsSnapshotsTable,
} from '../../schema';

export async function getDiscordGuildAnalytics(
  database: DatabaseClient,
  guildId: string,
  from: Date,
  to: Date,
  granularity: DiscordAnalyticsGranularity = 'daily',
) {
  return database
    .select()
    .from(discordGuildAnalyticsSnapshotsTable)
    .where(
      and(
        eq(discordGuildAnalyticsSnapshotsTable.guildId, guildId),
        eq(discordGuildAnalyticsSnapshotsTable.granularity, granularity),
        gte(discordGuildAnalyticsSnapshotsTable.periodStart, from),
        lte(discordGuildAnalyticsSnapshotsTable.periodStart, to),
      ),
    )
    .orderBy(asc(discordGuildAnalyticsSnapshotsTable.periodStart));
}
export async function getDiscordChannelAnalytics(
  database: DatabaseClient,
  channelId: string,
  from: Date,
  to: Date,
  granularity: DiscordAnalyticsGranularity = 'daily',
) {
  return database
    .select()
    .from(discordChannelAnalyticsSnapshotsTable)
    .where(
      and(
        eq(discordChannelAnalyticsSnapshotsTable.channelId, channelId),
        eq(discordChannelAnalyticsSnapshotsTable.granularity, granularity),
        gte(discordChannelAnalyticsSnapshotsTable.periodStart, from),
        lte(discordChannelAnalyticsSnapshotsTable.periodStart, to),
      ),
    )
    .orderBy(asc(discordChannelAnalyticsSnapshotsTable.periodStart));
}
export async function getDiscordMemberAnalytics(
  database: DatabaseClient,
  memberId: string,
  from: Date,
  to: Date,
  granularity: DiscordAnalyticsGranularity = 'daily',
) {
  return database
    .select()
    .from(discordMemberAnalyticsSnapshotsTable)
    .where(
      and(
        eq(discordMemberAnalyticsSnapshotsTable.memberId, memberId),
        eq(discordMemberAnalyticsSnapshotsTable.granularity, granularity),
        gte(discordMemberAnalyticsSnapshotsTable.periodStart, from),
        lte(discordMemberAnalyticsSnapshotsTable.periodStart, to),
      ),
    )
    .orderBy(asc(discordMemberAnalyticsSnapshotsTable.periodStart));
}
export function deriveDiscordGuildMetrics(
  snapshot: typeof discordGuildAnalyticsSnapshotsTable.$inferSelect,
) {
  const ratio = (value: number, denominator: number) =>
    denominator > 0 ? value / denominator : 0;
  return {
    engagementRate: ratio(snapshot.activeMembers, snapshot.humanMembers),
    messageEngagementRate: ratio(
      snapshot.uniqueMessageAuthors,
      snapshot.humanMembers,
    ),
    voiceEngagementRate: ratio(
      snapshot.uniqueVoiceUsers,
      snapshot.humanMembers,
    ),
    aiAdoptionRate: ratio(snapshot.uniqueAiUsers, snapshot.activeMembers),
    musicAdoptionRate: ratio(
      snapshot.uniqueMusicListeners,
      snapshot.activeMembers,
    ),
    memberChurnRate: ratio(
      snapshot.membersLeft,
      snapshot.totalMembers + snapshot.membersLeft,
    ),
    growthRate: ratio(
      snapshot.netGrowth,
      snapshot.totalMembers - snapshot.netGrowth,
    ),
    messagesPerActiveMember: ratio(
      snapshot.messagesSent,
      snapshot.activeMembers,
    ),
    voiceMinutesPerVoiceMember: ratio(
      snapshot.voiceMinutes,
      snapshot.uniqueVoiceUsers,
    ),
    commandSuccessRate: ratio(
      snapshot.successfulCommands,
      snapshot.commandsExecuted,
    ),
    aiFailureRate: ratio(snapshot.aiFailures, snapshot.aiInteractions),
    musicFailureRate: ratio(snapshot.failedTracks, snapshot.songsPlayed),
  };
}

export async function getDiscordGuildGrowthAnalytics(
  database: DatabaseClient,
  guildId: string,
  from: Date,
  to: Date,
) {
  return (await getDiscordGuildAnalytics(database, guildId, from, to)).map(
    (row) => ({
      periodStart: row.periodStart,
      totalMembers: row.totalMembers,
      newMembers: row.newMembers,
      returningMembers: row.returningMembers,
      membersLeft: row.membersLeft,
      netGrowth: row.netGrowth,
      growthRate: deriveDiscordGuildMetrics(row).growthRate,
      churnRate: deriveDiscordGuildMetrics(row).memberChurnRate,
    }),
  );
}
export async function getDiscordGuildEngagementAnalytics(
  database: DatabaseClient,
  guildId: string,
  from: Date,
  to: Date,
) {
  return (await getDiscordGuildAnalytics(database, guildId, from, to)).map(
    (row) => ({
      periodStart: row.periodStart,
      activeMembers: row.activeMembers,
      messagesSent: row.messagesSent,
      voiceMinutes: row.voiceMinutes,
      aiInteractions: row.aiInteractions,
      musicSessions: row.musicSessions,
      ...deriveDiscordGuildMetrics(row),
    }),
  );
}
export async function getDiscordGuildModerationAnalytics(
  database: DatabaseClient,
  guildId: string,
  from: Date,
  to: Date,
) {
  return (await getDiscordGuildAnalytics(database, guildId, from, to)).map(
    ({
      periodStart,
      warnings,
      strikes,
      timeouts,
      kicks,
      bans,
      unbans,
      automodActions,
      phishingDetections,
      raidIncidents,
      appeals,
    }) => ({
      periodStart,
      warnings,
      strikes,
      timeouts,
      kicks,
      bans,
      unbans,
      automodActions,
      phishingDetections,
      raidIncidents,
      appeals,
    }),
  );
}
export async function getDiscordGuildAiAnalytics(
  database: DatabaseClient,
  guildId: string,
  from: Date,
  to: Date,
) {
  return (await getDiscordGuildAnalytics(database, guildId, from, to)).map(
    ({
      periodStart,
      aiInteractions,
      uniqueAiUsers,
      aiTextInteractions,
      aiVoiceSessions,
      aiVoiceMinutes,
      aiInputTokens,
      aiOutputTokens,
      aiToolCalls,
      aiFailures,
      aiEstimatedCost,
    }) => ({
      periodStart,
      aiInteractions,
      uniqueAiUsers,
      aiTextInteractions,
      aiVoiceSessions,
      aiVoiceMinutes,
      aiInputTokens,
      aiOutputTokens,
      aiToolCalls,
      aiFailures,
      aiEstimatedCost,
    }),
  );
}
export async function getDiscordGuildMusicAnalytics(
  database: DatabaseClient,
  guildId: string,
  from: Date,
  to: Date,
) {
  return (await getDiscordGuildAnalytics(database, guildId, from, to)).map(
    ({
      periodStart,
      musicSessions,
      songsPlayed,
      musicMinutes,
      uniqueMusicListeners,
      uniqueMusicRequesters,
      musicSkips,
      failedTracks,
    }) => ({
      periodStart,
      musicSessions,
      songsPlayed,
      musicMinutes,
      uniqueMusicListeners,
      uniqueMusicRequesters,
      musicSkips,
      failedTracks,
    }),
  );
}
export async function getDiscordGuildVoiceAnalytics(
  database: DatabaseClient,
  guildId: string,
  from: Date,
  to: Date,
) {
  return (await getDiscordGuildAnalytics(database, guildId, from, to)).map(
    ({
      periodStart,
      voiceSessions,
      uniqueVoiceUsers,
      voiceMinutes,
      peakConcurrentVoiceUsers,
      stageParticipants,
      streamSessions,
      videoSessions,
    }) => ({
      periodStart,
      voiceSessions,
      uniqueVoiceUsers,
      voiceMinutes,
      peakConcurrentVoiceUsers,
      stageParticipants,
      streamSessions,
      videoSessions,
    }),
  );
}
export async function getDiscordGuildCommandAnalytics(
  database: DatabaseClient,
  guildId: string,
  from: Date,
  to: Date,
) {
  return (await getDiscordGuildAnalytics(database, guildId, from, to)).map(
    ({
      periodStart,
      commandsExecuted,
      successfulCommands,
      failedCommands,
      uniqueCommandUsers,
      topCommands,
    }) => ({
      periodStart,
      commandsExecuted,
      successfulCommands,
      failedCommands,
      uniqueCommandUsers,
      topCommands,
    }),
  );
}
export async function getMostActiveDiscordChannels(
  database: DatabaseClient,
  guildId: string,
  from: Date,
  limit = 10,
) {
  const rows = await database
    .select()
    .from(discordChannelAnalyticsSnapshotsTable)
    .where(
      and(
        eq(discordChannelAnalyticsSnapshotsTable.guildId, guildId),
        gte(discordChannelAnalyticsSnapshotsTable.periodStart, from),
      ),
    )
    .orderBy(desc(discordChannelAnalyticsSnapshotsTable.messageCount));
  return aggregateChannelSnapshots(rows)
    .sort((a, b) => b.activity - a.activity)
    .slice(0, limit);
}
export async function getInactiveDiscordChannels(
  database: DatabaseClient,
  guildId: string,
  from: Date,
  limit = 10,
) {
  const rows = await database
    .select()
    .from(discordChannelAnalyticsSnapshotsTable)
    .where(
      and(
        eq(discordChannelAnalyticsSnapshotsTable.guildId, guildId),
        gte(discordChannelAnalyticsSnapshotsTable.periodStart, from),
      ),
    );
  return aggregateChannelSnapshots(rows)
    .sort((a, b) => a.activity - b.activity)
    .slice(0, limit);
}
export async function getMostActiveDiscordMembers(
  database: DatabaseClient,
  guildId: string,
  from: Date,
  limit = 10,
) {
  const rows = await database
    .select()
    .from(discordMemberAnalyticsSnapshotsTable)
    .where(
      and(
        eq(discordMemberAnalyticsSnapshotsTable.guildId, guildId),
        gte(discordMemberAnalyticsSnapshotsTable.periodStart, from),
      ),
    );
  const aggregate = new Map<string, { memberId: string; activity: number }>();
  for (const row of rows) {
    const current = aggregate.get(row.memberId) ?? {
      memberId: row.memberId,
      activity: 0,
    };
    current.activity +=
      row.messages +
      row.voiceMinutes +
      row.commands +
      row.aiInteractions +
      row.musicRequests +
      row.reactions;
    aggregate.set(row.memberId, current);
  }
  return [...aggregate.values()]
    .sort((a, b) => b.activity - a.activity)
    .slice(0, limit);
}
export async function getDiscordActiveUserMetrics(
  database: DatabaseClient,
  guildId: string,
  now = new Date(),
) {
  const since = new Date(now);
  since.setUTCDate(since.getUTCDate() - 30);
  const rows = await database
    .select({
      memberId: discordMemberAnalyticsSnapshotsTable.memberId,
      periodStart: discordMemberAnalyticsSnapshotsTable.periodStart,
      lastActiveAt: discordMemberAnalyticsSnapshotsTable.lastActiveAt,
    })
    .from(discordMemberAnalyticsSnapshotsTable)
    .where(
      and(
        eq(discordMemberAnalyticsSnapshotsTable.guildId, guildId),
        eq(discordMemberAnalyticsSnapshotsTable.granularity, 'daily'),
        gte(discordMemberAnalyticsSnapshotsTable.periodStart, since),
      ),
    );
  const cutoff = (days: number) => new Date(now.getTime() - days * 86_400_000);
  const active = (days: number) =>
    new Set(
      rows
        .filter((row) => row.lastActiveAt && row.lastActiveAt >= cutoff(days))
        .map((row) => row.memberId),
    ).size;
  const dau = active(1),
    wau = active(7),
    mau = active(30);
  return {
    dau,
    wau,
    mau,
    dauMauRatio: mau ? dau / mau : 0,
    wauMauRatio: mau ? wau / mau : 0,
  };
}
export function calculateDiscordRetention(
  currentMemberIds: readonly string[],
  cohortMemberIds: readonly string[],
) {
  if (cohortMemberIds.length === 0) return 0;
  const current = new Set(currentMemberIds);
  return (
    cohortMemberIds.filter((id) => current.has(id)).length /
    cohortMemberIds.length
  );
}
export async function getDiscordForumHealth(
  database: DatabaseClient,
  guildId: string,
  from: Date,
) {
  const rows = await database
    .select()
    .from(discordChannelAnalyticsSnapshotsTable)
    .where(
      and(
        eq(discordChannelAnalyticsSnapshotsTable.guildId, guildId),
        gte(discordChannelAnalyticsSnapshotsTable.periodStart, from),
      ),
    );
  const forumPosts = rows.reduce((sum, row) => sum + row.forumPosts, 0),
    replies = rows.reduce((sum, row) => sum + row.forumReplies, 0),
    unanswered = rows.reduce((sum, row) => sum + row.unansweredForumPosts, 0);
  return {
    forumPosts,
    replies,
    unanswered,
    averageRepliesPerPost: forumPosts ? replies / forumPosts : 0,
    responseRate: forumPosts ? (forumPosts - unanswered) / forumPosts : 0,
  };
}
function aggregateChannelSnapshots(
  rows: Array<typeof discordChannelAnalyticsSnapshotsTable.$inferSelect>,
) {
  const aggregate = new Map<
    string,
    {
      channelId: string;
      messages: number;
      voiceMinutes: number;
      activity: number;
    }
  >();
  for (const row of rows) {
    const current = aggregate.get(row.channelId) ?? {
      channelId: row.channelId,
      messages: 0,
      voiceMinutes: 0,
      activity: 0,
    };
    current.messages += row.messageCount;
    current.voiceMinutes += row.voiceMinutes;
    current.activity +=
      row.messageCount +
      row.voiceMinutes +
      row.aiInteractions +
      row.commandExecutions +
      row.reactionCount;
    aggregate.set(row.channelId, current);
  }
  return [...aggregate.values()];
}
