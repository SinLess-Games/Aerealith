import {
  DefaultUserRole,
  DefaultUserTier,
  DefaultUserProfileFieldVisibility,
  isUserRole,
  ProfileStatus,
  UserLifecycleStatus,
  UserRole,
  type AccountDetails,
  type AdminDashboardOverview,
  type AuthUser,
  type LoginRequest,
  type SignUpRequest,
  type UpdateAccountRequest,
  type UpdateUserProfileContract,
  type UserProfileContract,
} from '@aerealith-ai/core';
import { randomUUID } from 'node:crypto';

import {
  AuthApplicationError,
  type AdminEntityPage,
  type AdminCreateEntityInput,
  type AdminEntityRecord,
  type AuthApplication,
  type AuthResult,
  type AuthSessionSummary,
} from './auth-application.service';
import {
  getAdminEntity,
  listAdminEntityDefinitions,
  type AdminEntityDefinition,
} from './admin-entity-registry';
import { CryptoPasswordHasher } from './crypto-password-hasher';
import { CryptoTokenGenerator } from './crypto-token-generator';
import { PasswordPolicy } from '@aerealith-ai/auth';

type StoredUser = {
  user: AuthUser;
  passwordHash: string;
  avatarUrl: string | null;
  timezone: string | null;
  locale: string | null;
  profile: UserProfileContract | null;
};

type StoredSession = {
  id: string;
  userId: string;
  deviceName: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  lastSeenAt: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Process-local auth storage for the development Worker.
 *
 * Accounts intentionally reset when `wrangler dev` stops.
 */
export class InMemoryAuthApplication implements AuthApplication {
  private readonly users = new Map<string, StoredUser>();
  private readonly sessions = new Map<string, StoredSession>();
  private readonly passwordResetTokens = new Map<
    string,
    { userId: string; expiresAt: Date; consumed: boolean }
  >();
  private readonly genericAdminEntities = new Map<
    string,
    Map<string, AdminEntityRecord>
  >();
  private readonly passwords = new CryptoPasswordHasher();
  private readonly tokens = new CryptoTokenGenerator();
  private readonly passwordPolicy = new PasswordPolicy();

  constructor(private readonly now: () => Date = () => new Date()) {}

  async signUp(input: SignUpRequest): Promise<AuthResult> {
    const username = input.username.trim().toLowerCase();
    const email = input.email.trim().toLowerCase();
    this.assertUniqueIdentity(username, email);

    const now = this.now().toISOString();
    const user: AuthUser = {
      id: randomUUID(),
      username,
      email,
      emailVerified: true,
      role: DefaultUserRole,
      ...(input.displayName ? { displayName: input.displayName.trim() } : {}),
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, {
      user,
      passwordHash: await this.passwords.hash(input.password),
      avatarUrl: null,
      timezone: null,
      locale: null,
      profile: null,
    });
    return this.createSession(user);
  }

  async login(input: LoginRequest): Promise<AuthResult> {
    const identifier = input.usernameOrEmail.trim().toLowerCase();
    const stored = [...this.users.values()].find(
      ({ user }) => user.username === identifier || user.email === identifier,
    );
    if (
      !stored ||
      !(await this.passwords.verify(input.password, stored.passwordHash))
    ) {
      throw new AuthApplicationError(
        'INVALID_CREDENTIALS',
        'The supplied credentials are invalid.',
        401,
      );
    }
    return this.createSession(stored.user);
  }

  currentUser(sessionToken: string | undefined): Promise<AuthUser | null> {
    const session = sessionToken ? this.sessions.get(sessionToken) : undefined;
    if (
      !session ||
      session.revokedAt ||
      new Date(session.expiresAt) <= this.now()
    ) {
      return Promise.resolve(null);
    }
    return Promise.resolve(this.users.get(session.userId)?.user ?? null);
  }

  logout(sessionToken: string | undefined): Promise<void> {
    const session = sessionToken ? this.sessions.get(sessionToken) : undefined;
    if (session && !session.revokedAt) {
      const now = this.now().toISOString();
      session.revokedAt = now;
      session.updatedAt = now;
    }
    return Promise.resolve();
  }

  verifyEmail(): Promise<AuthUser> {
    return Promise.reject(
      new AuthApplicationError(
        'INVALID_VERIFICATION_TOKEN',
        'Local development accounts are already verified.',
        400,
      ),
    );
  }

  resendVerification(): Promise<void> {
    return Promise.resolve();
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = [...this.users.values()].find(
      (item) => item.user.email === email.trim().toLowerCase(),
    );
    if (!user) return;
    for (const record of this.passwordResetTokens.values())
      if (record.userId === user.user.id) record.consumed = true;
    const token = (await this.tokens.generate(32)).token;
    this.passwordResetTokens.set(await this.tokens.digest(token), {
      userId: user.user.id,
      expiresAt: new Date(this.now().getTime() + 3600000),
      consumed: false,
    });
  }

  async completePasswordReset(
    token: string,
    newPassword: string,
  ): Promise<void> {
    this.passwordPolicy.validate(newPassword);
    const record = this.passwordResetTokens.get(
      await this.tokens.digest(token),
    );
    if (!record || record.consumed || record.expiresAt <= this.now())
      throw new AuthApplicationError(
        'INVALID_RESET_TOKEN',
        'This password reset link is invalid or has expired.',
        400,
      );
    record.consumed = true;
    const user = this.requireUser(record.userId);
    user.passwordHash = await this.passwords.hash(newPassword);
    for (const session of this.sessions.values())
      if (session.userId === record.userId)
        session.revokedAt = this.now().toISOString();
  }

  async listSessions(token: string): Promise<AuthSessionSummary[]> {
    const current = this.sessions.get(token);
    if (!current || current.revokedAt) return [];
    return [...this.sessions.entries()]
      .filter(([, value]) => value.userId === current.userId)
      .map(([raw, value]) => ({
        id: value.id,
        current: raw === token,
        deviceName: value.deviceName,
        userAgent: value.userAgent,
        ipAddress: value.ipAddress,
        location: null,
        createdAt: value.createdAt,
        lastActiveAt: value.lastSeenAt,
        expiresAt: value.expiresAt,
        revokedAt: value.revokedAt,
        status: value.revokedAt
          ? 'revoked'
          : new Date(value.expiresAt) <= this.now()
            ? 'expired'
            : 'active',
      }));
  }

  async revokeSession(token: string, sessionId: string): Promise<boolean> {
    const current = this.sessions.get(token);
    const target = [...this.sessions.values()].find(
      (item) => item.id === sessionId,
    );
    if (!current || target?.userId !== current.userId || target.revokedAt)
      return false;
    target.revokedAt = this.now().toISOString();
    return true;
  }

  async revokeOtherSessions(token: string): Promise<number> {
    const current = this.sessions.get(token);
    if (!current) return 0;
    let count = 0;
    for (const [raw, session] of this.sessions)
      if (
        raw !== token &&
        session.userId === current.userId &&
        !session.revokedAt
      ) {
        session.revokedAt = this.now().toISOString();
        count++;
      }
    return count;
  }

  adminOverview(): Promise<AdminDashboardOverview> {
    const now = this.now();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const users = [...this.users.values()].map(({ user }) => user);
    const sessions = [...this.sessions.values()];

    return Promise.resolve({
      totalUsers: users.length,
      verifiedUsers: users.filter((user) => user.emailVerified).length,
      activeSessions: sessions.filter(
        (session) =>
          !session.revokedAt &&
          new Date(session.expiresAt).getTime() > now.getTime(),
      ).length,
      newUsersLast7Days: users.filter(
        (user) => new Date(user.createdAt).getTime() >= sevenDaysAgo,
      ).length,
      superAdmins: users.filter((user) => user.role === UserRole.SuperAdmin)
        .length,
      generatedAt: now.toISOString(),
    });
  }

  accountDetails(userId: string): Promise<AccountDetails> {
    const stored = this.requireUser(userId);
    return Promise.resolve(this.toAccountDetails(stored));
  }

  updateAccount(
    userId: string,
    input: UpdateAccountRequest,
  ): Promise<AccountDetails> {
    const stored = this.requireUser(userId);
    const username = input.username.trim().toLowerCase();
    const email = input.email.trim().toLowerCase();
    const emailChanged = email !== stored.user.email;
    this.assertUniqueIdentity(username, email, userId);

    stored.user = {
      ...stored.user,
      username,
      email,
      ...(emailChanged ? { emailVerified: false } : {}),
      updatedAt: this.now().toISOString(),
    };
    stored.avatarUrl = input.avatarUrl ?? null;
    if (stored.profile && input.avatarUrl !== undefined) {
      stored.profile = {
        ...stored.profile,
        avatarUrl: input.avatarUrl,
        updatedAt: this.now().toISOString(),
      };
    }
    stored.timezone = input.timezone ?? null;
    stored.locale = input.locale ?? null;

    if (emailChanged) {
      for (const session of this.sessions.values()) {
        if (session.userId === userId && !session.revokedAt) {
          session.revokedAt = this.now().toISOString();
          session.updatedAt = session.revokedAt;
        }
      }
    }

    return Promise.resolve(this.toAccountDetails(stored));
  }

  profileDetails(userId: string): Promise<UserProfileContract> {
    const stored = this.requireUser(userId);
    if (!stored.profile) {
      const now = this.now().toISOString();
      stored.profile = {
        id: randomUUID(),
        userId,
        handle: stored.user.username,
        displayName: stored.user.displayName ?? null,
        givenName: null,
        middleName: null,
        familyName: null,
        pronouns: null,
        avatarUrl: stored.avatarUrl,
        bannerUrl: null,
        bio: null,
        status: ProfileStatus.PendingSetup,
        fieldVisibility: { ...DefaultUserProfileFieldVisibility },
        locationLabel: null,
        country: null,
        gender: null,
        sex: null,
        sexuality: null,
        romanticOrientation: null,
        sexAttitude: null,
        languages: [],
        websiteUrl: null,
        links: [],
        createdAt: now,
        updatedAt: now,
      };
    }
    return Promise.resolve(stored.profile);
  }

  async updateProfile(
    userId: string,
    input: UpdateUserProfileContract,
  ): Promise<UserProfileContract> {
    const stored = this.requireUser(userId);
    const profile = await this.profileDetails(userId);
    if (
      input.handle &&
      [...this.users.values()].some(
        (candidate) =>
          candidate.user.id !== userId &&
          candidate.profile?.handle === input.handle,
      )
    ) {
      throw new AuthApplicationError(
        'PROFILE_HANDLE_CONFLICT',
        'That profile handle is already in use.',
        409,
      );
    }
    stored.profile = {
      ...profile,
      ...input,
      ...(input.fieldVisibility
        ? {
            fieldVisibility: {
              ...profile.fieldVisibility,
              ...input.fieldVisibility,
            },
          }
        : {}),
      updatedAt: this.now().toISOString(),
    };
    stored.avatarUrl = stored.profile.avatarUrl;
    return stored.profile;
  }

  listAdminEntities(
    entity: string,
    search: string,
    page: number,
    pageSize: number,
  ): Promise<AdminEntityPage> {
    const registered = getAdminEntity(entity);
    if (!registered) this.notFound('Unsupported entity type.');
    const canonicalEntity = registered.definition.name;
    const query = search.toLowerCase();
    const records =
      canonicalEntity === 'users'
        ? [...this.users.values()]
            .map((stored) => this.userRecord(stored.user))
            .filter((record) =>
              `${adminValueText(record['username'])} ${adminValueText(record['email'])}`
                .toLowerCase()
                .includes(query),
            )
        : canonicalEntity === 'user_sessions'
          ? [...this.sessions.values()]
              .map((session) => this.sessionRecord(session))
              .filter((record) =>
                `${adminValueText(record['userId'])} ${adminValueText(
                  record['deviceName'],
                )} ${adminValueText(record['ipAddress'])}`
                  .toLowerCase()
                  .includes(query),
              )
          : [
              ...(this.genericAdminEntities.get(canonicalEntity)?.values() ??
                []),
            ].filter((record) =>
              JSON.stringify(record).toLowerCase().includes(query),
            );
    records.sort((left, right) =>
      adminValueText(right['createdAt']).localeCompare(
        adminValueText(left['createdAt']),
      ),
    );
    const offset = (page - 1) * pageSize;

    return Promise.resolve({
      entity: canonicalEntity,
      records: records.slice(offset, offset + pageSize),
      total: records.length,
      page,
      pageSize,
    });
  }

  adminEntityCatalog(): Promise<AdminEntityDefinition[]> {
    return Promise.resolve(listAdminEntityDefinitions());
  }

  async createAdminEntity(
    entity: string,
    input: AdminCreateEntityInput,
  ): Promise<AdminEntityRecord> {
    const registered = getAdminEntity(entity);
    if (!registered) this.notFound('Unsupported entity type.');
    const canonicalEntity = registered.definition.name;
    if (canonicalEntity !== 'users') {
      const id = typeof input['id'] === 'string' ? input['id'] : randomUUID();
      const record: AdminEntityRecord = { ...input, id };
      let entities = this.genericAdminEntities.get(canonicalEntity);
      if (!entities) {
        entities = new Map<string, AdminEntityRecord>();
        this.genericAdminEntities.set(canonicalEntity, entities);
      }
      entities.set(id, record);
      return record;
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
    this.assertUniqueIdentity(username, email);
    const now = this.now().toISOString();
    const metadata = {
      ...input.metadata,
      ...(input.displayName?.trim()
        ? { displayName: input.displayName.trim() }
        : {}),
    };
    const user: AuthUser = {
      id: randomUUID(),
      username,
      email,
      emailVerified: input.emailVerified ?? false,
      role: DefaultUserRole,
      ...(input.displayName?.trim()
        ? { displayName: input.displayName.trim() }
        : {}),
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, {
      user,
      passwordHash: await this.passwords.hash(input.password),
      avatarUrl: null,
      timezone: null,
      locale: null,
      profile: null,
    });

    return {
      ...user,
      status: input.status ?? UserLifecycleStatus.Active,
      tier: input.tier ?? DefaultUserTier,
      metadata,
    };
  }

  updateAdminEntity(
    entity: string,
    id: string,
    changes: Record<string, unknown>,
  ): Promise<AdminEntityRecord> {
    if (entity === 'users') {
      const stored = this.requireUser(id, 'Entity not found.');
      const emailChanged =
        typeof changes['email'] === 'string' &&
        changes['email'].trim().toLowerCase() !== stored.user.email;
      if (
        stored.user.role === UserRole.SuperAdmin &&
        changes['role'] !== undefined &&
        changes['role'] !== UserRole.SuperAdmin &&
        this.superAdminCount() <= 1
      ) {
        throw new AuthApplicationError(
          'LAST_SUPER_ADMIN_FORBIDDEN',
          'The last super administrator cannot be demoted.',
          409,
        );
      }
      const username =
        typeof changes['username'] === 'string'
          ? changes['username'].trim().toLowerCase()
          : stored.user.username;
      const email =
        typeof changes['email'] === 'string'
          ? changes['email'].trim().toLowerCase()
          : stored.user.email;
      this.assertUniqueIdentity(username, email, id);
      stored.user = {
        ...stored.user,
        username,
        email,
        ...(emailChanged ? { emailVerified: false } : {}),
        ...(typeof changes['emailVerified'] === 'boolean'
          ? { emailVerified: changes['emailVerified'] }
          : {}),
        ...(isUserRole(changes['role']) ? { role: changes['role'] } : {}),
        ...(typeof changes['displayName'] === 'string'
          ? { displayName: changes['displayName'].trim() }
          : {}),
        updatedAt: this.now().toISOString(),
      };
      if (emailChanged) {
        for (const session of this.sessions.values()) {
          if (session.userId === id)
            session.revokedAt = this.now().toISOString();
        }
      }
      return Promise.resolve(this.userRecord(stored.user));
    }

    if (entity !== 'sessions' && entity !== 'user_sessions') {
      throw new AuthApplicationError(
        'ENTITY_UPDATE_UNSUPPORTED',
        'This entity type cannot be updated.',
        422,
      );
    }
    const session = this.findSessionById(id);
    if (!session) this.notFound('Entity not found.');
    const now = this.now().toISOString();
    const deviceName = changes['deviceName'];
    if (typeof deviceName === 'string' || deviceName === null) {
      session.deviceName = deviceName as string | null;
    }
    if (typeof changes['revokedAt'] === 'string') {
      session.revokedAt = changes['revokedAt'];
    } else if (changes['revokedAt'] === null) {
      session.revokedAt = null;
    }
    session.updatedAt = now;
    return Promise.resolve(this.sessionRecord(session));
  }

  deleteAdminEntity(
    entity: string,
    id: string,
    actorId: string,
  ): Promise<void> {
    if (entity === 'users') {
      if (id === actorId) {
        throw new AuthApplicationError(
          'SELF_DELETE_FORBIDDEN',
          'You cannot delete your own administrator account.',
          409,
        );
      }
      const target = this.requireUser(id, 'Entity not found.');
      if (
        target.user.role === UserRole.SuperAdmin &&
        this.superAdminCount() <= 1
      ) {
        throw new AuthApplicationError(
          'LAST_SUPER_ADMIN_FORBIDDEN',
          'The last super administrator cannot be deleted.',
          409,
        );
      }
      if (!this.users.delete(id)) this.notFound('Entity not found.');
      for (const [token, session] of this.sessions) {
        if (session.userId === id) this.sessions.delete(token);
      }
      return Promise.resolve();
    }

    if (entity !== 'sessions' && entity !== 'user_sessions') {
      throw new AuthApplicationError(
        'ENTITY_DELETE_UNSUPPORTED',
        'This entity type cannot be deleted.',
        422,
      );
    }
    const entry = [...this.sessions.entries()].find(
      ([, session]) => session.id === id,
    );
    if (!entry) this.notFound('Entity not found.');
    this.sessions.delete(entry[0]);
    return Promise.resolve();
  }

  private async createSession(user: AuthUser): Promise<AuthResult> {
    const { token } = await this.tokens.generate(32);
    const now = this.now();
    const timestamp = now.toISOString();
    this.sessions.set(token, {
      id: randomUUID(),
      userId: user.id,
      deviceName: 'Local development browser',
      userAgent: null,
      ipAddress: null,
      lastSeenAt: timestamp,
      expiresAt: new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      revokedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    return { user, sessionToken: token };
  }

  private superAdminCount(): number {
    return [...this.users.values()].filter(
      ({ user }) => user.role === UserRole.SuperAdmin,
    ).length;
  }

  private assertUniqueIdentity(
    username: string,
    email: string,
    excludedUserId?: string,
  ): void {
    if (
      [...this.users.values()].some(
        ({ user }) =>
          user.id !== excludedUserId &&
          (user.username === username || user.email === email),
      )
    ) {
      throw new AuthApplicationError(
        'USER_ALREADY_EXISTS',
        'An account already exists for that email or username.',
        409,
      );
    }
  }

  private requireUser(id: string, message = 'Account not found.'): StoredUser {
    const stored = this.users.get(id);
    if (!stored) this.notFound(message);
    return stored;
  }

  private findSessionById(id: string): StoredSession | undefined {
    return [...this.sessions.values()].find((session) => session.id === id);
  }

  private toAccountDetails(stored: StoredUser): AccountDetails {
    return {
      user: stored.user,
      avatarUrl: stored.avatarUrl,
      timezone: stored.timezone,
      locale: stored.locale,
    };
  }

  private userRecord(user: AuthUser): AdminEntityRecord {
    return { ...user };
  }

  private sessionRecord(session: StoredSession): AdminEntityRecord {
    return { ...session };
  }

  private notFound(message: string): never {
    throw new AuthApplicationError('NOT_FOUND', message, 404);
  }
}

function adminValueText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) return value.toISOString();
  return '';
}
