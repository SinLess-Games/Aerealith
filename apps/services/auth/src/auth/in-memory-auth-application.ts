import type { AuthUser, LoginRequest, SignUpRequest } from '@aerealith-ai/core';
import { randomUUID } from 'node:crypto';

import {
  AuthApplicationError,
  type AuthApplication,
  type AuthResult,
} from './auth-application.service';
import { CryptoPasswordHasher } from './crypto-password-hasher';
import { CryptoTokenGenerator } from './crypto-token-generator';

type StoredUser = {
  user: AuthUser;
  passwordHash: string;
};

/**
 * Process-local auth storage for the development Worker.
 *
 * Accounts intentionally reset when `wrangler dev` stops.
 */
export class InMemoryAuthApplication implements AuthApplication {
  private readonly users = new Map<string, StoredUser>();
  private readonly sessions = new Map<string, string>();
  private readonly passwords = new CryptoPasswordHasher();
  private readonly tokens = new CryptoTokenGenerator();

  async signUp(input: SignUpRequest): Promise<AuthResult> {
    const username = input.username.toLowerCase();
    const email = input.email.toLowerCase();
    if (
      [...this.users.values()].some(
        ({ user }) => user.username === username || user.email === email,
      )
    ) {
      throw new AuthApplicationError(
        'USER_ALREADY_EXISTS',
        'An account already exists for that email or username.',
        409,
      );
    }

    const now = new Date().toISOString();
    const user: AuthUser = {
      id: randomUUID(),
      username,
      email,
      emailVerified: true,
      ...(input.displayName ? { displayName: input.displayName } : {}),
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, {
      user,
      passwordHash: await this.passwords.hash(input.password),
    });
    return this.createSession(user);
  }

  async login(input: LoginRequest): Promise<AuthResult> {
    const identifier = input.usernameOrEmail.toLowerCase();
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
    const userId = sessionToken ? this.sessions.get(sessionToken) : undefined;
    return Promise.resolve(
      userId ? (this.users.get(userId)?.user ?? null) : null,
    );
  }

  logout(sessionToken: string | undefined): Promise<void> {
    if (sessionToken) this.sessions.delete(sessionToken);
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

  private async createSession(user: AuthUser): Promise<AuthResult> {
    const { token } = await this.tokens.generate(32);
    this.sessions.set(token, user.id);
    return { user, sessionToken: token };
  }
}
