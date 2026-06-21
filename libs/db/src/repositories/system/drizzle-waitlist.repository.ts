// libs/db/src/repositories/system/drizzle-waitlist.repository.ts

import { and, eq, isNull } from 'drizzle-orm';

import type {
  JoinWaitlistContract,
  WaitlistContract,
} from '@aerealith-ai/core';

import type { DatabaseClient } from '../../client';
import {
  type WaitlistRow,
  waitlistTable,
} from '../../schema';

/**
 * Drizzle persistence for public waitlist entries.
 *
 * Email normalization and validation happen in core before this repository
 * receives the input.
 */
export class DrizzleWaitlistRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findByEmail(email: string): Promise<WaitlistContract | null> {
    const [row] = await this.database
      .select()
      .from(waitlistTable)
      .where(
        and(
          eq(waitlistTable.email, email),
          isNull(waitlistTable.deletedAt),
        ),
      )
      .limit(1);

    return row ? toWaitlistContract(row) : null;
  }

  async create(
    input: JoinWaitlistContract,
  ): Promise<WaitlistContract> {
    const [row] = await this.database
      .insert(waitlistTable)
      .values({
        email: input.email,
      })
      .returning();

    if (!row) {
      throw new Error('Failed to create waitlist entry.');
    }

    return toWaitlistContract(row);
  }

  async softDeleteByEmail(email: string): Promise<boolean> {
    const [row] = await this.database
      .update(waitlistTable)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(waitlistTable.email, email),
          isNull(waitlistTable.deletedAt),
        ),
      )
      .returning({
        id: waitlistTable.id,
      });

    return row !== undefined;
  }
}

function toWaitlistContract(row: WaitlistRow): WaitlistContract {
  return {
    id: row.id,
    email: row.email,
    createdAt: row.createdAt.toISOString(),
  };
}
