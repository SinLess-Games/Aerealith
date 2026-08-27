import { and, desc, eq, gte, isNull } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  discordAiSessionsTable,
  discordAiUsageEventsTable,
  discordMusicPlaylistsTable,
  discordMusicSessionsTable,
  discordMusicTracksTable,
} from '../../schema';

export async function getRecentDiscordMusicSessions(
  database: DatabaseClient,
  guildId: string,
  limit = 25,
) {
  return database
    .select()
    .from(discordMusicSessionsTable)
    .where(eq(discordMusicSessionsTable.guildId, guildId))
    .orderBy(desc(discordMusicSessionsTable.startedAt))
    .limit(limit);
}
export async function getCurrentDiscordMusicSession(
  database: DatabaseClient,
  guildId: string,
) {
  const [row] = await database
    .select()
    .from(discordMusicSessionsTable)
    .where(
      and(
        eq(discordMusicSessionsTable.guildId, guildId),
        isNull(discordMusicSessionsTable.endedAt),
      ),
    )
    .orderBy(desc(discordMusicSessionsTable.startedAt))
    .limit(1);
  return row ?? null;
}
export async function getDiscordUserMusicHistory(
  database: DatabaseClient,
  accountId: string,
  limit = 100,
) {
  return database
    .select()
    .from(discordMusicTracksTable)
    .where(eq(discordMusicTracksTable.requestedByAccountId, accountId))
    .orderBy(desc(discordMusicTracksTable.requestedAt))
    .limit(limit);
}
export async function getDiscordPopularMusic(
  database: DatabaseClient,
  guildId: string,
  since: Date,
  limit = 20,
) {
  const rows = await database
    .select({
      title: discordMusicTracksTable.title,
      author: discordMusicTracksTable.author,
    })
    .from(discordMusicTracksTable)
    .where(
      and(
        eq(discordMusicTracksTable.guildId, guildId),
        gte(discordMusicTracksTable.requestedAt, since),
      ),
    );
  const counts = new Map<
    string,
    { title: string; author: string | null; requests: number }
  >();
  for (const row of rows) {
    const key = `${row.author ?? ''}\u0000${row.title}`;
    const current = counts.get(key) ?? { ...row, requests: 0 };
    current.requests += 1;
    counts.set(key, current);
  }
  return [...counts.values()]
    .sort((a, b) => b.requests - a.requests)
    .slice(0, limit);
}
export async function getDiscordMusicPlaylists(
  database: DatabaseClient,
  ownerAccountId: string,
) {
  return database
    .select()
    .from(discordMusicPlaylistsTable)
    .where(
      and(
        eq(discordMusicPlaylistsTable.ownerAccountId, ownerAccountId),
        isNull(discordMusicPlaylistsTable.deletedAt),
      ),
    )
    .orderBy(desc(discordMusicPlaylistsTable.updatedAt));
}
export async function getDiscordAiSessions(
  database: DatabaseClient,
  filters: { guildId?: string; accountId?: string; since?: Date },
) {
  return database
    .select()
    .from(discordAiSessionsTable)
    .where(
      and(
        filters.guildId
          ? eq(discordAiSessionsTable.guildId, filters.guildId)
          : undefined,
        filters.accountId
          ? eq(discordAiSessionsTable.accountId, filters.accountId)
          : undefined,
        filters.since
          ? gte(discordAiSessionsTable.startedAt, filters.since)
          : undefined,
      ),
    )
    .orderBy(desc(discordAiSessionsTable.startedAt));
}
export async function getDiscordAiUsageByAccount(
  database: DatabaseClient,
  accountId: string,
  since: Date,
) {
  return database
    .select()
    .from(discordAiUsageEventsTable)
    .where(
      and(
        eq(discordAiUsageEventsTable.accountId, accountId),
        gte(discordAiUsageEventsTable.occurredAt, since),
      ),
    )
    .orderBy(desc(discordAiUsageEventsTable.occurredAt));
}
export async function getDiscordAiUsageSummary(
  database: DatabaseClient,
  filters: { guildId?: string; accountId?: string; since: Date },
) {
  const rows = await database
    .select()
    .from(discordAiUsageEventsTable)
    .where(
      and(
        filters.guildId
          ? eq(discordAiUsageEventsTable.guildId, filters.guildId)
          : undefined,
        filters.accountId
          ? eq(discordAiUsageEventsTable.accountId, filters.accountId)
          : undefined,
        gte(discordAiUsageEventsTable.occurredAt, filters.since),
      ),
    );
  return rows.reduce(
    (summary, row) => {
      summary.requests += 1;
      summary.inputTokens += row.inputTokens;
      summary.outputTokens += row.outputTokens;
      summary.cachedTokens += row.cachedTokens;
      summary.toolCalls += row.toolCalls;
      summary.voiceSeconds += row.voiceSeconds;
      summary.failures += Number(row.failed);
      summary.estimatedProviderCost += Number(row.estimatedProviderCost ?? 0);
      if (row.billingUsageReference)
        summary.billingUsageReferences.add(row.billingUsageReference);
      return summary;
    },
    {
      requests: 0,
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
      toolCalls: 0,
      voiceSeconds: 0,
      failures: 0,
      estimatedProviderCost: 0,
      billingUsageReferences: new Set<string>(),
    },
  );
}
