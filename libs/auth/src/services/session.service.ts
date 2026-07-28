import type { UserSessionContract } from '@aerealith-ai/core';

import type { AuthOptions } from '../config/auth-options.interface';
import type { AuthEventPublisher } from '../contracts/auth-event-publisher.interface';
import type { SessionRepository } from '../contracts/session-repository.interface';
import type { TokenGenerator } from '../contracts/token-generator.interface';
import type { CreateSessionInput } from '../dto/create-session.input';
import { AuthEvent } from '../enums/auth-event.enum';
import { SessionStatus } from '../enums/session-status.enum';
import { SessionExpiredError } from '../errors/session-expired.error';
import { SessionRevokedError } from '../errors/session-revoked.error';
import type { IssuedAuthSession } from '../models/auth-session.interface';
import { SessionPolicy } from '../policies/session.policy';

export class SessionService {
  private readonly policy: SessionPolicy;
  private readonly now: () => Date;

  constructor(
    private readonly sessions: SessionRepository,
    private readonly tokens: TokenGenerator,
    private readonly events?: AuthEventPublisher,
    options: AuthOptions = {},
  ) {
    this.policy = new SessionPolicy(options.session);
    this.now = options.now ?? (() => new Date());
  }

  async create(input: CreateSessionInput): Promise<IssuedAuthSession> {
    const now = this.now();
    const generated = await this.tokens.generate(this.policy.tokenEntropyBytes);
    const session = await this.sessions.create({
      userId: input.userId,
      tokenHash: generated.digest,
      expiresAt: this.policy.expiresAt(now),
      deviceName: input.deviceName,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      geoIp: input.geoIp,
      lastSeenAt: now,
    });

    await this.events?.publish({
      event: AuthEvent.SessionCreated,
      occurredAt: now,
      userId: input.userId,
      sessionId: session.id,
    });

    return { token: generated.token, session };
  }

  async findByToken(token: string): Promise<UserSessionContract | null> {
    const tokenHash = await this.tokens.digest(token);
    const session = await this.sessions.findByTokenHash(tokenHash);

    if (!session) return null;

    const status = this.policy.status(session, this.now());
    if (status === SessionStatus.Revoked) throw new SessionRevokedError();
    if (status === SessionStatus.Expired) throw new SessionExpiredError();

    return session;
  }

  async findUserIdByToken(token: string): Promise<string | null> {
    if (!this.sessions.findUserIdByTokenHash) return null;
    const tokenHash = await this.tokens.digest(token);
    return this.sessions.findUserIdByTokenHash(tokenHash);
  }

  listForUser(userId: string): Promise<UserSessionContract[]> {
    return this.sessions.findAllByUserId(userId);
  }

  listHistoryForUser(userId: string): Promise<UserSessionContract[]> {
    return this.sessions.findHistoryByUserId(userId);
  }

  async recordActivity(sessionId: string): Promise<UserSessionContract | null> {
    return this.sessions.updateActivity(sessionId, {
      lastSeenAt: this.now(),
    });
  }

  async revoke(sessionId: string): Promise<boolean> {
    const revoked = await this.sessions.revoke(sessionId);
    if (revoked) {
      await this.events?.publish({
        event: AuthEvent.SessionRevoked,
        occurredAt: this.now(),
        sessionId,
      });
    }
    return revoked;
  }

  async revokeAllForUser(
    userId: string,
    exceptSessionId?: string,
  ): Promise<number> {
    const count = await this.sessions.revokeAllByUserId(
      userId,
      exceptSessionId,
    );
    if (count > 0) {
      await this.events?.publish({
        event: AuthEvent.AllSessionsRevoked,
        occurredAt: this.now(),
        userId,
      });
    }
    return count;
  }
}
