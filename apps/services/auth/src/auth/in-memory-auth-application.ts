import {
  DefaultUserRole,
  isUserRole,
  UserRole,
  type AccountDetails,
  type AdminDashboardOverview,
  type AuthUser,
  type LoginRequest,
  type SignUpRequest,
  type UpdateAccountRequest,
} from '@aerealith-ai/core';
import { randomUUID } from 'node:crypto';

import {
  AuthApplicationError,
  type AdminEntityPage,
  type AdminEntityRecord,
  type AdminEntityType,
  type AuthApplication,
  type AuthResult,
} from './auth-application.service';
import { CryptoPasswordHasher } from './crypto-password-hasher';
import { CryptoTokenGenerator } from './crypto-token-generator';

type StoredUser = {
  user: AuthUser;
  passwordHash: string;
  avatarUrl: string | null;
  timezone: string | null;
  locale: string | null;
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
  private readonly passwords = new CryptoPasswordHasher();
  private readonly tokens = new CryptoTokenGenerator();

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

  verifyEmail(token: string): Promise<AuthUser> {
    void token;
    return Promise.reject(
      new AuthApplicationError(
        'INVALID_VERIFICATION_TOKEN',
        'Local development accounts are already verified.',
        400,
      ),
    );
  }

  resendVerification(email: string): Promise<void> {
    void email;
    return Promise.resolve();
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
    this.assertUniqueIdentity(username, email, userId);

    stored.user = {
      ...stored.user,
      username,
      email,
      updatedAt: this.now().toISOString(),
    };
    stored.avatarUrl = input.avatarUrl ?? null;
    stored.timezone = input.timezone ?? null;
    stored.locale = input.locale ?? null;

    return Promise.resolve(this.toAccountDetails(stored));
  }

  listAdminEntities(
    entity: AdminEntityType,
    search: string,
    page: number,
    pageSize: number,
  ): Promise<AdminEntityPage> {
    const query = search.toLowerCase();
    const records =
      entity === 'users'
        ? [...this.users.values()]
            .map((stored) => this.userRecord(stored.user))
            .filter((record) =>
              `${record['username']} ${record['email']}`
                .toLowerCase()
                .includes(query),
            )
        : [...this.sessions.values()]
            .map((session) => this.sessionRecord(session))
            .filter((record) =>
              `${record['userId']} ${record['deviceName'] ?? ''} ${
                record['ipAddress'] ?? ''
              }`
                .toLowerCase()
                .includes(query),
            );
    records.sort((left, right) =>
      String(right['createdAt']).localeCompare(String(left['createdAt'])),
    );
    const offset = (page - 1) * pageSize;

    return Promise.resolve({
      entity,
      records: records.slice(offset, offset + pageSize),
      total: records.length,
      page,
      pageSize,
    });
  }

  updateAdminEntity(
    entity: AdminEntityType,
    id: string,
    changes: Record<string, unknown>,
  ): Promise<AdminEntityRecord> {
    if (entity === 'users') {
      const stored = this.requireUser(id, 'Entity not found.');
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
        ...(typeof changes['emailVerified'] === 'boolean'
          ? { emailVerified: changes['emailVerified'] }
          : {}),
        ...(isUserRole(changes['role']) ? { role: changes['role'] } : {}),
        ...(typeof changes['displayName'] === 'string'
          ? { displayName: changes['displayName'].trim() }
          : {}),
        updatedAt: this.now().toISOString(),
      };
      return Promise.resolve(this.userRecord(stored.user));
    }

    const session = this.findSessionById(id);
    if (!session) this.notFound('Entity not found.');
    const now = this.now().toISOString();
    if (
      typeof changes['deviceName'] === 'string' ||
      changes['deviceName'] === null
    ) {
      session.deviceName = changes['deviceName'];
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
    entity: AdminEntityType,
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
      if (!this.users.delete(id)) this.notFound('Entity not found.');
      for (const [token, session] of this.sessions) {
        if (session.userId === id) this.sessions.delete(token);
      }
      return Promise.resolve();
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
