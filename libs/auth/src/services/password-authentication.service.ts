import {
  UserLifecycleStatus,
  type UserContract,
  type UserEntity,
} from '@aerealith-ai/core';

import {
  DEFAULT_AUTH_OPTIONS,
  type AuthOptions,
} from '../config/auth-options.interface';
import type { AuthEventPublisher } from '../contracts/auth-event-publisher.interface';
import type { AuthUserRepository } from '../contracts/auth-user-repository.interface';
import type { PasswordHasher } from '../contracts/password-hasher.interface';
import type { AuthenticatePasswordInput } from '../dto/authenticate-password.input';
import type { AuthenticationResult } from '../dto/authentication-result.interface';
import { AuthEvent } from '../enums/auth-event.enum';
import { AuthFailureReason } from '../enums/auth-failure-reason.enum';
import { InvalidCredentialsError } from '../errors/invalid-credentials.error';
import {
  isEmailIdentifier,
  normalizeEmail,
  normalizeUsername,
} from '../utils/normalize-email';

export class PasswordAuthenticationService {
  private readonly requireVerifiedEmail: boolean;
  private readonly now: () => Date;

  constructor(
    private readonly users: AuthUserRepository,
    private readonly hasher: PasswordHasher,
    private readonly events?: AuthEventPublisher,
    options: AuthOptions = {},
  ) {
    this.requireVerifiedEmail =
      options.requireVerifiedEmail ?? DEFAULT_AUTH_OPTIONS.requireVerifiedEmail;
    this.now = options.now ?? (() => new Date());
  }

  async authenticate(
    input: AuthenticatePasswordInput,
  ): Promise<AuthenticationResult> {
    const user = await this.findUser(input.identifier);

    if (!user?.passwordHash) {
      await this.publishFailure();
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.hasher.verify(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches || !this.canAuthenticate(user)) {
      await this.publishFailure(user.id);
      throw new InvalidCredentialsError();
    }

    if (this.hasher.needsRehash?.(user.passwordHash)) {
      const replacementHash = await this.hasher.hash(input.password);
      await this.users.setPasswordHash(user.id, replacementHash);
    }

    const authenticatedAt = this.now();
    await this.events?.publish({
      event: AuthEvent.PasswordAuthenticationSucceeded,
      occurredAt: authenticatedAt,
      userId: user.id,
    });

    return {
      principal: {
        id: user.id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        status: user.status,
        role: user.role,
        tier: user.tier,
        authenticatedAt,
      },
      user: toUserContract(user),
    };
  }

  async changePassword(userId: string, passwordHash: string): Promise<boolean> {
    return this.users.setPasswordHash(userId, passwordHash);
  }

  private findUser(identifier: string): Promise<UserEntity | null> {
    return isEmailIdentifier(identifier)
      ? this.users.findEntityByEmail(normalizeEmail(identifier))
      : this.users.findEntityByUsername(normalizeUsername(identifier));
  }

  private canAuthenticate(user: UserEntity): boolean {
    return (
      user.status === UserLifecycleStatus.Active &&
      !user.isDeleted &&
      (!this.requireVerifiedEmail || user.hasVerifiedEmail)
    );
  }

  private async publishFailure(userId?: string): Promise<void> {
    await this.events?.publish({
      event: AuthEvent.PasswordAuthenticationFailed,
      occurredAt: this.now(),
      userId,
      reason: AuthFailureReason.InvalidCredentials,
    });
  }
}

function toUserContract(user: UserEntity): UserContract {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    emailVerified: user.emailVerified,
    status: user.status,
    role: user.role,
    tier: user.tier,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
