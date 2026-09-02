import { eq } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  getDiscordAiSessions,
  getDiscordAiUsageByAccount,
  getDiscordAiUsageSummary,
} from '../../queries/discord';
import {
  discordAiSessionsTable,
  discordAiUsageEventsTable,
} from '../../schema';

export class DrizzleDiscordAiRepository {
  constructor(private readonly database: DatabaseClient) {}
  getSessions(filters: Parameters<typeof getDiscordAiSessions>[1]) {
    return getDiscordAiSessions(this.database, filters);
  }
  getUsageByAccount(accountId: string, since: Date) {
    return getDiscordAiUsageByAccount(this.database, accountId, since);
  }
  getUsageSummary(filters: Parameters<typeof getDiscordAiUsageSummary>[1]) {
    return getDiscordAiUsageSummary(this.database, filters);
  }
  async createSession(input: typeof discordAiSessionsTable.$inferInsert) {
    const [row] = await this.database
      .insert(discordAiSessionsTable)
      .values(input)
      .onConflictDoUpdate({
        target: discordAiSessionsTable.aerealithSessionReference,
        set: { ...input },
      })
      .returning();
    if (!row) throw new Error('Failed to create Discord AI session link.');
    return row;
  }
  async closeSession(id: string, endedAt = new Date()) {
    const [row] = await this.database
      .update(discordAiSessionsTable)
      .set({ endedAt })
      .where(eq(discordAiSessionsTable.id, id))
      .returning();
    return row ?? null;
  }
  async recordUsage(input: typeof discordAiUsageEventsTable.$inferInsert) {
    const [row] = await this.database
      .insert(discordAiUsageEventsTable)
      .values(input)
      .returning();
    if (!row) throw new Error('Failed to record Discord AI usage.');
    return row;
  }
}
