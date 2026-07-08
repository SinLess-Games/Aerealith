import { BaseEntity, type BaseEntityInput } from '../base.entity';
export declare const UserConsentType: {
  readonly TermsOfService: 'terms_of_service';
  readonly PrivacyPolicy: 'privacy_policy';
  readonly MarketingEmails: 'marketing_emails';
  readonly ProductUpdates: 'product_updates';
  readonly Analytics: 'analytics';
  readonly Cookies: 'cookies';
};
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
export declare class UserConsentEntity extends BaseEntity {
  userId: string;
  type: UserConsentType;
  version: string | null;
  grantedAt: Date | null;
  revokedAt: Date | null;
  constructor(input: UserConsentInput);
  get isGranted(): boolean;
  grant(version?: string | null): void;
  revoke(): void;
  private normalizeOptionalString;
}
