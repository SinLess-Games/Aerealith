import type { UserRole, UserTier } from '../../enumns';
import { BaseEntity, type BaseEntityInput } from '../base.entity';
/**
 * Account lifecycle states.
 *
 * `deleted` is intentionally not included because `BaseEntity.deletedAt`
 * already represents a soft-deleted user.
 */
export declare const UserLifecycleStatus: {
  readonly Active: 'active';
  readonly Disabled: 'disabled';
  readonly Suspended: 'suspended';
};
export type UserLifecycleStatus =
  (typeof UserLifecycleStatus)[keyof typeof UserLifecycleStatus];
export type UserMetadata = Record<string, unknown>;
export type UserInput = BaseEntityInput & {
  username: string;
  email: string;
  passwordHash?: string | null;
  status?: UserLifecycleStatus;
  emailVerified?: boolean;
  emailVerifiedAt?: Date | null;
  role?: UserRole;
  tier?: UserTier;
  metadata?: UserMetadata;
};
export type UserUpdate = Omit<
  Partial<UserInput>,
  | 'id'
  | 'passwordHash'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'emailVerified'
  | 'emailVerifiedAt'
>;
/**
 * Core application user account.
 *
 * Profile information belongs in `UserProfileEntity`.
 * Settings belong in `UserSettingsEntity`.
 * Preferences belong in `UserPreferencesEntity`.
 * Sessions belong in `UserSessionEntity`.
 */
export declare class UserEntity extends BaseEntity {
  /**
   * Unique account username.
   *
   * Always stored in lowercase.
   */
  username: string;
  /**
   * Primary account email address.
   *
   * Always stored in lowercase.
   */
  email: string;
  /**
   * Hashed password.
   *
   * Never expose this in API responses.
   * This can be null for OAuth-only accounts.
   */
  passwordHash: string | null;
  status: UserLifecycleStatus;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  /**
   * Broad system permission role.
   *
   * Examples: user, moderator, admin, super_admin.
   */
  role: UserRole;
  /**
   * Subscription plan tier.
   *
   * Examples: basic, premium, pro_plus.
   */
  tier: UserTier;
  /**
   * Non-sensitive application metadata.
   *
   * Do not store credentials, tokens, passwords, or personal profile data here.
   */
  metadata: UserMetadata;
  constructor(input: UserInput);
  get isActive(): boolean;
  get hasVerifiedEmail(): boolean;
  update(input: UserUpdate): void;
  setPasswordHash(passwordHash?: string | null): void;
  verifyEmail(): void;
  markEmailUnverified(): void;
  activate(): void;
  disable(): void;
  suspend(): void;
  setRole(role: UserRole): void;
  setTier(tier: UserTier): void;
  private normalizeUsername;
  private normalizeEmail;
  private normalizeOptionalString;
}
