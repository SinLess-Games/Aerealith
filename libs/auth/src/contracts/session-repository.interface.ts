import type { UserSessionContract, UserSessionGeoIp } from '@aerealith-ai/core';

export interface CreateAuthSessionRecord {
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly deviceName?: string | null;
  readonly userAgent?: string | null;
  readonly ipAddress?: string | null;
  readonly geoIp?: UserSessionGeoIp | null;
  readonly lastSeenAt?: Date | null;
}

/**
 * Structural port matching `DrizzleUserSessionRepository`.
 */
export interface SessionRepository {
  findById(id: string): Promise<UserSessionContract | null>;
  findByTokenHash(tokenHash: string): Promise<UserSessionContract | null>;
  findAllByUserId(userId: string): Promise<UserSessionContract[]>;
  findHistoryByUserId(userId: string): Promise<UserSessionContract[]>;
  create(input: CreateAuthSessionRecord): Promise<UserSessionContract>;
  updateActivity(
    id: string,
    input?: { readonly lastSeenAt?: Date },
  ): Promise<UserSessionContract | null>;
  revoke(id: string): Promise<boolean>;
  revokeAllByUserId(userId: string, exceptSessionId?: string): Promise<number>;
}
