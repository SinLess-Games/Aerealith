import {
  type AuthUser,
  type LoginRequest,
  type SignUpRequest,
  type UserContract,
} from '@aerealith-ai/core';
import {
  PasswordAuthenticationService,
  SessionService,
  type PasswordHasher,
} from '@aerealith-ai/auth';
import {
  DrizzleUserRepository,
  DrizzleUserSessionRepository,
  DrizzleEmailVerificationRepository,
  type DatabaseClient,
} from '@aerealith-ai/db';
import { createHash, randomBytes } from 'node:crypto';

import { CryptoPasswordHasher } from './crypto-password-hasher';
import { CryptoTokenGenerator } from './crypto-token-generator';
import type { EmailVerificationSender } from './resend-email-verification.sender';

export const AuthSessionCookie = 'aerealith_session';

export type AuthResult = {
  user: AuthUser;
  sessionToken: string;
};

export interface AuthApplication {
  signUp(input: SignUpRequest): Promise<AuthResult>;
  login(input: LoginRequest): Promise<AuthResult>;
  currentUser(sessionToken: string | undefined): Promise<AuthUser | null>;
  logout(sessionToken: string | undefined): Promise<void>;
  verifyEmail(token: string): Promise<AuthUser>;
  resendVerification(email: string): Promise<void>;
}

export interface AuthApplicationOptions {
  emailSender: EmailVerificationSender;
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
  private readonly passwordAuthentication: PasswordAuthenticationService;
  private readonly verification: DrizzleEmailVerificationRepository;
  private readonly verificationExpiresInHours: number;
  private readonly now: () => Date;

  constructor(
    database: DatabaseClient,
    private readonly options: AuthApplicationOptions,
  ) {
    this.users = new DrizzleUserRepository(database);
    this.verification = new DrizzleEmailVerificationRepository(database);
    this.verificationExpiresInHours = options.verificationExpiresInHours ?? 24;
    this.now = options.now ?? (() => new Date());
    this.passwords = new CryptoPasswordHasher();
    this.sessions = new SessionService(
      new DrizzleUserSessionRepository(database),
      new CryptoTokenGenerator(),
    );
    this.passwordAuthentication = new PasswordAuthenticationService(
      this.users,
      this.passwords,
      undefined,
      { requireVerifiedEmail: true },
    );
  }

  async signUp(input: SignUpRequest): Promise<AuthResult> {
    if (
      (await this.users.findByEmail(input.email)) ||
      (await this.users.findByUsername(input.username))
    ) {
      throw new AuthApplicationError(
        'USER_ALREADY_EXISTS',
        'An account already exists for that email or username.',
        409,
      );
    }

    const user = await this.users.create({
      username: input.username,
      email: input.email,
      passwordHash: await this.passwords.hash(input.password),
      metadata: input.displayName ? { displayName: input.displayName } : {},
    });
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
    ...(user.displayName ? { displayName: user.displayName } : {}),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
