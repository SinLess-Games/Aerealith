import { eq, max } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  getDiscordActiveModerationCases,
  getDiscordModerationCaseById,
  getDiscordModerationCaseByNumber,
  getDiscordModerationHistory,
  getDiscordModerationSummary,
} from '../../queries/discord';
import {
  discordModerationAppealsTable,
  discordModerationCasesTable,
  discordModerationEvidenceTable,
  discordRaidIncidentsTable,
} from '../../schema';

export class DrizzleDiscordModerationRepository {
  constructor(private readonly database: DatabaseClient) {}
  findById(id: string) {
    return getDiscordModerationCaseById(this.database, id);
  }
  findByCaseNumber(guildId: string, caseNumber: number) {
    return getDiscordModerationCaseByNumber(this.database, guildId, caseNumber);
  }
  getTargetHistory(accountId: string) {
    return getDiscordModerationHistory(this.database, accountId);
  }
  getActive(guildId: string) {
    return getDiscordActiveModerationCases(this.database, guildId);
  }
  getSummary(guildId: string) {
    return getDiscordModerationSummary(this.database, guildId);
  }
  async createCase(
    input: Omit<typeof discordModerationCasesTable.$inferInsert, 'caseNumber'>,
    evidence: Array<
      Omit<typeof discordModerationEvidenceTable.$inferInsert, 'caseId'>
    > = [],
  ) {
    return this.database.transaction(async (tx) => {
      const [latest] = await tx
        .select({ value: max(discordModerationCasesTable.caseNumber) })
        .from(discordModerationCasesTable)
        .where(eq(discordModerationCasesTable.guildId, input.guildId));
      const [created] = await tx
        .insert(discordModerationCasesTable)
        .values({ ...input, caseNumber: (latest?.value ?? 0) + 1 })
        .returning();
      if (!created)
        throw new Error('Failed to create Discord moderation case.');
      if (evidence.length)
        await tx
          .insert(discordModerationEvidenceTable)
          .values(evidence.map((item) => ({ ...item, caseId: created.id })));
      return created;
    });
  }
  async updateCase(
    id: string,
    input: Partial<typeof discordModerationCasesTable.$inferInsert>,
  ) {
    const [row] = await this.database
      .update(discordModerationCasesTable)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(discordModerationCasesTable.id, id))
      .returning();
    return row ?? null;
  }
  resolveCase(id: string, resolution: 'resolved' | 'reversed' | 'expired') {
    const now = new Date();
    return this.updateCase(id, {
      status: resolution,
      resolvedAt: resolution === 'resolved' ? now : undefined,
      reversedAt: resolution === 'reversed' ? now : undefined,
      expiredAt: resolution === 'expired' ? now : undefined,
    });
  }
  async createAppeal(input: typeof discordModerationAppealsTable.$inferInsert) {
    const [row] = await this.database
      .insert(discordModerationAppealsTable)
      .values(input)
      .returning();
    if (!row) throw new Error('Failed to create Discord moderation appeal.');
    return row;
  }
  async resolveAppeal(
    id: string,
    status: 'approved' | 'denied' | 'withdrawn',
    reviewerAccountId?: string,
    responseCiphertext?: string,
  ) {
    const now = new Date();
    const [row] = await this.database
      .update(discordModerationAppealsTable)
      .set({
        status,
        reviewerAccountId,
        responseCiphertext,
        reviewedAt: status === 'withdrawn' ? undefined : now,
        closedAt: now,
      })
      .where(eq(discordModerationAppealsTable.id, id))
      .returning();
    return row ?? null;
  }
  async addEvidence(
    caseId: string,
    input: Omit<typeof discordModerationEvidenceTable.$inferInsert, 'caseId'>,
  ) {
    const [row] = await this.database
      .insert(discordModerationEvidenceTable)
      .values({ ...input, caseId })
      .returning();
    if (!row) throw new Error('Failed to add Discord moderation evidence.');
    return row;
  }
  async recordRaidIncident(
    input: typeof discordRaidIncidentsTable.$inferInsert,
  ) {
    const [row] = await this.database
      .insert(discordRaidIncidentsTable)
      .values(input)
      .returning();
    if (!row) throw new Error('Failed to record Discord raid incident.');
    return row;
  }
}
