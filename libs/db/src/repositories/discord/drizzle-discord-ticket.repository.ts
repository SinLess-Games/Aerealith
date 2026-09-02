import { eq, max } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  getAssignedDiscordTickets,
  getDiscordOpenTickets,
  getDiscordTicketHistory,
  getDiscordTicketsByCreator,
} from '../../queries/discord';
import {
  discordTicketEventsTable,
  discordTicketParticipantsTable,
  discordTicketsTable,
} from '../../schema';

export class DrizzleDiscordTicketRepository {
  constructor(private readonly database: DatabaseClient) {}
  getOpen(guildId: string) {
    return getDiscordOpenTickets(this.database, guildId);
  }
  getByCreator(accountId: string) {
    return getDiscordTicketsByCreator(this.database, accountId);
  }
  getAssigned(accountId: string) {
    return getAssignedDiscordTickets(this.database, accountId);
  }
  getHistory(ticketId: string) {
    return getDiscordTicketHistory(this.database, ticketId);
  }
  async create(
    input: Omit<typeof discordTicketsTable.$inferInsert, 'ticketNumber'>,
  ) {
    return this.database.transaction(async (tx) => {
      const [latest] = await tx
        .select({ value: max(discordTicketsTable.ticketNumber) })
        .from(discordTicketsTable)
        .where(eq(discordTicketsTable.guildId, input.guildId));
      const [ticket] = await tx
        .insert(discordTicketsTable)
        .values({ ...input, ticketNumber: (latest?.value ?? 0) + 1 })
        .returning();
      if (!ticket) throw new Error('Failed to create Discord ticket.');
      await tx.insert(discordTicketParticipantsTable).values({
        ticketId: ticket.id,
        accountId: ticket.creatorAccountId,
        role: 'creator',
      });
      await tx.insert(discordTicketEventsTable).values({
        ticketId: ticket.id,
        actorAccountId: ticket.creatorAccountId,
        eventType: 'created',
      });
      return ticket;
    });
  }
  async assign(id: string, staffAccountId: string) {
    return this.transition(id, 'claimed', staffAccountId, {
      assignedStaffAccountId: staffAccountId,
      claimedAt: new Date(),
    });
  }
  async close(
    id: string,
    actorAccountId: string,
    closureReason?: string,
    transcriptObjectReference?: string,
  ) {
    return this.transition(id, 'closed', actorAccountId, {
      closureReason,
      transcriptObjectReference,
      closedAt: new Date(),
    });
  }
  async reopen(id: string, actorAccountId: string) {
    return this.transition(id, 'reopened', actorAccountId, {
      reopenedAt: new Date(),
      closedAt: null,
    });
  }
  async archive(id: string, actorAccountId: string) {
    return this.transition(id, 'archived', actorAccountId, {
      archivedAt: new Date(),
    });
  }
  async addParticipant(
    ticketId: string,
    accountId: string,
    role = 'participant',
  ) {
    const [row] = await this.database
      .insert(discordTicketParticipantsTable)
      .values({ ticketId, accountId, role })
      .onConflictDoUpdate({
        target: [
          discordTicketParticipantsTable.ticketId,
          discordTicketParticipantsTable.accountId,
        ],
        set: { role, removedAt: null },
      })
      .returning();
    if (!row) throw new Error('Failed to add Discord ticket participant.');
    return row;
  }
  private async transition(
    id: string,
    status: typeof discordTicketsTable.$inferSelect.status,
    actorAccountId: string,
    values: Partial<typeof discordTicketsTable.$inferInsert>,
  ) {
    return this.database.transaction(async (tx) => {
      const [ticket] = await tx
        .update(discordTicketsTable)
        .set({ ...values, status, updatedAt: new Date() })
        .where(eq(discordTicketsTable.id, id))
        .returning();
      if (!ticket) return null;
      await tx.insert(discordTicketEventsTable).values({
        ticketId: id,
        actorAccountId,
        eventType: status,
        details: values,
      });
      return ticket;
    });
  }
}
