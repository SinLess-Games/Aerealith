import {
  type AdminDashboardOverview,
  type AccountDetails,
  type UpdateAccountRequest,
  type AuthUser,
  type LoginRequest,
  type SignUpRequest,
  type UpdateUserProfileContract,
  type UserLifecycleStatus,
  type UserProfileContract,
  type UserContract,
  type UserTier,
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
  DrizzleUserProfileRepository,
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

import {
  getAdminEntity,
  listAdminEntityDefinitions,
  type AdminEntityDefinition,
  type RegisteredAdminEntity,
} from './admin-entity-registry';
import { CryptoPasswordHasher } from './crypto-password-hasher';
import { CryptoTokenGenerator } from './crypto-token-generator';
import { assignDefaultPlatformUserRole } from './registration-platform-role';
import type {
  EmailVerificationSender,
  PasswordResetSender,
} from './resend-email-verification.sender';

export const AuthSessionCookie = 'aerealith_session';

export type AuthResult = {
  user: AuthUser;
  sessionToken: string;
};

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
  revokedAt: string | null;
  status: 'active' | 'expired' | 'revoked';
};
export type AdminEntityRecord = Record<string, unknown> & { id: string };
export type AdminCreateEntityInput = Record<string, unknown> & {
  username?: string;
  email?: string;
  password?: string;
  displayName?: string | null;
  status?: UserLifecycleStatus;
  tier?: UserTier;
  emailVerified?: boolean;
  metadata?: Record<string, unknown>;
};
export type AdminEntityPage = {
  entity: string;
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
  profileDetails(userId: string): Promise<UserProfileContract>;
  updateProfile(
    userId: string,
    input: UpdateUserProfileContract,
  ): Promise<UserProfileContract>;
  updateAccount(
    userId: string,
    input: UpdateAccountRequest,
  ): Promise<AccountDetails>;
  listAdminEntities(
    entity: string,
    search: string,
    page: number,
    pageSize: number,
  ): Promise<AdminEntityPage>;
  adminEntityCatalog(): Promise<AdminEntityDefinition[]>;
  createAdminEntity(
    entity: string,
    input: AdminCreateEntityInput,
  ): Promise<AdminEntityRecord>;
  updateAdminEntity(
    entity: string,
    id: string,
    changes: Record<string, unknown>,
  ): Promise<AdminEntityRecord>;
  deleteAdminEntity(entity: string, id: string, actorId: string): Promise<void>;
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
  private readonly profiles: DrizzleUserProfileRepository;
  private readonly verificationExpiresInHours: number;
  private readonly now: () => Date;

  constructor(
    private readonly database: DatabaseClient,
    private readonly options: AuthApplicationOptions,
  ) {
    this.users = new DrizzleUserRepository(database);
    this.verification = new DrizzleEmailVerificationRepository(database);
    this.passwordReset = new DrizzlePasswordResetTokenRepository(database);
    this.profiles = new DrizzleUserProfileRepository(database);
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
      const passwordHash = await this.passwords.hash(input.password);
      user = await this.database.transaction(async (transaction) => {
        const database = transaction as DatabaseClient;
        const created = await new DrizzleUserRepository(database).create({
          username: input.username,
          email: input.email,
          passwordHash,
          metadata: input.displayName ? { displayName: input.displayName } : {},
        });
        await assignDefaultPlatformUserRole(database, created.id);
        return created;
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

    const user = await this.users.findAuthenticationEligibleById(userId);
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
    if (!user?.passwordHash) return;
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
    return (await this.sessions.listHistoryForUser(userId)).map((session) => ({
      id: session.id,
      current: session.id === current.id,
      deviceName: session.deviceName,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      location: null,
      createdAt: session.createdAt,
      lastActiveAt: session.lastSeenAt ?? session.createdAt,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      status: session.revokedAt
        ? 'revoked'
        : new Date(session.expiresAt) <= this.now()
          ? 'expired'
          : 'active',
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
            // The admin aggregate intentionally reports the legacy compatibility
            // projection until all clients consume normalized role assignments.
            eq(schema.usersTable.role, 'super_admin'), // NOSONAR
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
    const username = input.username.trim().toLowerCase();
    const email = input.email.trim().toLowerCase();
    const emailChanged = email !== existing.email;
    const [usernameOwner, emailOwner] = await Promise.all([
      this.users.findByUsername(username),
      this.users.findByEmail(email),
    ]);
    if (
      (usernameOwner && usernameOwner.id !== userId) ||
      (emailOwner && emailOwner.id !== userId)
    ) {
      throw new AuthApplicationError(
        'ACCOUNT_IDENTITY_CONFLICT',
        'That username or email address is already in use.',
        409,
      );
    }

    if (input.avatarUrl !== undefined) {
      await this.profileDetails(userId);
    }

    try {
      await this.database.transaction(async (transaction) => {
        await transaction
          .update(schema.usersTable)
          .set({
            username,
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

        if (input.avatarUrl !== undefined) {
          await transaction
            .update(schema.userProfilesTable)
            .set({ avatarUrl: input.avatarUrl, updatedAt: now })
            .where(
              and(
                eq(schema.userProfilesTable.userId, userId),
                isNull(schema.userProfilesTable.deletedAt),
              ),
            );
        }

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
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AuthApplicationError(
          'ACCOUNT_IDENTITY_CONFLICT',
          'That username or email address is already in use.',
          409,
        );
      }
      throw error;
    }
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

  async profileDetails(userId: string): Promise<UserProfileContract> {
    const existing = await this.profiles.findByUserId(userId);
    if (existing) return existing;

    const user = await this.users.findById(userId);
    if (!user)
      throw new AuthApplicationError('NOT_FOUND', 'Account not found.', 404);

    try {
      return await this.profiles.create({
        userId,
        handle: user.username,
        displayName: user.displayName ?? null,
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const concurrentlyCreated = await this.profiles.findByUserId(userId);
      if (concurrentlyCreated) return concurrentlyCreated;
      return this.profiles.create({
        userId,
        handle: `user_${userId.replaceAll('-', '').slice(0, 24)}`,
        displayName: user.displayName ?? null,
      });
    }
  }

  async updateProfile(
    userId: string,
    input: UpdateUserProfileContract,
  ): Promise<UserProfileContract> {
    await this.profileDetails(userId);
    try {
      const profile = await this.profiles.update(userId, input);
      if (!profile) {
        throw new AuthApplicationError('NOT_FOUND', 'Profile not found.', 404);
      }
      return profile;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AuthApplicationError(
          'PROFILE_HANDLE_CONFLICT',
          'That profile handle is already in use.',
          409,
        );
      }
      throw error;
    }
  }

  async listAdminEntities(
    entity: string,
    search: string,
    page: number,
    pageSize: number,
  ): Promise<AdminEntityPage> {
    const registered = requireAdminEntity(entity);
    const offset = (page - 1) * pageSize;
    const projection = Object.fromEntries(
      Object.entries(registered.columns).filter(
        ([key]) =>
          !registered.definition.columns.find((column) => column.key === key)
            ?.sensitive,
      ),
    );
    const searchableColumns = Object.entries(registered.columns).filter(
      ([key]) =>
        !registered.definition.columns.find((column) => column.key === key)
          ?.sensitive,
    );
    const searchFilter = search
      ? or(
          ...searchableColumns.map(([, column]) =>
            ilike(sql`cast(${column} as text)`, `%${search}%`),
          ),
        )
      : undefined;
    const deletedAt = registered.columns['deletedAt'];
    const where = deletedAt
      ? searchFilter
        ? and(isNull(deletedAt), searchFilter)
        : isNull(deletedAt)
      : searchFilter;
    let rowsQuery = this.database
      .select(projection)
      .from(registered.table)
      .where(where)
      .$dynamic();
    const createdAt = registered.columns['createdAt'];
    if (createdAt) rowsQuery = rowsQuery.orderBy(desc(createdAt));
    const [[aggregate], rows] = await Promise.all([
      this.database
        .select({ value: count() })
        .from(registered.table)
        .where(where),
      rowsQuery.limit(pageSize).offset(offset),
    ]);
    return {
      entity: registered.definition.name,
      records: rows.map((row, index) =>
        toAdminEntityRecord(registered, row, offset + index),
      ),
      total: aggregate?.value ?? 0,
      page,
      pageSize,
    };
  }

  adminEntityCatalog(): Promise<AdminEntityDefinition[]> {
    return Promise.resolve(listAdminEntityDefinitions());
  }

  async createAdminEntity(
    entity: string,
    input: AdminCreateEntityInput,
  ): Promise<AdminEntityRecord> {
    const registered = requireAdminEntity(entity);
    if (registered.definition.name !== 'users') {
      const values = toAdminInsertValues(registered, input);
      try {
        const [row] = await this.database
          .insert(registered.table)
          .values(values)
          .returning();
        if (!row) throw new Error('Failed to create entity record.');
        return toAdminEntityRecord(registered, row, 0);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new AuthApplicationError(
            'ENTITY_ALREADY_EXISTS',
            'A record with those unique values already exists.',
            409,
          );
        }
        throw error;
      }
    }

    if (
      typeof input.username !== 'string' ||
      typeof input.email !== 'string' ||
      typeof input.password !== 'string'
    ) {
      throw new AuthApplicationError(
        'INVALID_ENTITY_VALUES',
        'Username, email, and password are required to create a user.',
        422,
      );
    }

    this.passwordPolicy.validate(input.password);
    const username = input.username.trim().toLowerCase();
    const email = input.email.trim().toLowerCase();
    const [usernameOwner, emailOwner] = await Promise.all([
      this.users.findByUsername(username),
      this.users.findByEmail(email),
    ]);
    if (usernameOwner || emailOwner) {
      throw new AuthApplicationError(
        'USER_ALREADY_EXISTS',
        'An account already exists for that email or username.',
        409,
      );
    }

    const metadata = {
      ...input.metadata,
      ...(input.displayName?.trim()
        ? { displayName: input.displayName.trim() }
        : {}),
    };
    let user: UserContract;
    try {
      user = await this.users.create({
        username,
        email,
        passwordHash: await this.passwords.hash(input.password),
        status: input.status,
        tier: input.tier,
        emailVerified: input.emailVerified ?? false,
        metadata,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AuthApplicationError(
          'USER_ALREADY_EXISTS',
          'An account already exists for that email or username.',
          409,
        );
      }
      throw error;
    }

    if (!user.emailVerified) await this.sendVerification(user);
    return { ...user, metadata };
  }

  async updateAdminEntity(
    entity: string,
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
          // Entity Viewer still exposes the documented compatibility projection.
          role: schema.usersTable.role, // NOSONAR
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
    if (entity !== 'sessions' && entity !== 'user_sessions') {
      throw new AuthApplicationError(
        'ENTITY_UPDATE_UNSUPPORTED',
        'This entity is read/create only in the Entity Viewer.',
        422,
      );
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
    entity: string,
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
    if (
      entity !== 'users' &&
      entity !== 'sessions' &&
      entity !== 'user_sessions'
    ) {
      throw new AuthApplicationError(
        'ENTITY_DELETE_UNSUPPORTED',
        'This entity cannot be deleted from the Entity Viewer.',
        422,
      );
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
          // Deletion safety must include legacy super-admin rows during migration.
          eq(schema.usersTable.role, 'super_admin'), // NOSONAR
          isNull(schema.usersTable.deletedAt),
        ),
      );
    return result?.value ?? 0;
  }

  private async isPlatformOwner(userId: string): Promise<boolean> {
    const now = this.now();
    const [assignment] = await this.database
      .select({ userId: schema.platformRoleAssignmentsTable.userId })
      .from(schema.platformRoleAssignmentsTable)
      .innerJoin(
        schema.rolesTable,
        eq(schema.platformRoleAssignmentsTable.roleId, schema.rolesTable.id),
      )
      .where(
        and(
          eq(schema.platformRoleAssignmentsTable.userId, userId),
          eq(schema.rolesTable.scope, 'platform'),
          eq(schema.rolesTable.slug, 'platform-owner'),
          or(
            isNull(schema.platformRoleAssignmentsTable.expiresAt),
            gt(schema.platformRoleAssignmentsTable.expiresAt, now),
          ),
        ),
      )
      .limit(1);
    return assignment !== undefined;
  }
}

function requireAdminEntity(entity: string): RegisteredAdminEntity {
  const registered = getAdminEntity(entity);
  if (!registered) {
    throw new AuthApplicationError(
      'UNSUPPORTED_ENTITY_TYPE',
      'Unsupported entity type.',
      404,
    );
  }
  return registered;
}

function toAdminEntityRecord(
  registered: RegisteredAdminEntity,
  row: Record<string, unknown>,
  rowIndex: number,
): AdminEntityRecord {
  const record = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      normalizeAdminValue(value),
    ]),
  );
  for (const column of registered.definition.columns) {
    if (column.sensitive) record[column.key] = '[REDACTED]';
  }

  const primaryKey = registered.primaryKeys
    .map((key) => `${key}=${toAdminScalarText(row[key]) ?? ''}`)
    .join('|');
  const id = row['id'] ?? (primaryKey || `row-${rowIndex + 1}`);
  return { ...record, id: toAdminScalarText(id) ?? `row-${rowIndex + 1}` };
}

function normalizeAdminValue(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Uint8Array) return '[BINARY]';
  if (Array.isArray(value)) return value.map(normalizeAdminValue);
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        normalizeAdminValue(nested),
      ]),
    );
  }
  return value;
}

function toAdminInsertValues(
  registered: RegisteredAdminEntity,
  input: AdminCreateEntityInput,
): Record<string, unknown> {
  const definitions = new Map(
    registered.definition.columns.map((column) => [column.key, column]),
  );
  const values: Record<string, unknown> = {};

  for (const [key, rawValue] of Object.entries(input)) {
    const column = definitions.get(key);
    if (!column?.insertable) {
      throw new AuthApplicationError(
        'INVALID_ENTITY_VALUES',
        `Field "${key}" cannot be inserted for ${registered.definition.label}.`,
        422,
      );
    }
    if (rawValue === undefined || rawValue === '') continue;
    if (rawValue === null) {
      if (!column.nullable) {
        throw new AuthApplicationError(
          'INVALID_ENTITY_VALUES',
          `${column.label} cannot be null.`,
          422,
        );
      }
      values[key] = null;
      continue;
    }

    values[key] = coerceAdminEntityValue(column.type, rawValue, column.label);
    if (
      (key === 'email' || key === 'username') &&
      typeof values[key] === 'string'
    ) {
      values[key] = values[key].trim().toLowerCase();
    }
  }

  const missing = registered.definition.columns.filter(
    (column) =>
      column.insertable && column.required && values[column.key] === undefined,
  );
  if (missing.length > 0) {
    throw new AuthApplicationError(
      'INVALID_ENTITY_VALUES',
      `Required fields are missing: ${missing.map((column) => column.label).join(', ')}.`,
      422,
    );
  }

  return values;
}

function coerceAdminEntityValue(
  type: AdminEntityDefinition['columns'][number]['type'],
  value: unknown,
  label: string,
): unknown {
  const scalarText = toAdminScalarText(value);
  if ((type === 'string' || type === 'custom') && scalarText !== undefined) {
    return scalarText.trim();
  }
  if (type === 'boolean') {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === 'false') return value === 'true';
  }
  if (type === 'number') {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (type === 'bigint') {
    try {
      if (typeof value === 'bigint') return value;
      if (scalarText !== undefined) return BigInt(scalarText);
    } catch {
      // Handled by the validation error below.
    }
  }
  if (type === 'date') {
    const parsed =
      value instanceof Date ? value : new Date(scalarText ?? Number.NaN);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (type === 'json') {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      // Handled by the validation error below.
    }
  }
  if (type === 'array' && Array.isArray(value)) return value;
  if (type === 'buffer' && typeof value === 'string') return value;

  throw new AuthApplicationError(
    'INVALID_ENTITY_VALUES',
    `${label} has an invalid ${type} value.`,
    422,
  );
}

function toAdminScalarText(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) return value.toISOString();
  return undefined;
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
