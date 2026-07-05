// libs/core/src/entities/user/user.entity.ts

import { DefaultUserRole, DefaultUserTier } from '../../enumns'
import type { UserRole, UserTier } from '../../enumns'
import { BaseEntity, type BaseEntityInput } from '../base.entity'

/**
 * Account lifecycle states.
 *
 * `deleted` is intentionally not included because `BaseEntity.deletedAt`
 * already represents a soft-deleted user.
 */
export const UserLifecycleStatus = {
  Active: 'active',
  Disabled: 'disabled',
  Suspended: 'suspended',
} as const

export type UserLifecycleStatus =
  (typeof UserLifecycleStatus)[keyof typeof UserLifecycleStatus]

export type UserMetadata = Record<string, unknown>

export type UserInput = BaseEntityInput & {
  username: string
  email: string

  passwordHash?: string | null
  status?: UserLifecycleStatus

  emailVerified?: boolean
  emailVerifiedAt?: Date | null

  role?: UserRole
  tier?: UserTier

  metadata?: UserMetadata
}

export type UserUpdate = Omit<
  Partial<UserInput>,
  | 'id'
  | 'passwordHash'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'emailVerified'
  | 'emailVerifiedAt'
>

/**
 * Core application user account.
 *
 * Profile information belongs in `UserProfileEntity`.
 * Settings belong in `UserSettingsEntity`.
 * Preferences belong in `UserPreferencesEntity`.
 * Sessions belong in `UserSessionEntity`.
 */
export class UserEntity extends BaseEntity {
  /**
   * Unique account username.
   *
   * Always stored in lowercase.
   */
  username: string

  /**
   * Primary account email address.
   *
   * Always stored in lowercase.
   */
  email: string

  /**
   * Hashed password.
   *
   * Never expose this in API responses.
   * This can be null for OAuth-only accounts.
   */
  passwordHash: string | null

  status: UserLifecycleStatus

  emailVerified: boolean

  emailVerifiedAt: Date | null

  /**
   * Broad system permission role.
   *
   * Examples: user, moderator, admin, super_admin.
   */
  role: UserRole

  /**
   * Subscription plan tier.
   *
   * Examples: basic, premium, pro_plus.
   */
  tier: UserTier

  /**
   * Non-sensitive application metadata.
   *
   * Do not store credentials, tokens, passwords, or personal profile data here.
   */
  metadata: UserMetadata

  constructor(input: UserInput) {
    super(input)

    this.username = this.normalizeUsername(input.username)
    this.email = this.normalizeEmail(input.email)

    this.passwordHash = this.normalizeOptionalString(input.passwordHash)

    this.status = input.status ?? UserLifecycleStatus.Active

    this.emailVerified = input.emailVerified ?? false
    this.emailVerifiedAt = input.emailVerifiedAt ?? null

    this.role = input.role ?? DefaultUserRole
    this.tier = input.tier ?? DefaultUserTier

    this.metadata = {
      ...input.metadata,
    }
  }

  get isActive(): boolean {
    return this.status === UserLifecycleStatus.Active && !this.isDeleted
  }

  get hasVerifiedEmail(): boolean {
    return this.emailVerified && this.emailVerifiedAt !== null
  }

  update(input: UserUpdate): void {
    if (input.username !== undefined) {
      this.username = this.normalizeUsername(input.username)
    }

    if (input.email !== undefined) {
      this.email = this.normalizeEmail(input.email)
      this.markEmailUnverified()
    }

    if (input.status !== undefined) {
      this.status = input.status
    }

    if (input.role !== undefined) {
      this.role = input.role
    }

    if (input.tier !== undefined) {
      this.tier = input.tier
    }

    if (input.metadata !== undefined) {
      this.metadata = {
        ...this.metadata,
        ...input.metadata,
      }
    }

    this.touch()
  }

  setPasswordHash(passwordHash?: string | null): void {
    this.passwordHash = this.normalizeOptionalString(passwordHash)
    this.touch()
  }

  verifyEmail(): void {
    const now = new Date()

    this.emailVerified = true
    this.emailVerifiedAt = now
    this.updatedAt = now
  }

  markEmailUnverified(): void {
    this.emailVerified = false
    this.emailVerifiedAt = null
  }

  activate(): void {
    this.status = UserLifecycleStatus.Active
    this.touch()
  }

  disable(): void {
    this.status = UserLifecycleStatus.Disabled
    this.touch()
  }

  suspend(): void {
    this.status = UserLifecycleStatus.Suspended
    this.touch()
  }

  setRole(role: UserRole): void {
    this.role = role
    this.touch()
  }

  setTier(tier: UserTier): void {
    this.tier = tier
    this.touch()
  }

  private normalizeUsername(username: string): string {
    return username.trim().toLowerCase()
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  private normalizeOptionalString(value?: string | null): string | null {
    const normalized = value?.trim()

    return normalized || null
  }
}
