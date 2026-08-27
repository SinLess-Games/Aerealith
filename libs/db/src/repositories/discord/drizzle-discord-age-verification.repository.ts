import { eq } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import type { DiscordAgeVerificationStatus } from '../../enums/discord';
import {
  getDiscordAgeVerificationAuditHistory,
  getDiscordAgeVerificationByAccount,
} from '../../queries/discord';
import {
  discordAgeVerificationEventsTable,
  discordAgeVerificationsTable,
} from '../../schema';

type SafeVerificationInput = Pick<
  typeof discordAgeVerificationsTable.$inferInsert,
  | 'discordAccountId'
  | 'method'
  | 'provider'
  | 'providerReference'
  | 'evidenceObjectReference'
  | 'evidenceRetentionStatus'
  | 'documentType'
  | 'issuingCountry'
  | 'expiresAt'
>;
export class DrizzleDiscordAgeVerificationRepository {
  constructor(private readonly database: DatabaseClient) {}
  getCurrent(discordAccountId: string) {
    return getDiscordAgeVerificationByAccount(this.database, discordAccountId);
  }
  getAuditHistory(verificationId: string) {
    return getDiscordAgeVerificationAuditHistory(this.database, verificationId);
  }
  async createAttempt(input: SafeVerificationInput) {
    return this.database.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(discordAgeVerificationsTable)
        .where(
          eq(
            discordAgeVerificationsTable.discordAccountId,
            input.discordAccountId,
          ),
        )
        .limit(1)
        .then((rows) => rows[0]);
      const [verification] = existing
        ? await tx
            .update(discordAgeVerificationsTable)
            .set({
              ...input,
              status: 'pending',
              is18Plus: false,
              attemptCount: existing.attemptCount + 1,
              verifiedAt: null,
              updatedAt: new Date(),
            })
            .where(eq(discordAgeVerificationsTable.id, existing.id))
            .returning()
        : await tx
            .insert(discordAgeVerificationsTable)
            .values({
              ...input,
              status: 'pending',
              is18Plus: false,
              attemptCount: 1,
            })
            .returning();
      if (!verification)
        throw new Error('Failed to create Discord age-verification attempt.');
      await tx.insert(discordAgeVerificationEventsTable).values({
        verificationId: verification.id,
        previousStatus: existing?.status ?? null,
        nextStatus: 'pending',
      });
      return verification;
    });
  }
  async transition(
    verificationId: string,
    nextStatus: DiscordAgeVerificationStatus,
    input: {
      is18Plus?: boolean;
      actorUserId?: string;
      reasonCode?: string;
      verifiedAt?: Date;
      expiresAt?: Date | null;
      rejectionReasonCode?: string;
      manualReviewState?: string;
    },
  ) {
    return this.database.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(discordAgeVerificationsTable)
        .where(eq(discordAgeVerificationsTable.id, verificationId))
        .limit(1)
        .then((rows) => rows[0]);
      if (!existing) return null;
      const verifiedAt =
        nextStatus === 'verified' ? (input.verifiedAt ?? new Date()) : null;
      const [updated] = await tx
        .update(discordAgeVerificationsTable)
        .set({
          status: nextStatus,
          is18Plus: nextStatus === 'verified' && (input.is18Plus ?? true),
          verifiedAt,
          expiresAt: input.expiresAt,
          rejectionReasonCode: input.rejectionReasonCode,
          manualReviewState: input.manualReviewState,
          updatedAt: new Date(),
        })
        .where(eq(discordAgeVerificationsTable.id, verificationId))
        .returning();
      if (!updated) return null;
      await tx.insert(discordAgeVerificationEventsTable).values({
        verificationId,
        previousStatus: existing.status,
        nextStatus,
        actorUserId: input.actorUserId,
        reasonCode: input.reasonCode,
      });
      return updated;
    });
  }
  revoke(id: string, actorUserId?: string, reasonCode?: string) {
    return this.transition(id, 'revoked', {
      actorUserId,
      reasonCode,
      is18Plus: false,
    });
  }
  expire(id: string, reasonCode = 'expired') {
    return this.transition(id, 'expired', { reasonCode, is18Plus: false });
  }
}
