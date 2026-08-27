import { eq } from 'drizzle-orm';
import type { DatabaseClient } from '../../client';
import type { DiscordAgeVerificationStatus } from '../../enums/discord';
import {
  discordAgeVerificationEventsTable,
  discordAgeVerificationsTable,
  discordMessagesTable,
  discordProxiedMessagesTable,
} from '../../schema';
import { withTransaction } from '../with-transaction';

export async function createDiscordPersonaProxyTransaction(
  database: DatabaseClient,
  input: {
    message?: typeof discordMessagesTable.$inferInsert;
    proxy: Omit<
      typeof discordProxiedMessagesTable.$inferInsert,
      'resultingMessageId'
    >;
  },
) {
  return withTransaction(database, async (tx) => {
    const [message] = input.message
      ? await tx
          .insert(discordMessagesTable)
          .values(input.message)
          .onConflictDoUpdate({
            target: discordMessagesTable.discordMessageId,
            set: input.message,
          })
          .returning()
      : [undefined];
    const [proxy] = await tx
      .insert(discordProxiedMessagesTable)
      .values({ ...input.proxy, resultingMessageId: message?.id ?? null })
      .onConflictDoUpdate({
        target: discordProxiedMessagesTable.resultingDiscordMessageId,
        set: {
          ...input.proxy,
          resultingMessageId: message?.id ?? null,
          deletedAt: null,
        },
      })
      .returning();
    if (!proxy)
      throw new Error('Failed to store Discord persona proxy mapping.');
    return { message: message ?? null, proxy };
  });
}

export async function transitionDiscordAgeVerificationTransaction(
  database: DatabaseClient,
  input: {
    verificationId: string;
    nextStatus: DiscordAgeVerificationStatus;
    is18Plus?: boolean;
    method?: typeof discordAgeVerificationsTable.$inferSelect.method;
    actorUserId?: string;
    reasonCode?: string;
    verifiedAt?: Date;
    expiresAt?: Date | null;
    rejectionReasonCode?: string;
    manualReviewState?: string;
  },
) {
  return withTransaction(database, async (tx) => {
    const existing = await tx
      .select()
      .from(discordAgeVerificationsTable)
      .where(eq(discordAgeVerificationsTable.id, input.verificationId))
      .limit(1)
      .then((rows) => rows[0]);
    if (!existing) return null;
    const verifiedAt =
      input.nextStatus === 'verified' ? (input.verifiedAt ?? new Date()) : null;
    if (input.nextStatus === 'verified' && !(input.method ?? existing.method))
      throw new Error('Verified age state requires a verification method.');
    const [verification] = await tx
      .update(discordAgeVerificationsTable)
      .set({
        status: input.nextStatus,
        is18Plus: input.nextStatus === 'verified' && (input.is18Plus ?? true),
        method: input.method,
        verifiedAt,
        expiresAt: input.expiresAt,
        rejectionReasonCode: input.rejectionReasonCode,
        manualReviewState: input.manualReviewState,
        updatedAt: new Date(),
      })
      .where(eq(discordAgeVerificationsTable.id, input.verificationId))
      .returning();
    if (!verification) return null;
    const [event] = await tx
      .insert(discordAgeVerificationEventsTable)
      .values({
        verificationId: input.verificationId,
        previousStatus: existing.status,
        nextStatus: input.nextStatus,
        actorUserId: input.actorUserId,
        reasonCode: input.reasonCode,
      })
      .returning();
    return { verification, event: event ?? null };
  });
}
