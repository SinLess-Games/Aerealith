// libs/core/src/entities/user/consent.entity.ts

import { BaseEntity, type BaseEntityInput } from '../base.entity';

export const UserConsentType = {
  TermsOfService: 'terms_of_service',
  PrivacyPolicy: 'privacy_policy',
  MarketingEmails: 'marketing_emails',
  ProductUpdates: 'product_updates',
  Analytics: 'analytics',
  Cookies: 'cookies',
} as const;

export type UserConsentType =
  (typeof UserConsentType)[keyof typeof UserConsentType];

export type UserConsentInput = BaseEntityInput & {
  userId: string;
  type: UserConsentType;
  version?: string | null;
  grantedAt?: Date | null;
  revokedAt?: Date | null;
};

/**
 * Records a user's consent decision for a specific policy or preference.
 *
 * A consent record is active when it has been granted and not revoked.
 */
export class UserConsentEntity extends BaseEntity {
  userId: string;

  type: UserConsentType;

  version: string | null;

  grantedAt: Date | null;

  revokedAt: Date | null;

  constructor(input: UserConsentInput) {
    super(input);

    this.userId = input.userId.trim();
    this.type = input.type;
    this.version = this.normalizeOptionalString(input.version);
    this.grantedAt = input.grantedAt ?? null;
    this.revokedAt = input.revokedAt ?? null;
  }

  get isGranted(): boolean {
    return this.grantedAt !== null && this.revokedAt === null;
  }

  grant(version?: string | null): void {
    const now = new Date();

    this.version = this.normalizeOptionalString(version) ?? this.version;
    this.grantedAt = now;
    this.revokedAt = null;
    this.updatedAt = now;
  }

  revoke(): void {
    const now = new Date();

    this.revokedAt = now;
    this.updatedAt = now;
  }

  private normalizeOptionalString(value?: string | null): string | null {
    const normalized = value?.trim();

    return normalized || null;
  }
}