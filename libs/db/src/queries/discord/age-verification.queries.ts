import { asc, eq } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import {
  discordAgeVerificationEventsTable,
  discordAgeVerificationsTable,
} from '../../schema';

export async function getDiscordAgeVerificationByAccount(
  database: DatabaseClient,
  discordAccountId: string,
) {
  const [row] = await database
    .select({
      id: discordAgeVerificationsTable.id,
      discordAccountId: discordAgeVerificationsTable.discordAccountId,
      status: discordAgeVerificationsTable.status,
      is18Plus: discordAgeVerificationsTable.is18Plus,
      method: discordAgeVerificationsTable.method,
      provider: discordAgeVerificationsTable.provider,
      attemptCount: discordAgeVerificationsTable.attemptCount,
      rejectionReasonCode: discordAgeVerificationsTable.rejectionReasonCode,
      manualReviewState: discordAgeVerificationsTable.manualReviewState,
      verifiedAt: discordAgeVerificationsTable.verifiedAt,
      expiresAt: discordAgeVerificationsTable.expiresAt,
      purgedAt: discordAgeVerificationsTable.purgedAt,
      createdAt: discordAgeVerificationsTable.createdAt,
      updatedAt: discordAgeVerificationsTable.updatedAt,
    })
    .from(discordAgeVerificationsTable)
    .where(eq(discordAgeVerificationsTable.discordAccountId, discordAccountId))
    .limit(1);
  if (!row) return null;
  return {
    ...row,
    valid18Plus:
      row.status === 'verified' &&
      row.is18Plus &&
      (!row.expiresAt || row.expiresAt > new Date()),
  };
}
export async function getDiscordAgeVerificationAuditHistory(
  database: DatabaseClient,
  verificationId: string,
) {
  return database
    .select()
    .from(discordAgeVerificationEventsTable)
    .where(eq(discordAgeVerificationEventsTable.verificationId, verificationId))
    .orderBy(asc(discordAgeVerificationEventsTable.createdAt));
}
