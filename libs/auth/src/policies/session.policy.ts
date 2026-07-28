import type { UserSessionContract } from '@aerealith-ai/core';

import {
  DEFAULT_AUTH_OPTIONS,
  type SessionPolicyOptions,
} from '../config/auth-options.interface';
import {
  SessionStatus,
  type SessionStatus as Status,
} from '../enums/session-status.enum';

export class SessionPolicy {
  readonly lifetimeMs: number;
  readonly tokenEntropyBytes: number;

  constructor(options: SessionPolicyOptions = {}) {
    const resolved = { ...DEFAULT_AUTH_OPTIONS.session, ...options };
    this.lifetimeMs = resolved.lifetimeMs;
    this.tokenEntropyBytes = resolved.tokenEntropyBytes;
  }

  expiresAt(now: Date): Date {
    return new Date(now.getTime() + this.lifetimeMs);
  }

  status(session: UserSessionContract, now: Date = new Date()): Status {
    if (session.revokedAt !== null) return SessionStatus.Revoked;
    if (Date.parse(session.expiresAt) <= now.getTime()) {
      return SessionStatus.Expired;
    }
    return SessionStatus.Active;
  }
}
