import { eq, max } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  discordModerationCasesTable,
  discordModerationEvidenceTable,
  discordTicketEventsTable,
  discordTicketsTable,
} from '../../schema';
import { withTransaction } from '../with-transaction';

export async function createDiscordModerationActionTransaction(
  database: DatabaseClient,
  input: {
    case: Omit<typeof discordModerationCasesTable.$inferInsert, 'caseNumber'>;
    evidence?: Array<
      Omit<typeof discordModerationEvidenceTable.$inferInsert, 'caseId'>
    >;
  },
) {
  return withTransaction(database, async (tx) => {
    const [latest] = await tx
      .select({ value: max(discordModerationCasesTable.caseNumber) })
      .from(discordModerationCasesTable)
      .where(eq(discordModerationCasesTable.guildId, input.case.guildId));
    const [moderationCase] = await tx
      .insert(discordModerationCasesTable)
      .values({ ...input.case, caseNumber: (latest?.value ?? 0) + 1 })
      .returning();
    if (!moderationCase) throw new Error('Failed to create moderation action.');
    const evidence = input.evidence?.length
      ? await tx
          .insert(discordModerationEvidenceTable)
          .values(
            input.evidence.map((item) => ({
              ...item,
              caseId: moderationCase.id,
            })),
          )
          .returning()
      : [];
    return { moderationCase, evidence };
  });
}

export async function closeDiscordTicketTransaction(
  database: DatabaseClient,
  input: {
    ticketId: string;
    actorAccountId?: string;
    closureReason?: string;
    transcriptObjectReference?: string;
    details?: Record<string, unknown>;
    closedAt?: Date;
  },
) {
  return withTransaction(database, async (tx) => {
    const closedAt = input.closedAt ?? new Date();
    const [ticket] = await tx
      .update(discordTicketsTable)
      .set({
        status: 'closed',
        closureReason: input.closureReason,
        transcriptObjectReference: input.transcriptObjectReference,
        closedAt,
        updatedAt: closedAt,
      })
      .where(eq(discordTicketsTable.id, input.ticketId))
      .returning();
    if (!ticket) return null;
    await tx.insert(discordTicketEventsTable).values({
      ticketId: input.ticketId,
      actorAccountId: input.actorAccountId,
      eventType: 'closed',
      details: input.details ?? {
        closureReason: input.closureReason,
        transcriptStored: Boolean(input.transcriptObjectReference),
      },
      createdAt: closedAt,
    });
    return ticket;
  });
}
