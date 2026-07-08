import type {
  Country,
  Gender,
  Languages as Language,
  LanguageProficiency,
  ProfileLinkPlatform,
  RomanticOrientation,
  Sex,
  SexAttitude,
  Sexuality,
} from '../../enumns';
import { ProfileFieldVisibility, ProfileStatus } from '../../enumns';
import { BaseEntity, type BaseEntityInput } from '../base.entity';
import { type UserProfileField as SharedUserProfileField } from './profile.utils';
/**
 * A link shown on a user's profile.
 *
 * Use `ProfileLinkPlatform.Custom` with a label for unsupported platforms.
 */
export type UserProfileLink = {
  platform: ProfileLinkPlatform;
  url: string;
  label?: string | null;
};
/**
 * A language known by the user.
 */
export type UserProfileLanguage = {
  language: Language;
  proficiency?: LanguageProficiency;
  isPrimary?: boolean;
};
/**
 * Fields that support their own visibility setting.
 */
export type UserProfileField = SharedUserProfileField;
/**
 * Visibility overrides for individual profile fields.
 *
 * Fields not listed here are private by default.
 */
export type UserProfileFieldVisibility = Partial<
  Record<UserProfileField, ProfileFieldVisibility>
>;
/**
 * Default visibility for commonly public-facing profile fields.
 */
export declare const DefaultUserProfileFieldVisibility: {
  readonly handle: 'public';
  readonly displayName: 'public';
  readonly pronouns: 'public';
  readonly avatarUrl: 'public';
  readonly bannerUrl: 'public';
  readonly bio: 'public';
  readonly locationLabel: 'public';
  readonly country: 'public';
  readonly languages: 'public';
  readonly websiteUrl: 'public';
  readonly links: 'public';
  readonly createdAt: 'public';
};
export type UserProfileInput = BaseEntityInput & {
  userId: string;
  handle: string;
  displayName?: string | null;
  givenName?: string | null;
  middleName?: string | null;
  familyName?: string | null;
  pronouns?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
  status?: ProfileStatus;
  fieldVisibility?: UserProfileFieldVisibility;
  locationLabel?: string | null;
  country?: Country | null;
  gender?: Gender | null;
  sex?: Sex | null;
  sexuality?: Sexuality | null;
  romanticOrientation?: RomanticOrientation | null;
  sexAttitude?: SexAttitude | null;
  languages?: UserProfileLanguage[];
  websiteUrl?: string | null;
  links?: UserProfileLink[];
};
export type UserProfileUpdate = Omit<
  Partial<UserProfileInput>,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;
/**
 * Public-facing profile data for a user.
 *
 * This does not contain:
 * - Credentials, sessions, or account security details
 * - Consent records
 * - Locale, timezone, or display preferences
 * - Subscription or role information
 */
export declare class UserProfileEntity extends BaseEntity {
  userId: string;
  handle: string;
  displayName: string | null;
  givenName: string | null;
  middleName: string | null;
  familyName: string | null;
  pronouns: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  status: ProfileStatus;
  /**
   * The default visibility for the complete profile.
   *
   * Field visibility can further restrict or allow specific fields.
   */
  fieldVisibility: UserProfileFieldVisibility;
  locationLabel: string | null;
  country: Country | null;
  gender: Gender | null;
  sex: Sex | null;
  sexuality: Sexuality | null;
  romanticOrientation: RomanticOrientation | null;
  sexAttitude: SexAttitude | null;
  languages: UserProfileLanguage[];
  websiteUrl: string | null;
  links: UserProfileLink[];
  constructor(input: UserProfileInput);
  getFieldVisibility(field: UserProfileField): ProfileFieldVisibility;
  update(input: UserProfileUpdate): void;
  setFieldVisibility(
    field: UserProfileField,
    visibility: ProfileFieldVisibility,
  ): void;
  setLanguages(languages: UserProfileLanguage[]): void;
  setLinks(links: UserProfileLink[]): void;
  private updateHandle;
  private updateTextFields;
  private updateProfileState;
  private updatePersonalDetails;
  private updateCollections;
  private setDefinedPersonalDetail;
  private normalizeHandle;
  private normalizeOptionalString;
  private normalizeLanguages;
  private normalizeLinks;
}
