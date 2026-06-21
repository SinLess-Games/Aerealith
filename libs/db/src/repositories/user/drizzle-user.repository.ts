// libs/db/src/repositories/user/drizzle-user.repository.ts

import { and, eq, isNull } from 'drizzle-orm';

import {
  UserEntity,
  type UserContract,
  type UserLifecycleStatus,
  type UserRole,
  type UserTier,
} from '@aerealith-ai/core';

import type { DatabaseClient } from '../../client';
import {
  usersTable,
  type NewUserRow,
  type UserRow,
} from '../../schema';

export type CreateUserInput = {
  username: string;
  email: string;
  passwordHash?: string | null;

  status?: UserLifecycleStatus;
  emailVerified?: boolean;
  emailVerifiedAt?: Date | null;

  role?: UserRole;
  tier?: UserTier;

  metadata?: Record<string, unknown>;
};

export type UpdateUserInput = {
  username?: string;
  email?: string;
  metadata?: Record<string, unknown>;
};

export type UpdateUserAdminInput = {
  status?: UserLifecycleStatus;
  role?: UserRole;
  tier?: UserTier;
};

/**
 * Drizzle persistence for primary user accounts.
 *
 * Public methods return UserContract.
 * Internal authentication methods return UserEntity because authentication
 * requires access to the stored password hash.
 */
export class DrizzleUserRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findById(id: string): Promise<UserContract | null> {
    const row = await this.findRowById(id);

    return row ? toUserContract(row) : null;
  }

  async findByEmail(email: string): Promise<UserContract | null> {
    const row = await this.findRowByEmail(email);

    return row ? toUserContract(row) : null;
  }

  async findByUsername(username: string): Promise<UserContract | null> {
    const row = await this.findRowByUsername(username);

    return row ? toUserContract(row) : null;
  }

  /**
   * Finds the complete user entity for internal authentication flows.
   *
   * Never return this value directly from an API route because it includes
   * the password hash.
   */
  async findEntityById(id: string): Promise<UserEntity | null> {
    const row = await this.findRowById(id);

    return row ? toUserEntity(row) : null;
  }

  /**
   * Finds the complete user entity for internal login flows.
   *
   * Never return this value directly from an API route because it includes
   * the password hash.
   */
  async findEntityByEmail(email: string): Promise<UserEntity | null> {
    const row = await this.findRowByEmail(email);

    return row ? toUserEntity(row) : null;
  }

  /**
   * Finds the complete user entity for internal login flows.
   *
   * Never return this value directly from an API route because it includes
   * the password hash.
   */
  async findEntityByUsername(
    username: string,
  ): Promise<UserEntity | null> {
    const row = await this.findRowByUsername(username);

    return row ? toUserEntity(row) : null;
  }

  async create(input: CreateUserInput): Promise<UserContract> {
    const [row] = await this.database
      .insert(usersTable)
      .values(toNewUserRow(input))
      .returning();

    if (!row) {
      throw new Error('Failed to create user.');
    }

    return toUserContract(row);
  }

  /**
   * Updates normal self-service user account fields.
   *
   * Password changes, email verification, roles, and tiers use dedicated
   * methods so those paths stay explicit and protected.
   */
  async update(
    id: string,
    input: UpdateUserInput,
  ): Promise<UserContract | null> {
    const values = createUserUpdateValues(input);

    if (Object.keys(values).length === 0) {
      return this.findById(id);
    }

    const [row] = await this.database
      .update(usersTable)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(usersTable.id, id),
          isNull(usersTable.deletedAt),
        ),
      )
      .returning();

    return row ? toUserContract(row) : null;
  }

  /**
   * Updates protected administrative account fields.
   */
  async updateAdmin(
    id: string,
    input: UpdateUserAdminInput,
  ): Promise<UserContract | null> {
    const values = createAdminUpdateValues(input);

    if (Object.keys(values).length === 0) {
      return this.findById(id);
    }

    const [row] = await this.database
      .update(usersTable)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(usersTable.id, id),
          isNull(usersTable.deletedAt),
        ),
      )
      .returning();

    return row ? toUserContract(row) : null;
  }

  /**
   * Replaces the stored password hash.
   *
   * Password hashing must happen before this repository is called.
   */
  async setPasswordHash(
    id: string,
    passwordHash: string | null,
  ): Promise<boolean> {
    const [row] = await this.database
      .update(usersTable)
      .set({
        passwordHash: passwordHash?.trim() || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(usersTable.id, id),
          isNull(usersTable.deletedAt),
        ),
      )
      .returning({
        id: usersTable.id,
      });

    return row !== undefined;
  }

  async markEmailVerified(
    id: string,
    verifiedAt: Date = new Date(),
  ): Promise<UserContract | null> {
    const [row] = await this.database
      .update(usersTable)
      .set({
        emailVerified: true,
        emailVerifiedAt: verifiedAt,
        updatedAt: verifiedAt,
      })
      .where(
        and(
          eq(usersTable.id, id),
          isNull(usersTable.deletedAt),
        ),
      )
      .returning();

    return row ? toUserContract(row) : null;
  }

  async clearEmailVerification(id: string): Promise<UserContract | null> {
    const [row] = await this.database
      .update(usersTable)
      .set({
        emailVerified: false,
        emailVerifiedAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(usersTable.id, id),
          isNull(usersTable.deletedAt),
        ),
      )
      .returning();

    return row ? toUserContract(row) : null;
  }

  async softDelete(id: string): Promise<boolean> {
    const now = new Date();

    const [row] = await this.database
      .update(usersTable)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(usersTable.id, id),
          isNull(usersTable.deletedAt),
        ),
      )
      .returning({
        id: usersTable.id,
      });

    return row !== undefined;
  }

  private async findRowById(id: string): Promise<UserRow | null> {
    const [row] = await this.database
      .select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.id, id),
          isNull(usersTable.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  private async findRowByEmail(email: string): Promise<UserRow | null> {
    const [row] = await this.database
      .select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.email, normalizeEmail(email)),
          isNull(usersTable.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  private async findRowByUsername(
    username: string,
  ): Promise<UserRow | null> {
    const [row] = await this.database
      .select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.username, normalizeUsername(username)),
          isNull(usersTable.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }
}

function toNewUserRow(input: CreateUserInput): NewUserRow {
  const emailVerified = input.emailVerified ?? false;

  return {
    username: normalizeUsername(input.username),
    email: normalizeEmail(input.email),
    passwordHash: input.passwordHash?.trim() || null,

    status: input.status,

    emailVerified,
    emailVerifiedAt: emailVerified
      ? input.emailVerifiedAt ?? new Date()
      : null,

    role: input.role,
    tier: input.tier,

    metadata: input.metadata ?? {},
  };
}

function createUserUpdateValues(
  input: UpdateUserInput,
): Partial<NewUserRow> {
  const values: Partial<NewUserRow> = {};

  if (input.username !== undefined) {
    values.username = normalizeUsername(input.username);
  }

  if (input.email !== undefined) {
    values.email = normalizeEmail(input.email);
  }

  if (input.metadata !== undefined) {
    values.metadata = input.metadata;
  }

  return values;
}

function createAdminUpdateValues(
  input: UpdateUserAdminInput,
): Partial<NewUserRow> {
  const values: Partial<NewUserRow> = {};

  if (input.status !== undefined) {
    values.status = input.status;
  }

  if (input.role !== undefined) {
    values.role = input.role;
  }

  if (input.tier !== undefined) {
    values.tier = input.tier;
  }

  return values;
}

function toUserEntity(row: UserRow): UserEntity {
  return new UserEntity({
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.passwordHash,

    status: row.status as UserLifecycleStatus,
    emailVerified: row.emailVerified,
    emailVerifiedAt: row.emailVerifiedAt,

    role: row.role as UserRole,
    tier: row.tier as UserTier,

    metadata: row.metadata,

    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  });
}

function toUserContract(row: UserRow): UserContract {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    emailVerified: row.emailVerified,
    status: row.status as UserLifecycleStatus,
    role: row.role as UserRole,
    tier: row.tier as UserTier,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
