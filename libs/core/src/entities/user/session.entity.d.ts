import type { Country } from '../../enumns';
import { BaseEntity, type BaseEntityInput } from '../base.entity';
/**
 * GeoIP data captured when a session is created or last used.
 *
 * This is populated by the auth service.
 * Core does not perform GeoIP lookups.
 */
export type UserSessionGeoIp = {
  country?: Country;
  region?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
};
/**
 * User session creation input.
 *
 * Store only a hash of the session token.
 * Never persist raw session tokens.
 */
export type UserSessionInput = BaseEntityInput & {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  deviceName?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  geoIp?: UserSessionGeoIp | null;
  lastSeenAt?: Date | null;
  revokedAt?: Date | null;
};
/**
 * Represents an authenticated browser, device, or API session for a user.
 */
export declare class UserSessionEntity extends BaseEntity {
  userId: string;
  /**
   * Hashed session token.
   *
   * Never store the raw token in the database.
   */
  tokenHash: string;
  deviceName: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  geoIp: UserSessionGeoIp | null;
  lastSeenAt: Date | null;
  expiresAt: Date;
  revokedAt: Date | null;
  constructor(input: UserSessionInput);
  get isRevoked(): boolean;
  get isActive(): boolean;
  isExpired(now?: Date): boolean;
  recordActivity(input?: {
    ipAddress?: string | null;
    geoIp?: UserSessionGeoIp | null;
    userAgent?: string | null;
  }): void;
  revoke(): void;
  private normalizeOptionalString;
}
