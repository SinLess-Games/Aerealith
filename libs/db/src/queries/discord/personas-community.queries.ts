import { and, desc, eq, inArray } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  discordGiveawaysTable,
  discordMemberLevelsTable,
  discordMemberReputationTable,
  discordPersonaGuildSettingsTable,
  discordPersonasTable,
  discordStarboardEntriesTable,
  discordSuggestionsTable,
  discordTicketEventsTable,
  discordTicketsTable,
} from '../../schema';

export async function getDiscordPersonaById(
  database: DatabaseClient,
  id: string,
) {
  const [row] = await database
    .select()
    .from(discordPersonasTable)
    .where(eq(discordPersonasTable.id, id))
    .limit(1);
  return row ?? null;
}
export async function getDiscordPersonasByOwner(
  database: DatabaseClient,
  ownerAccountId: string,
) {
  return database
    .select()
    .from(discordPersonasTable)
    .where(
      and(
        eq(discordPersonasTable.ownerAccountId, ownerAccountId),
        eq(discordPersonasTable.status, 'active'),
      ),
    )
    .orderBy(desc(discordPersonasTable.updatedAt));
}
export async function getDiscordPersonaGuildSettings(
  database: DatabaseClient,
  personaId: string,
  guildId: string,
) {
  const [row] = await database
    .select()
    .from(discordPersonaGuildSettingsTable)
    .where(
      and(
        eq(discordPersonaGuildSettingsTable.personaId, personaId),
        eq(discordPersonaGuildSettingsTable.guildId, guildId),
      ),
    )
    .limit(1);
  return row ?? null;
}
export async function getDiscordTicketsByCreator(
  database: DatabaseClient,
  accountId: string,
) {
  return database
    .select()
    .from(discordTicketsTable)
    .where(eq(discordTicketsTable.creatorAccountId, accountId))
    .orderBy(desc(discordTicketsTable.createdAt));
}
export async function getAssignedDiscordTickets(
  database: DatabaseClient,
  accountId: string,
) {
  return database
    .select()
    .from(discordTicketsTable)
    .where(
      and(
        eq(discordTicketsTable.assignedStaffAccountId, accountId),
        inArray(discordTicketsTable.status, ['open', 'claimed', 'reopened']),
      ),
    )
    .orderBy(desc(discordTicketsTable.updatedAt));
}
export async function getDiscordTicketHistory(
  database: DatabaseClient,
  ticketId: string,
) {
  return database
    .select()
    .from(discordTicketEventsTable)
    .where(eq(discordTicketEventsTable.ticketId, ticketId))
    .orderBy(desc(discordTicketEventsTable.createdAt));
}
export async function getDiscordSuggestions(
  database: DatabaseClient,
  guildId: string,
  status?: string,
) {
  return database
    .select()
    .from(discordSuggestionsTable)
    .where(
      and(
        eq(discordSuggestionsTable.guildId, guildId),
        status ? eq(discordSuggestionsTable.status, status) : undefined,
      ),
    )
    .orderBy(desc(discordSuggestionsTable.createdAt));
}
export async function getDiscordStarboardEntries(
  database: DatabaseClient,
  guildId: string,
) {
  return database
    .select()
    .from(discordStarboardEntriesTable)
    .where(eq(discordStarboardEntriesTable.guildId, guildId))
    .orderBy(desc(discordStarboardEntriesTable.starCount));
}
export async function getDiscordMemberLevel(
  database: DatabaseClient,
  memberId: string,
) {
  const [row] = await database
    .select()
    .from(discordMemberLevelsTable)
    .where(eq(discordMemberLevelsTable.memberId, memberId))
    .limit(1);
  return row ?? null;
}
export async function getDiscordMemberReputation(
  database: DatabaseClient,
  memberId: string,
) {
  const [row] = await database
    .select()
    .from(discordMemberReputationTable)
    .where(eq(discordMemberReputationTable.memberId, memberId))
    .limit(1);
  return row ?? null;
}
export async function getDiscordGiveaways(
  database: DatabaseClient,
  guildId: string,
  status?: string,
) {
  return database
    .select()
    .from(discordGiveawaysTable)
    .where(
      and(
        eq(discordGiveawaysTable.guildId, guildId),
        status ? eq(discordGiveawaysTable.status, status) : undefined,
      ),
    )
    .orderBy(desc(discordGiveawaysTable.endsAt));
}
