// libs/core/src/entities/user/session.entity.ts

import type { Country } from '../../enumns'
import { BaseEntity, type BaseEntityInput } from '../base.entity'

/**
 * GeoIP data captured when a session is created or last used.
 *
 * This is populated by the auth service.
 * Core does not perform GeoIP lookups.
 */
export type UserSessionGeoIp = {
  country?: Country
  region?: string
  city?: string
  timezone?: string
  latitude?: number
  longitude?: number
}

/**
 * User session creation input.
 *
 * Store only a hash of the session token.
 * Never persist raw session tokens.
 */
export type UserSessionInput = BaseEntityInput & {
  userId: string
  tokenHash: string
  expiresAt: Date

  deviceName?: string | null
  userAgent?: string | null
  ipAddress?: string | null
  geoIp?: UserSessionGeoIp | null

  lastSeenAt?: Date | null
  revokedAt?: Date | null
}

/**
 * Represents an authenticated browser, device, or API session for a user.
 */
export class UserSessionEntity extends BaseEntity {
  userId: string

  /**
   * Hashed session token.
   *
   * Never store the raw token in the database.
   */
  tokenHash: string

  deviceName: string | null

  userAgent: string | null

  ipAddress: string | null

  geoIp: UserSessionGeoIp | null

  lastSeenAt: Date | null

  expiresAt: Date

  revokedAt: Date | null

  constructor(input: UserSessionInput) {
    super(input)

    this.userId = input.userId.trim()
    this.tokenHash = input.tokenHash.trim()

    this.deviceName = this.normalizeOptionalString(input.deviceName)
    this.userAgent = this.normalizeOptionalString(input.userAgent)
    this.ipAddress = this.normalizeOptionalString(input.ipAddress)
    this.geoIp = input.geoIp ?? null

    this.lastSeenAt = input.lastSeenAt ?? this.createdAt
    this.expiresAt = input.expiresAt
    this.revokedAt = input.revokedAt ?? null
  }

  get isRevoked(): boolean {
    return this.revokedAt !== null
  }

  get isActive(): boolean {
    return !this.isRevoked && !this.isExpired()
  }

  isExpired(now: Date = new Date()): boolean {
    return this.expiresAt.getTime() <= now.getTime()
  }

  recordActivity(
    input: {
      ipAddress?: string | null
      geoIp?: UserSessionGeoIp | null
      userAgent?: string | null
    } = {},
  ): void {
    const now = new Date()

    if (input.ipAddress !== undefined) {
      this.ipAddress = this.normalizeOptionalString(input.ipAddress)
    }

    if (input.geoIp !== undefined) {
      this.geoIp = input.geoIp
    }

    if (input.userAgent !== undefined) {
      this.userAgent = this.normalizeOptionalString(input.userAgent)
    }

    this.lastSeenAt = now
    this.updatedAt = now
  }

  revoke(): void {
    const now = new Date()

    this.revokedAt = now
    this.updatedAt = now
  }

  private normalizeOptionalString(value?: string | null): string | null {
    const normalized = value?.trim()

    return normalized || null
  }
}
