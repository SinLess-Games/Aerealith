import { and, eq, gt, isNull } from 'drizzle-orm';

import type { DatabaseClient } from '../../client';
import {
  type UserPasswordResetTokenRow,
  userPasswordResetTokensTable,
} from '../../schema';

export type CreatePasswordResetTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

/** Persists hashed, expiring, single-use password reset tokens. */
export class DrizzlePasswordResetTokenRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public async create(
    input: CreatePasswordResetTokenInput,
  ): Promise<UserPasswordResetTokenRow> {
    const [row] = await this.database
      .insert(userPasswordResetTokensTable)
      .values(input)
      .returning();

    if (!row) {
      throw new Error('Failed to create password reset token.');
    }

    return row;
  }

  public async findActiveByHash(
    tokenHash: string,
    now = new Date(),
  ): Promise<UserPasswordResetTokenRow | null> {
    const [row] = await this.database
      .select()
      .from(userPasswordResetTokensTable)
      .where(
        and(
          eq(userPasswordResetTokensTable.tokenHash, tokenHash),
          isNull(userPasswordResetTokensTable.consumedAt),
          gt(userPasswordResetTokensTable.expiresAt, now),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  /**
   * Atomically consumes an active token. Expiry is checked in the write so an
   * expired token cannot be consumed after a previously successful lookup.
   */
  public async consume(id: string, now = new Date()): Promise<boolean> {
    const [row] = await this.database
      .update(userPasswordResetTokensTable)
      .set({ consumedAt: now })
      .where(
        and(
          eq(userPasswordResetTokensTable.id, id),
          isNull(userPasswordResetTokensTable.consumedAt),
          gt(userPasswordResetTokensTable.expiresAt, now),
        ),
      )
      .returning({ id: userPasswordResetTokensTable.id });

    return row !== undefined;
  }

  /** Marks every remaining token for a user consumed, invalidating them. */
  public async consumeAllForUser(
    userId: string,
    now = new Date(),
  ): Promise<void> {
    await this.database
      .update(userPasswordResetTokensTable)
      .set({ consumedAt: now })
      .where(
        and(
          eq(userPasswordResetTokensTable.userId, userId),
          isNull(userPasswordResetTokensTable.consumedAt),
        ),
      );
  }
}
