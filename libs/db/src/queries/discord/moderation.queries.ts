import { and, desc, eq, inArray } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  discordAutomodRulesTable,
  discordModerationAppealsTable,
  discordModerationCasesTable,
  discordRaidIncidentsTable,
} from '../../schema';

export async function getDiscordModerationCaseById(
  database: DatabaseClient,
  id: string,
) {
  const [row] = await database
    .select()
    .from(discordModerationCasesTable)
    .where(eq(discordModerationCasesTable.id, id))
    .limit(1);
  return row ?? null;
}
export async function getDiscordModerationCaseByNumber(
  database: DatabaseClient,
  guildId: string,
  caseNumber: number,
) {
  const [row] = await database
    .select()
    .from(discordModerationCasesTable)
    .where(
      and(
        eq(discordModerationCasesTable.guildId, guildId),
        eq(discordModerationCasesTable.caseNumber, caseNumber),
      ),
    )
    .limit(1);
  return row ?? null;
}
export async function getDiscordModerationCasesByModerator(
  database: DatabaseClient,
  moderatorAccountId: string,
) {
  return database
    .select()
    .from(discordModerationCasesTable)
    .where(
      eq(discordModerationCasesTable.moderatorAccountId, moderatorAccountId),
    )
    .orderBy(desc(discordModerationCasesTable.createdAt));
}
export async function getDiscordWarningsAndStrikes(
  database: DatabaseClient,
  guildId: string,
  targetAccountId?: string,
) {
  return database
    .select()
    .from(discordModerationCasesTable)
    .where(
      and(
        eq(discordModerationCasesTable.guildId, guildId),
        inArray(discordModerationCasesTable.action, ['warning', 'strike']),
        targetAccountId
          ? eq(discordModerationCasesTable.targetAccountId, targetAccountId)
          : undefined,
      ),
    )
    .orderBy(desc(discordModerationCasesTable.createdAt));
}
export async function getOpenDiscordModerationAppeals(
  database: DatabaseClient,
  guildId: string,
) {
  return database
    .select()
    .from(discordModerationAppealsTable)
    .where(
      and(
        eq(discordModerationAppealsTable.guildId, guildId),
        eq(discordModerationAppealsTable.status, 'pending'),
      ),
    )
    .orderBy(desc(discordModerationAppealsTable.submittedAt));
}
export async function getActiveDiscordAutomodRules(
  database: DatabaseClient,
  guildId: string,
) {
  return database
    .select()
    .from(discordAutomodRulesTable)
    .where(
      and(
        eq(discordAutomodRulesTable.guildId, guildId),
        eq(discordAutomodRulesTable.enabled, true),
      ),
    )
    .orderBy(desc(discordAutomodRulesTable.priority));
}
export async function getDiscordRaidIncidents(
  database: DatabaseClient,
  guildId: string,
) {
  return database
    .select()
    .from(discordRaidIncidentsTable)
    .where(eq(discordRaidIncidentsTable.guildId, guildId))
    .orderBy(desc(discordRaidIncidentsTable.startedAt));
}
export async function getDiscordModerationSummary(
  database: DatabaseClient,
  guildId: string,
) {
  const cases = await database
    .select({
      action: discordModerationCasesTable.action,
      status: discordModerationCasesTable.status,
    })
    .from(discordModerationCasesTable)
    .where(eq(discordModerationCasesTable.guildId, guildId));
  return cases.reduce(
    (summary, row) => {
      summary.total += 1;
      summary.byAction[row.action] = (summary.byAction[row.action] ?? 0) + 1;
      summary.byStatus[row.status] = (summary.byStatus[row.status] ?? 0) + 1;
      return summary;
    },
    {
      total: 0,
      byAction: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    },
  );
}
