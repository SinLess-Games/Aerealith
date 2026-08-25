import { and, eq, isNull } from 'drizzle-orm';

import type {
  NewsletterRecipientContract,
  SubscribeNewsletterContract,
} from '@aerealith-ai/core';

import type { DatabaseClient } from '../../client';
import {
  newsletterRecipientsTable,
  type NewsletterRecipientRow,
} from '../../schema';

/** Drizzle persistence for explicitly opted-in newsletter recipients. */
export class DrizzleNewsletterRecipientRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findByEmail(
    email: string,
  ): Promise<NewsletterRecipientContract | null> {
    const [row] = await this.database
      .select()
      .from(newsletterRecipientsTable)
      .where(
        and(
          eq(newsletterRecipientsTable.email, email.trim().toLowerCase()),
          isNull(newsletterRecipientsTable.deletedAt),
        ),
      )
      .limit(1);

    return row ? toContract(row) : null;
  }

  async subscribe(
    input: SubscribeNewsletterContract,
  ): Promise<NewsletterRecipientContract> {
    const now = new Date();
    const email = input.email.trim().toLowerCase();
    const [row] = await this.database
      .insert(newsletterRecipientsTable)
      .values({
        email,
        source: input.source?.trim() || 'waitlist',
        subscribedAt: now,
      })
      .onConflictDoUpdate({
        target: newsletterRecipientsTable.email,
        set: {
          source: input.source?.trim() || 'waitlist',
          subscribedAt: now,
          updatedAt: now,
          deletedAt: null,
        },
      })
      .returning();

    if (!row) throw new Error('Failed to subscribe newsletter recipient.');
    return toContract(row);
  }

  async unsubscribe(email: string): Promise<boolean> {
    const now = new Date();
    const [row] = await this.database
      .update(newsletterRecipientsTable)
      .set({ deletedAt: now, updatedAt: now })
      .where(
        and(
          eq(newsletterRecipientsTable.email, email.trim().toLowerCase()),
          isNull(newsletterRecipientsTable.deletedAt),
        ),
      )
      .returning({ id: newsletterRecipientsTable.id });

    return row !== undefined;
  }
}

function toContract(row: NewsletterRecipientRow): NewsletterRecipientContract {
  return {
    id: row.id,
    email: row.email,
    source: row.source,
    subscribedAt: row.subscribedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}
