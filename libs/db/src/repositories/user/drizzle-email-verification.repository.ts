import { and, eq, gt, isNull } from 'drizzle-orm';

import type { DatabaseClient } from '../../client';
import {
  type UserEmailVerificationTokenRow,
  userEmailVerificationTokensTable,
} from '../../schema';

export class DrizzleEmailVerificationRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public async create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<UserEmailVerificationTokenRow> {
    const [row] = await this.database
      .insert(userEmailVerificationTokensTable)
      .values(input)
      .returning();

    if (!row) throw new Error('Failed to create email verification token.');
    return row;
  }

  public async findActiveByHash(
    tokenHash: string,
    now = new Date(),
  ): Promise<UserEmailVerificationTokenRow | null> {
    const [row] = await this.database
      .select()
      .from(userEmailVerificationTokensTable)
      .where(
        and(
          eq(userEmailVerificationTokensTable.tokenHash, tokenHash),
          isNull(userEmailVerificationTokensTable.consumedAt),
          gt(userEmailVerificationTokensTable.expiresAt, now),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  public async consume(id: string, now = new Date()): Promise<boolean> {
    const [row] = await this.database
      .update(userEmailVerificationTokensTable)
      .set({ consumedAt: now })
      .where(
        and(
          eq(userEmailVerificationTokensTable.id, id),
          isNull(userEmailVerificationTokensTable.consumedAt),
        ),
      )
      .returning({ id: userEmailVerificationTokensTable.id });

    return row !== undefined;
  }

  public async consumeAllForUser(
    userId: string,
    now = new Date(),
  ): Promise<void> {
    await this.database
      .update(userEmailVerificationTokensTable)
      .set({ consumedAt: now })
      .where(
        and(
          eq(userEmailVerificationTokensTable.userId, userId),
          isNull(userEmailVerificationTokensTable.consumedAt),
        ),
      );
  }
}
