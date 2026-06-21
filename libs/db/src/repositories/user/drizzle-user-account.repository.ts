// libs/db/src/repositories/user/drizzle-user-account.repository.ts

import { and, eq, isNull } from 'drizzle-orm';

import type {
  UserAccountContract,
  UserAccountStatus,
} from '@aerealith-ai/core';

import type { DatabaseClient } from '../../client';
import {
  type NewUserAccountRow,
  type UserAccountRow,
  userAccountsTable,
} from '../../schema';

export type CreateUserAccountInput = {
  userId: string;
  provider: string;
  accountId: string;
  displayName: string;
  managementUrl?: string | null;
  status?: UserAccountStatus;
  connectedAt?: Date;
};

export type UpdateUserAccountInput = {
  displayName?: string;
  managementUrl?: string | null;
  status?: UserAccountStatus;
};

/**
 * Drizzle persistence for accounts linked to an Aerealith user.
 *
 * Provider account IDs are only used for internal lookups and are never
 * included in returned account contracts.
 */
export class DrizzleUserAccountRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findById(id: string): Promise<UserAccountContract | null> {
    const [row] = await this.database
      .select()
      .from(userAccountsTable)
      .where(
        and(
          eq(userAccountsTable.id, id),
          isNull(userAccountsTable.deletedAt),
        ),
      )
      .limit(1);

    return row ? toUserAccountContract(row) : null;
  }

  async findByProviderAccount(
    provider: string,
    accountId: string,
  ): Promise<UserAccountContract | null> {
    const [row] = await this.database
      .select()
      .from(userAccountsTable)
      .where(
        and(
          eq(userAccountsTable.provider, normalizeProvider(provider)),
          eq(userAccountsTable.accountId, accountId.trim()),
          isNull(userAccountsTable.deletedAt),
        ),
      )
      .limit(1);

    return row ? toUserAccountContract(row) : null;
  }

  async findAllByUserId(userId: string): Promise<UserAccountContract[]> {
    const rows = await this.database
      .select()
      .from(userAccountsTable)
      .where(
        and(
          eq(userAccountsTable.userId, userId),
          isNull(userAccountsTable.deletedAt),
        ),
      );

    return rows.map(toUserAccountContract);
  }

  async create(
    input: CreateUserAccountInput,
  ): Promise<UserAccountContract> {
    const [row] = await this.database
      .insert(userAccountsTable)
      .values(toNewUserAccountRow(input))
      .returning();

    if (!row) {
      throw new Error('Failed to create user account.');
    }

    return toUserAccountContract(row);
  }

  async update(
    id: string,
    input: UpdateUserAccountInput,
  ): Promise<UserAccountContract | null> {
    const values = createUpdateValues(input);

    if (Object.keys(values).length === 0) {
      return this.findById(id);
    }

    const [row] = await this.database
      .update(userAccountsTable)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userAccountsTable.id, id),
          isNull(userAccountsTable.deletedAt),
        ),
      )
      .returning();

    return row ? toUserAccountContract(row) : null;
  }

  async softDelete(id: string): Promise<boolean> {
    const [row] = await this.database
      .update(userAccountsTable)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userAccountsTable.id, id),
          isNull(userAccountsTable.deletedAt),
        ),
      )
      .returning({
        id: userAccountsTable.id,
      });

    return row !== undefined;
  }
}

function toNewUserAccountRow(
  input: CreateUserAccountInput,
): NewUserAccountRow {
  return {
    userId: input.userId.trim(),
    provider: normalizeProvider(input.provider),
    accountId: input.accountId.trim(),
    displayName: input.displayName.trim(),
    managementUrl: normalizeOptionalString(input.managementUrl),
    status: input.status ?? 'active',
    connectedAt: input.connectedAt ?? new Date(),
  };
}

function createUpdateValues(
  input: UpdateUserAccountInput,
): Partial<NewUserAccountRow> {
  const values: Partial<NewUserAccountRow> = {};

  if (input.displayName !== undefined) {
    values.displayName = input.displayName.trim();
  }

  if (input.managementUrl !== undefined) {
    values.managementUrl = normalizeOptionalString(input.managementUrl);
  }

  if (input.status !== undefined) {
    values.status = input.status;
  }

  return values;
}

function toUserAccountContract(
  row: UserAccountRow,
): UserAccountContract {
  return {
    id: row.id,
    provider: row.provider,
    displayName: row.displayName,
    managementUrl: row.managementUrl,
    status: row.status,
    connectedAt: row.connectedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function normalizeProvider(provider: string): string {
  return provider.trim().toLowerCase();
}

function normalizeOptionalString(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim();

  return normalized || null;
}
