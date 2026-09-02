import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  discordAiUsageEventsTable,
  discordModerationCasesTable,
  discordMusicTracksTable,
  discordPersonaProxyPatternsTable,
  discordPersonasTable,
  discordProxiedMessagesTable,
  discordScheduledActionsTable,
  discordTicketsTable,
} from '../../schema';

export async function getDiscordActiveModerationCases(
  database: DatabaseClient,
  guildId: string,
) {
  return database
    .select()
    .from(discordModerationCasesTable)
    .where(
      and(
        eq(discordModerationCasesTable.guildId, guildId),
        eq(discordModerationCasesTable.status, 'open'),
      ),
    )
    .orderBy(desc(discordModerationCasesTable.createdAt));
}
export async function getDiscordModerationHistory(
  database: DatabaseClient,
  targetAccountId: string,
) {
  return database
    .select()
    .from(discordModerationCasesTable)
    .where(eq(discordModerationCasesTable.targetAccountId, targetAccountId))
    .orderBy(desc(discordModerationCasesTable.createdAt));
}
export async function getDiscordOpenTickets(
  database: DatabaseClient,
  guildId: string,
) {
  return database
    .select()
    .from(discordTicketsTable)
    .where(
      and(
        eq(discordTicketsTable.guildId, guildId),
        eq(discordTicketsTable.status, 'open'),
      ),
    )
    .orderBy(asc(discordTicketsTable.createdAt));
}
export async function getDiscordPersonaProxyPatterns(
  database: DatabaseClient,
  ownerAccountId: string,
) {
  return database
    .select({
      persona: discordPersonasTable,
      pattern: discordPersonaProxyPatternsTable,
    })
    .from(discordPersonaProxyPatternsTable)
    .innerJoin(
      discordPersonasTable,
      eq(discordPersonaProxyPatternsTable.personaId, discordPersonasTable.id),
    )
    .where(
      and(
        eq(discordPersonasTable.ownerAccountId, ownerAccountId),
        eq(discordPersonaProxyPatternsTable.enabled, true),
        eq(discordPersonasTable.status, 'active'),
      ),
    )
    .orderBy(desc(discordPersonaProxyPatternsTable.priority));
}
export async function getDiscordProxiedMessage(
  database: DatabaseClient,
  resultingDiscordMessageId: string,
) {
  const [row] = await database
    .select()
    .from(discordProxiedMessagesTable)
    .where(
      eq(
        discordProxiedMessagesTable.resultingDiscordMessageId,
        resultingDiscordMessageId,
      ),
    )
    .limit(1);
  return row ?? null;
}
export async function getDiscordMusicHistory(
  database: DatabaseClient,
  guildId: string,
  limit = 100,
) {
  return database
    .select()
    .from(discordMusicTracksTable)
    .where(eq(discordMusicTracksTable.guildId, guildId))
    .orderBy(desc(discordMusicTracksTable.requestedAt))
    .limit(limit);
}
export async function getDiscordAiUsage(
  database: DatabaseClient,
  guildId: string,
  from: Date,
) {
  return database
    .select()
    .from(discordAiUsageEventsTable)
    .where(
      and(
        eq(discordAiUsageEventsTable.guildId, guildId),
        gte(discordAiUsageEventsTable.occurredAt, from),
      ),
    )
    .orderBy(asc(discordAiUsageEventsTable.occurredAt));
}
export async function getDueDiscordScheduledActions(
  database: DatabaseClient,
  now = new Date(),
  limit = 100,
) {
  return database
    .select()
    .from(discordScheduledActionsTable)
    .where(
      and(
        eq(discordScheduledActionsTable.status, 'pending'),
        lte(discordScheduledActionsTable.executeAt, now),
      ),
    )
    .orderBy(asc(discordScheduledActionsTable.executeAt))
    .limit(limit);
}
