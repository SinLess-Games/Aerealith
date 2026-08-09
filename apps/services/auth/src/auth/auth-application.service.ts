import {
  type AdminDashboardOverview,
  type AccountDetails,
  type UpdateAccountRequest,
  type AuthUser,
  type LoginRequest,
  type SignUpRequest,
  type UserContract,
} from '@aerealith-ai/core';
import {
  AuthEvent,
  PasswordAuthenticationService,
  PasswordPolicy,
  SessionService,
  type PasswordHasher,
  type AuthEventPublisher,
} from '@aerealith-ai/auth';
import {
  DrizzleUserRepository,
  DrizzleUserSessionRepository,
  DrizzleEmailVerificationRepository,
  DrizzlePasswordResetTokenRepository,
  schema,
  type DatabaseClient,
} from '@aerealith-ai/db';
import {
  and,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  isNull,
  or,
  sql,
} from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';

import { CryptoPasswordHasher } from './crypto-password-hasher';
import { CryptoTokenGenerator } from './crypto-token-generator';
import type {
  EmailVerificationSender,
  PasswordResetSender,
} from './resend-email-verification.sender';

export const AuthSessionCookie = 'aerealith_session';

export type AuthResult = {
  user: AuthUser;
  sessionToken: string;
};

export type AdminEntityType = 'users' | 'sessions';
export type AuthSessionSummary = {
  id: string;
  current: boolean;
  deviceName: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  location: string | null;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
};
export type AdminEntityRecord = Record<string, unknown> & { id: string };
export type AdminEntityPage = {
  entity: AdminEntityType;
  records: AdminEntityRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export interface AuthApplication {
  signUp(input: SignUpRequest): Promise<AuthResult>;
  login(input: LoginRequest): Promise<AuthResult>;
  currentUser(sessionToken: string | undefined): Promise<AuthUser | null>;
  logout(sessionToken: string | undefined): Promise<void>;
  verifyEmail(token: string): Promise<AuthUser>;
  resendVerification(email: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  completePasswordReset(token: string, newPassword: string): Promise<void>;
  listSessions(sessionToken: string): Promise<AuthSessionSummary[]>;
  revokeSession(sessionToken: string, sessionId: string): Promise<boolean>;
  revokeOtherSessions(sessionToken: string): Promise<number>;
  adminOverview(): Promise<AdminDashboardOverview>;
  accountDetails(userId: string): Promise<AccountDetails>;
  updateAccount(
    userId: string,
    input: UpdateAccountRequest,
  ): Promise<AccountDetails>;
  listAdminEntities(
    entity: AdminEntityType,
    search: string,
    page: number,
    pageSize: number,
  ): Promise<AdminEntityPage>;
  updateAdminEntity(
    entity: AdminEntityType,
    id: string,
    changes: Record<string, unknown>,
  ): Promise<AdminEntityRecord>;
  deleteAdminEntity(
    entity: AdminEntityType,
    id: string,
    actorId: string,
  ): Promise<void>;
}

export interface AuthApplicationOptions {
  emailSender: EmailVerificationSender;
  passwordResetSender: PasswordResetSender;
  events?: AuthEventPublisher;
  frontendUrl: string;
  verificationExpiresInHours?: number;
  now?: () => Date;
}

/**
 * One transport-independent auth use-case service shared by HTTP, GraphQL,
 * and tRPC handlers.
 */
export class AuthApplicationService implements AuthApplication {
  private readonly users: DrizzleUserRepository;
  private readonly sessions: SessionService;
  private readonly passwords: PasswordHasher;
  private readonly passwordPolicy = new PasswordPolicy();
  private readonly passwordAuthentication: PasswordAuthenticationService;
  private readonly verification: DrizzleEmailVerificationRepository;
  private readonly passwordReset: DrizzlePasswordResetTokenRepository;
  private readonly verificationExpiresInHours: number;
  private readonly now: () => Date;

  constructor(
    private readonly database: DatabaseClient,
    private readonly options: AuthApplicationOptions,
  ) {
    this.users = new DrizzleUserRepository(database);
    this.verification = new DrizzleEmailVerificationRepository(database);
    this.passwordReset = new DrizzlePasswordResetTokenRepository(database);
    this.verificationExpiresInHours = options.verificationExpiresInHours ?? 24;
    this.now = options.now ?? (() => new Date());
    this.passwords = new CryptoPasswordHasher();
    this.sessions = new SessionService(
      new DrizzleUserSessionRepository(database),
      new CryptoTokenGenerator(),
      options.events,
    );
    this.passwordAuthentication = new PasswordAuthenticationService(
      this.users,
      this.passwords,
      options.events,
      { requireVerifiedEmail: true },
    );
  }

  async signUp(input: SignUpRequest): Promise<AuthResult> {
    // Keep the use case safe when it is called by a future transport or job
    // that did not first pass through the public Zod schema.
    this.passwordPolicy.validate(input.password);
    if (
      (await this.users.findByEmail(input.email)) ||
      (await this.users.findByUsername(input.username))
    ) {
      throw new AuthApplicationError(
        'REGISTRATION_CONFLICT',
        'The account could not be registered with those details.',
        409,
      );
    }

    let user;
    try {
      user = await this.users.create({
        username: input.username,
        email: input.email,
        passwordHash: await this.passwords.hash(input.password),
        metadata: input.displayName ? { displayName: input.displayName } : {},
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AuthApplicationError(
          'REGISTRATION_CONFLICT',
          'The account could not be registered with those details.',
          409,
        );
      }
      throw error;
    }
    const issued = await this.sessions.create({ userId: user.id });
    await this.sendVerification(user);

    return { user: toAuthUser(user), sessionToken: issued.token };
  }

  async login(input: LoginRequest): Promise<AuthResult> {
    const authenticated = await this.passwordAuthentication.authenticate({
      identifier: input.usernameOrEmail,
      password: input.password,
    });
    const issued = await this.sessions.create({
      userId: authenticated.user.id,
    });

    return {
      user: toAuthUser(authenticated.user),
      sessionToken: issued.token,
    };
  }

  async currentUser(
    sessionToken: string | undefined,
  ): Promise<AuthUser | null> {
    if (!sessionToken) return null;

    const userId = await this.sessions.findUserIdByToken(sessionToken);
    if (!userId) return null;

    const user = await this.users.findById(userId);
    return user ? toAuthUser(user) : null;
  }

  async logout(sessionToken: string | undefined): Promise<void> {
    if (!sessionToken) return;

    const session = await this.sessions.findByToken(sessionToken);
    if (session) await this.sessions.revoke(session.id);
  }

  async verifyEmail(token: string): Promise<AuthUser> {
    const record = await this.verification.findActiveByHash(
      hashToken(token),
      this.now(),
    );
    if (!record) {
      throw new AuthApplicationError(
        'INVALID_VERIFICATION_TOKEN',
        'This verification link is invalid or has expired.',
        400,
      );
    }

    const user = await this.users.markEmailVerified(record.userId, this.now());
    if (!user || !(await this.verification.consume(record.id, this.now()))) {
      throw new AuthApplicationError(
        'INVALID_VERIFICATION_TOKEN',
        'This verification link has already been used.',
        400,
      );
    }
    await this.verification.consumeAllForUser(user.id, this.now());
    return toAuthUser(user);
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    // Keep this endpoint enumeration-safe.
    if (!user || user.emailVerified) return;
    await this.sendVerification(user);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.users.findEntityByEmail(email);
    if (!user || !user.passwordHash) return;
    const rawToken = randomBytes(32).toString('base64url');
    const now = this.now();
    await this.passwordReset.consumeAllForUser(user.id, now);
    await this.passwordReset.create({
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
    });
    await this.options.passwordResetSender.send({
      email: user.email,
      resetUrl: new URL(
        `/reset-password?token=${encodeURIComponent(rawToken)}`,
        this.options.frontendUrl,
      ).toString(),
      expiresInHours: 1,
    });
    await this.options.events?.publish({
      event: AuthEvent.PasswordResetRequested,
      occurredAt: now,
      userId: user.id,
    });
  }

  async completePasswordReset(
    token: string,
    newPassword: string,
  ): Promise<void> {
    this.passwordPolicy.validate(newPassword);
    const now = this.now();
    const passwordHash = await this.passwords.hash(newPassword);
    const tokenHash = hashToken(token);
    const userId = await this.database.transaction(async (transaction) => {
      const [record] = await transaction
        .update(schema.userPasswordResetTokensTable)
        .set({ consumedAt: now })
        .where(
          and(
            eq(schema.userPasswordResetTokensTable.tokenHash, tokenHash),
            isNull(schema.userPasswordResetTokensTable.consumedAt),
            gt(schema.userPasswordResetTokensTable.expiresAt, now),
          ),
        )
        .returning({ userId: schema.userPasswordResetTokensTable.userId });
      if (!record) return null;
      await transaction
        .update(schema.usersTable)
        .set({ passwordHash, updatedAt: now })
        .where(eq(schema.usersTable.id, record.userId));
      await transaction
        .update(schema.userPasswordResetTokensTable)
        .set({ consumedAt: now })
        .where(
          and(
            eq(schema.userPasswordResetTokensTable.userId, record.userId),
            isNull(schema.userPasswordResetTokensTable.consumedAt),
          ),
        );
      return record.userId;
    });
    if (!userId) {
      throw new AuthApplicationError(
        'INVALID_RESET_TOKEN',
        'This password reset link is invalid or has expired.',
        400,
      );
    }
    await this.sessions.revokeAllForUser(userId);
    await this.options.events?.publish({
      event: AuthEvent.PasswordResetCompleted,
      occurredAt: now,
      userId,
    });
  }

  async listSessions(sessionToken: string): Promise<AuthSessionSummary[]> {
    const current = await this.sessions.findByToken(sessionToken);
    if (!current) return [];
    const userId = await this.sessions.findUserIdByToken(sessionToken);
    if (!userId) return [];
    return (await this.sessions.listForUser(userId)).map((session) => ({
      id: session.id,
      current: session.id === current.id,
      deviceName: session.deviceName,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      location: null,
      createdAt: session.createdAt,
      lastActiveAt: session.lastSeenAt ?? session.createdAt,
      expiresAt: session.expiresAt,
    }));
  }

  async revokeSession(
    sessionToken: string,
    sessionId: string,
  ): Promise<boolean> {
    const userId = await this.sessions.findUserIdByToken(sessionToken);
    return (
      !!userId &&
      (await this.sessions.listForUser(userId)).some(
        (item) => item.id === sessionId,
      ) &&
      this.sessions.revoke(sessionId)
    );
  }

  async revokeOtherSessions(sessionToken: string): Promise<number> {
    const userId = await this.sessions.findUserIdByToken(sessionToken);
    const current = await this.sessions.findByToken(sessionToken);
    return userId && current
      ? this.sessions.revokeAllForUser(userId, current.id)
      : 0;
  }

  async adminOverview(): Promise<AdminDashboardOverview> {
    const now = this.now();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [
      [totalUsers],
      [verifiedUsers],
      [activeSessions],
      [newUsers],
      [superAdmins],
    ] = await Promise.all([
      this.database
        .select({ value: count() })
        .from(schema.usersTable)
        .where(isNull(schema.usersTable.deletedAt)),
      this.database
        .select({ value: count() })
        .from(schema.usersTable)
        .where(
          and(
            isNull(schema.usersTable.deletedAt),
            eq(schema.usersTable.emailVerified, true),
          ),
        ),
      this.database
        .select({ value: count() })
        .from(schema.userSessionsTable)
        .where(
          and(
            isNull(schema.userSessionsTable.deletedAt),
            isNull(schema.userSessionsTable.revokedAt),
            gt(schema.userSessionsTable.expiresAt, now),
          ),
        ),
      this.database
        .select({ value: count() })
        .from(schema.usersTable)
        .where(
          and(
            isNull(schema.usersTable.deletedAt),
            gte(schema.usersTable.createdAt, sevenDaysAgo),
          ),
        ),
      this.database
        .select({ value: count() })
        .from(schema.usersTable)
        .where(
          and(
            isNull(schema.usersTable.deletedAt),
            eq(schema.usersTable.role, 'super_admin'),
          ),
        ),
    ]);
    return {
      totalUsers: totalUsers?.value ?? 0,
      verifiedUsers: verifiedUsers?.value ?? 0,
      activeSessions: activeSessions?.value ?? 0,
      newUsersLast7Days: newUsers?.value ?? 0,
      superAdmins: superAdmins?.value ?? 0,
      generatedAt: now.toISOString(),
    };
  }

  async accountDetails(userId: string): Promise<AccountDetails> {
    const [user, profile, preferences] = await Promise.all([
      this.users.findById(userId),
      this.database
        .select({ avatarUrl: schema.userProfilesTable.avatarUrl })
        .from(schema.userProfilesTable)
        .where(
          and(
            eq(schema.userProfilesTable.userId, userId),
            isNull(schema.userProfilesTable.deletedAt),
          ),
        )
        .limit(1),
      this.database
        .select({
          timezone: schema.userPreferencesTable.timezone,
          locale: schema.userPreferencesTable.locale,
        })
        .from(schema.userPreferencesTable)
        .where(
          and(
            eq(schema.userPreferencesTable.userId, userId),
            isNull(schema.userPreferencesTable.deletedAt),
          ),
        )
        .limit(1),
    ]);
    if (!user)
      throw new AuthApplicationError('NOT_FOUND', 'Account not found.', 404);
    return {
      user: toAuthUser(user),
      avatarUrl: profile[0]?.avatarUrl ?? null,
      timezone: preferences[0]?.timezone ?? null,
      locale: preferences[0]?.locale ?? null,
    };
  }

  async updateAccount(
    userId: string,
    input: UpdateAccountRequest,
  ): Promise<AccountDetails> {
    const existing = await this.users.findById(userId);
    if (!existing)
      throw new AuthApplicationError('NOT_FOUND', 'Account not found.', 404);

    const now = this.now();
    const email = input.email.trim().toLowerCase();
    const emailChanged = email !== existing.email;
    await this.database.transaction(async (transaction) => {
      await transaction
        .update(schema.usersTable)
        .set({
          username: input.username.trim(),
          email,
          ...(emailChanged
            ? { emailVerified: false, emailVerifiedAt: null }
            : {}),
          updatedAt: now,
        })
        .where(
          and(
            eq(schema.usersTable.id, userId),
            isNull(schema.usersTable.deletedAt),
          ),
        );
      await transaction
        .insert(schema.userProfilesTable)
        .values({
          userId,
          handle: input.username.trim(),
          avatarUrl: input.avatarUrl ?? null,
        })
        .onConflictDoUpdate({
          target: schema.userProfilesTable.userId,
          set: {
            handle: input.username.trim(),
            avatarUrl: input.avatarUrl ?? null,
            updatedAt: now,
            deletedAt: null,
          },
        });
      await transaction
        .insert(schema.userPreferencesTable)
        .values({
          userId,
          timezone: input.timezone ?? null,
          locale: input.locale ?? null,
        })
        .onConflictDoUpdate({
          target: schema.userPreferencesTable.userId,
          set: {
            timezone: input.timezone ?? null,
            locale: input.locale ?? null,
            updatedAt: now,
            deletedAt: null,
          },
        });
    });
    const details = await this.accountDetails(userId);
    if (emailChanged) {
      // An email address is an authentication identity. Existing credentials
      // must not continue to assert verification for a replacement address.
      await this.sessions.revokeAllForUser(userId);
      const user = await this.users.findById(userId);
      if (!user)
        throw new AuthApplicationError('NOT_FOUND', 'Account not found.', 404);
      await this.sendVerification(user);
    }
    return details;
  }

  async listAdminEntities(
    entity: AdminEntityType,
    search: string,
    page: number,
    pageSize: number,
  ): Promise<AdminEntityPage> {
    const offset = (page - 1) * pageSize;
    if (entity === 'users') {
      const searchFilter = search
        ? or(
            ilike(schema.usersTable.username, `%${search}%`),
            ilike(schema.usersTable.email, `%${search}%`),
          )
        : undefined;
      const where = searchFilter
        ? and(isNull(schema.usersTable.deletedAt), searchFilter)
        : isNull(schema.usersTable.deletedAt);
      const [[aggregate], rows] = await Promise.all([
        this.database
          .select({ value: count() })
          .from(schema.usersTable)
          .where(where),
        this.database
          .select({
            id: schema.usersTable.id,
            username: schema.usersTable.username,
            email: schema.usersTable.email,
            status: schema.usersTable.status,
            emailVerified: schema.usersTable.emailVerified,
            role: schema.usersTable.role,
            tier: schema.usersTable.tier,
            metadata: schema.usersTable.metadata,
            createdAt: schema.usersTable.createdAt,
            updatedAt: schema.usersTable.updatedAt,
          })
          .from(schema.usersTable)
          .where(where)
          .orderBy(desc(schema.usersTable.createdAt))
          .limit(pageSize)
          .offset(offset),
      ]);
      return {
        entity,
        records: rows,
        total: aggregate?.value ?? 0,
        page,
        pageSize,
      };
    }

    const searchFilter = search
      ? or(
          sql`${schema.userSessionsTable.userId}::text ilike ${`%${search}%`}`,
          ilike(schema.userSessionsTable.deviceName, `%${search}%`),
          ilike(schema.userSessionsTable.ipAddress, `%${search}%`),
        )
      : undefined;
    const where = searchFilter
      ? and(isNull(schema.userSessionsTable.deletedAt), searchFilter)
      : isNull(schema.userSessionsTable.deletedAt);
    const [[aggregate], rows] = await Promise.all([
      this.database
        .select({ value: count() })
        .from(schema.userSessionsTable)
        .where(where),
      this.database
        .select({
          id: schema.userSessionsTable.id,
          userId: schema.userSessionsTable.userId,
          deviceName: schema.userSessionsTable.deviceName,
          userAgent: schema.userSessionsTable.userAgent,
          ipAddress: schema.userSessionsTable.ipAddress,
          lastSeenAt: schema.userSessionsTable.lastSeenAt,
          expiresAt: schema.userSessionsTable.expiresAt,
          revokedAt: schema.userSessionsTable.revokedAt,
          createdAt: schema.userSessionsTable.createdAt,
          updatedAt: schema.userSessionsTable.updatedAt,
        })
        .from(schema.userSessionsTable)
        .where(where)
        .orderBy(desc(schema.userSessionsTable.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);
    return {
      entity,
      records: rows,
      total: aggregate?.value ?? 0,
      page,
      pageSize,
    };
  }

  async updateAdminEntity(
    entity: AdminEntityType,
    id: string,
    changes: Record<string, unknown>,
  ): Promise<AdminEntityRecord> {
    const now = this.now();
    if (entity === 'users') {
      const existing = await this.users.findById(id);
      if (!existing) {
        throw new AuthApplicationError('NOT_FOUND', 'Entity not found.', 404);
      }
      if (await this.isPlatformOwner(id)) {
        throw new AuthApplicationError(
          'PROTECTED_OWNER_FORBIDDEN',
          'Platform owners cannot be changed through generic user administration.',
          409,
        );
      }
      const emailChanged =
        typeof changes['email'] === 'string' &&
        changes['email'] !== existing.email;
      const allowed = pickDefined(changes, [
        'username',
        'email',
        'status',
        'tier',
        'metadata',
      ]);
      if (emailChanged) allowed['emailVerified'] = false;
      const [updated] = await this.database
        .update(schema.usersTable)
        .set({ ...allowed, updatedAt: now })
        .where(
          and(
            eq(schema.usersTable.id, id),
            isNull(schema.usersTable.deletedAt),
          ),
        )
        .returning({
          id: schema.usersTable.id,
          username: schema.usersTable.username,
          email: schema.usersTable.email,
          status: schema.usersTable.status,
          emailVerified: schema.usersTable.emailVerified,
          role: schema.usersTable.role,
          tier: schema.usersTable.tier,
          metadata: schema.usersTable.metadata,
          createdAt: schema.usersTable.createdAt,
          updatedAt: schema.usersTable.updatedAt,
        });
      if (!updated)
        throw new AuthApplicationError('NOT_FOUND', 'Entity not found.', 404);
      if (emailChanged) {
        await this.sessions.revokeAllForUser(id);
        const changedUser = await this.users.findById(id);
        if (!changedUser) {
          throw new AuthApplicationError('NOT_FOUND', 'Entity not found.', 404);
        }
        await this.sendVerification(changedUser);
      }
      return updated;
    }

    const allowed = pickDefined(changes, ['deviceName', 'revokedAt']);
    const [updated] = await this.database
      .update(schema.userSessionsTable)
      .set({ ...allowed, updatedAt: now })
      .where(
        and(
          eq(schema.userSessionsTable.id, id),
          isNull(schema.userSessionsTable.deletedAt),
        ),
      )
      .returning({
        id: schema.userSessionsTable.id,
        userId: schema.userSessionsTable.userId,
        deviceName: schema.userSessionsTable.deviceName,
        userAgent: schema.userSessionsTable.userAgent,
        ipAddress: schema.userSessionsTable.ipAddress,
        lastSeenAt: schema.userSessionsTable.lastSeenAt,
        expiresAt: schema.userSessionsTable.expiresAt,
        revokedAt: schema.userSessionsTable.revokedAt,
        createdAt: schema.userSessionsTable.createdAt,
        updatedAt: schema.userSessionsTable.updatedAt,
      });
    if (!updated)
      throw new AuthApplicationError('NOT_FOUND', 'Entity not found.', 404);
    return updated;
  }

  async deleteAdminEntity(
    entity: AdminEntityType,
    id: string,
    actorId: string,
  ): Promise<void> {
    if (entity === 'users' && id === actorId) {
      throw new AuthApplicationError(
        'SELF_DELETE_FORBIDDEN',
        'You cannot delete your own administrator account.',
        409,
      );
    }
    if (entity === 'users') {
      const target = await this.users.findById(id);
      if (!target) {
        throw new AuthApplicationError('NOT_FOUND', 'Entity not found.', 404);
      }
      if (
        target.role === 'super_admin' &&
        (await this.countSuperAdmins()) <= 1
      ) {
        throw new AuthApplicationError(
          'LAST_SUPER_ADMIN_FORBIDDEN',
          'The last super administrator cannot be deleted.',
          409,
        );
      }
      if (await this.isPlatformOwner(id)) {
        throw new AuthApplicationError(
          'PROTECTED_OWNER_FORBIDDEN',
          'Platform owners cannot be deleted through generic user administration.',
          409,
        );
      }
    }
    const now = this.now();
    const table =
      entity === 'users' ? schema.usersTable : schema.userSessionsTable;
    const [deleted] = await this.database
      .update(table)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(table.id, id), isNull(table.deletedAt)))
      .returning({ id: table.id });
    if (!deleted)
      throw new AuthApplicationError('NOT_FOUND', 'Entity not found.', 404);
  }

  private async sendVerification(user: UserContract): Promise<void> {
    const rawToken = randomBytes(32).toString('base64url');
    const now = this.now();
    await this.verification.consumeAllForUser(user.id, now);
    await this.verification.create({
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(
        now.getTime() + this.verificationExpiresInHours * 60 * 60 * 1000,
      ),
    });
    const verificationUrl = new URL('/verify-email', this.options.frontendUrl);
    verificationUrl.searchParams.set('token', rawToken);
    await this.options.emailSender.send({
      email: user.email,
      ...(user.displayName ? { displayName: user.displayName } : {}),
      verificationUrl: verificationUrl.toString(),
      expiresInHours: this.verificationExpiresInHours,
    });
  }

  private async countSuperAdmins(): Promise<number> {
    const [result] = await this.database
      .select({ value: count() })
      .from(schema.usersTable)
      .where(
        and(
          eq(schema.usersTable.role, 'super_admin'),
          isNull(schema.usersTable.deletedAt),
        ),
      );
    return result?.value ?? 0;
  }

  private async isPlatformOwner(userId: string): Promise<boolean> {
    const now = this.now();
    const [assignment] = await this.database
      .select({ id: schema.principalRolesTable.id })
      .from(schema.principalRolesTable)
      .innerJoin(
        schema.rolesTable,
        eq(schema.principalRolesTable.roleId, schema.rolesTable.id),
      )
      .where(
        and(
          eq(schema.principalRolesTable.principalType, 'user'),
          eq(schema.principalRolesTable.principalId, userId),
          eq(schema.rolesTable.key, 'platform_owner'),
          eq(schema.rolesTable.enabled, true),
          isNull(schema.rolesTable.deletedAt),
          isNull(schema.principalRolesTable.revokedAt),
          or(
            isNull(schema.principalRolesTable.expiresAt),
            gt(schema.principalRolesTable.expiresAt, now),
          ),
        ),
      )
      .limit(1);
    return assignment !== undefined;
  }
}

function pickDefined(
  value: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  return Object.fromEntries(
    keys
      .filter((key) => value[key] !== undefined)
      .map((key) => [key, value[key]]),
  );
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}

export class AuthApplicationError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AuthApplicationError';
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function toAuthUser(user: UserContract): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    emailVerified: user.emailVerified,
    role: user.role,
    ...(user.displayName ? { displayName: user.displayName } : {}),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
