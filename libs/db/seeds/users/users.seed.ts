// libs/db/seeds/users/users.seed.ts

import { scrypt as nodeScrypt, randomBytes } from 'node:crypto';

import { and, eq } from 'drizzle-orm';

import { UserLifecycleStatus, UserRole } from '@aerealith-ai/core';

import type { DatabaseClient } from '../../src/client';

import {
  platformRoleAssignmentsTable,
  principalAuthorizationVersionsTable,
  rolesTable,
  usersTable,
} from '../../src/schema';

const DEFAULT_PLATFORM_OWNER_EMAIL = 'timothy.pierce444@gmail.com';

const DEFAULT_PLATFORM_OWNER_USERNAME = 'sinless777';

const PLATFORM_OWNER_ROLE_SCOPE = 'platform';

const PLATFORM_OWNER_ROLE_SLUG = 'platform-owner';

const PLATFORM_OWNER_PASSWORD_ENV = 'ADMIN_PASSWORD';

const PLATFORM_OWNER_EMAIL_ENV = 'ADMIN_EMAIL';

const PLATFORM_OWNER_USERNAME_ENV = 'ADMIN_USERNAME';

const SCRYPT_VERSION = 'v1';

const SCRYPT_KEY_LENGTH = 64;

const SCRYPT_SALT_LENGTH = 16;

const SCRYPT_PARAMETERS = {
  N: 16_384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
} as const;

/**
 * Seeds the bootstrap platform-owner account.
 *
 * The canonical authorization seed must run before this seed because this
 * function resolves the existing platform-owner role rather than creating
 * authorization definitions itself.
 *
 * Behavior:
 *
 * - creates the user when missing
 * - reconciles username/email when the same user already exists
 * - marks the bootstrap account active and email-verified
 * - refreshes the password hash from the explicit ADMIN_PASSWORD value
 * - maintains the legacy super_admin compatibility projection
 * - assigns the normalized platform-owner role
 * - creates an initial authorization-version record
 *
 * Password hashes intentionally use the same scrypt format as the auth
 * service's CryptoPasswordHasher:
 *
 *   scrypt$v1$N$r$p$salt$digest
 */
export async function seedUsers(database: DatabaseClient): Promise<void> {
  const identity = readPlatformOwnerIdentity();

  await database.transaction(async (transaction) => {
    const tx = transaction as DatabaseClient;

    const platformOwnerRole = await findPlatformOwnerRole(tx);

    if (!platformOwnerRole) {
      throw new Error(
        [
          'Cannot seed platform owner.',
          'The platform-owner role does not exist.',
          'Run the authorization seed before the user seed.',
        ].join(' '),
      );
    }

    const existingByEmail = await findUserByEmail(tx, identity.email);

    const existingByUsername = await findUserByUsername(tx, identity.username);

    if (
      existingByEmail &&
      existingByUsername &&
      existingByEmail.id !== existingByUsername.id
    ) {
      throw new Error(
        [
          'Cannot seed platform owner.',
          `Email "${identity.email}" and`,
          `username "${identity.username}"`,
          'belong to different users.',
        ].join(' '),
      );
    }

    const existingUser = existingByEmail ?? existingByUsername;

    const userId = existingUser
      ? await updatePlatformOwnerUser(tx, existingUser, identity)
      : await createPlatformOwnerUser(tx, identity);

    await ensurePlatformOwnerAssignment(tx, userId, platformOwnerRole.id);

    await ensureAuthorizationVersion(tx, userId);
  });
}

type ExistingUser = {
  id: string;
};

type PlatformOwnerRole = {
  id: string;
};

type PlatformOwnerIdentity = {
  email: string;
  username: string;
};

async function findPlatformOwnerRole(
  database: DatabaseClient,
): Promise<PlatformOwnerRole | null> {
  const [role] = await database
    .select({
      id: rolesTable.id,
    })
    .from(rolesTable)
    .where(
      and(
        eq(rolesTable.scope, PLATFORM_OWNER_ROLE_SCOPE),
        eq(rolesTable.slug, PLATFORM_OWNER_ROLE_SLUG),
      ),
    )
    .limit(1);

  return role ?? null;
}

async function findUserByEmail(
  database: DatabaseClient,
  email: string,
): Promise<ExistingUser | null> {
  const [user] = await database
    .select({
      id: usersTable.id,
    })
    .from(usersTable)
    .where(eq(usersTable.email, normalizeEmail(email)))
    .limit(1);

  return user ?? null;
}

async function findUserByUsername(
  database: DatabaseClient,
  username: string,
): Promise<ExistingUser | null> {
  const [user] = await database
    .select({
      id: usersTable.id,
    })
    .from(usersTable)
    .where(eq(usersTable.username, normalizeUsername(username)))
    .limit(1);

  return user ?? null;
}

async function createPlatformOwnerUser(
  database: DatabaseClient,
  identity: PlatformOwnerIdentity,
): Promise<string> {
  const password = readPlatformOwnerPassword();

  const passwordHash = await hashPassword(password);

  const now = new Date();

  const [user] = await database
    .insert(usersTable)
    .values({
      username: normalizeUsername(identity.username),

      email: normalizeEmail(identity.email),

      passwordHash,

      status: UserLifecycleStatus.Active,

      /**
       * Compatibility projection for frontend navigation and legacy
       * administrative aggregates. Normalized RBAC remains authoritative.
       */
      role: UserRole.SuperAdmin,

      emailVerified: true,
      emailVerifiedAt: now,

      metadata: {
        bootstrap: 'platform-owner',
      },
    })
    .returning({
      id: usersTable.id,
    });

  if (!user) {
    throw new Error('Failed to create platform-owner user.');
  }

  return user.id;
}

async function updatePlatformOwnerUser(
  database: DatabaseClient,
  existingUser: ExistingUser,
  identity: PlatformOwnerIdentity,
): Promise<string> {
  const now = new Date();

  /**
   * The explicitly configured bootstrap password is desired development
   * state. Refreshing it makes the idempotent seed useful for account
   * recovery when a previous compatible hash no longer matches `.env`.
   */
  const passwordHash = await hashPassword(readPlatformOwnerPassword());

  const [user] = await database
    .update(usersTable)
    .set({
      username: normalizeUsername(identity.username),

      email: normalizeEmail(identity.email),

      passwordHash,

      status: UserLifecycleStatus.Active,

      role: UserRole.SuperAdmin,

      emailVerified: true,
      emailVerifiedAt: now,

      deletedAt: null,
      updatedAt: now,
    })
    .where(eq(usersTable.id, existingUser.id))
    .returning({
      id: usersTable.id,
    });

  if (!user) {
    throw new Error('Failed to update platform-owner user.');
  }

  return user.id;
}

async function ensurePlatformOwnerAssignment(
  database: DatabaseClient,
  userId: string,
  roleId: string,
): Promise<void> {
  await database
    .insert(platformRoleAssignmentsTable)
    .values({
      userId,
      roleId,

      /**
       * This is a bootstrap assignment rather than an assignment performed by
       * an authenticated actor.
       */
      assignedByUserId: null,

      expiresAt: null,
    })
    .onConflictDoNothing();
}

async function ensureAuthorizationVersion(
  database: DatabaseClient,
  userId: string,
): Promise<void> {
  await database
    .insert(principalAuthorizationVersionsTable)
    .values({
      principalType: 'user',
      principalId: userId,
      version: 1,
    })
    .onConflictDoNothing();
}

function readPlatformOwnerPassword(): string {
  const password = process.env[PLATFORM_OWNER_PASSWORD_ENV];

  if (password === undefined || password.length < 16) {
    throw new Error(
      [
        `${PLATFORM_OWNER_PASSWORD_ENV} is required and must contain`,
        'at least 16 characters when seeding the bootstrap',
        'platform-owner user.',
      ].join(' '),
    );
  }

  return password;
}

function readPlatformOwnerIdentity(): PlatformOwnerIdentity {
  return {
    email: normalizeEmail(
      process.env[PLATFORM_OWNER_EMAIL_ENV]?.trim() ||
        DEFAULT_PLATFORM_OWNER_EMAIL,
    ),

    username: normalizeUsername(
      process.env[PLATFORM_OWNER_USERNAME_ENV]?.trim() ||
        DEFAULT_PLATFORM_OWNER_USERNAME,
    ),
  };
}

/**
 * Uses the exact encoded password format expected by:
 *
 *   apps/services/auth/src/auth/crypto-password-hasher.ts
 *
 * Format:
 *
 *   scrypt$v1$16384$8$1$<base64url-salt>$<base64url-digest>
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SCRYPT_SALT_LENGTH);

  const derived = await derivePassword(password, salt);

  return [
    'scrypt',
    SCRYPT_VERSION,
    String(SCRYPT_PARAMETERS.N),
    String(SCRYPT_PARAMETERS.r),
    String(SCRYPT_PARAMETERS.p),
    salt.toString('base64url'),
    derived.toString('base64url'),
  ].join('$');
}

function derivePassword(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(
      password,
      salt,
      SCRYPT_KEY_LENGTH,
      SCRYPT_PARAMETERS,
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      },
    );
  });
}
function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
