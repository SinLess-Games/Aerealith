import type {
  UserAccessibilitySettings,
  UserAccountStatus,
  UserAppearanceSettings,
  UserCommunicationSettings,
  UserConsentType,
  UserLifecycleStatus,
  UserNotificationSettings,
  UserPreferencesUpdate,
  UserPrivacySettings,
  UserProfileField,
  UserProfileFieldVisibility,
  UserProfileLanguage,
  UserProfileLink,
  UserSecuritySettings,
  UserSessionGeoIp,
  UserSettingsMetadata,
} from '../../entities';
import type {
  ContentMaturity,
  Country,
  DateFormat,
  Gender,
  Languages as Language,
  LanguageProficiency,
  MeasurementSystem,
  NameDisplayOrder,
  ProfileFieldVisibility,
  ProfileLinkPlatform,
  ProfileStatus,
  RomanticOrientation,
  Sex,
  SexAttitude,
  Sexuality,
  TimeFormat,
  TimezoneGreenwich,
  TimezoneUtc,
  UserRole,
  UserTier,
  WeekStartDay,
} from '../../enumns';
/**
 * Public account information safe to show in normal user responses.
 */
export type UserContract = {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  status: UserLifecycleStatus;
  role: UserRole;
  tier: UserTier;
  createdAt: string;
  updatedAt: string;
};
/**
 * Account data needed when an internal service creates a user.
 *
 * Role and tier are intentionally not included.
 */
export type CreateUserContract = {
  username: string;
  email: string;
  password?: string;
};
/**
 * Account data a user may update for themselves.
 *
 * Password changes should use a dedicated auth endpoint.
 * Role and tier changes require a protected admin or billing flow.
 */
export type UpdateUserContract = {
  username?: string;
  email?: string;
  metadata?: Record<string, unknown>;
};
/**
 * Protected administrative account changes.
 */
export type UpdateUserAdminContract = {
  status?: UserLifecycleStatus;
  role?: UserRole;
  tier?: UserTier;
};
/**
 * A public external link shown on a user profile.
 */
export type UserProfileLinkContract = {
  platform: ProfileLinkPlatform;
  url: string;
  label?: string | null;
};
/**
 * A user language and optional proficiency.
 */
export type UserProfileLanguageContract = {
  language: Language;
  proficiency?: LanguageProficiency;
  isPrimary?: boolean;
};
/**
 * Public profile information.
 *
 * Services must enforce field visibility before returning this contract.
 */
export type PublicUserProfileContract = {
  userId: string;
  handle: string;
  displayName: string | null;
  pronouns: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  locationLabel: string | null;
  country: Country | null;
  languages: UserProfileLanguageContract[];
  websiteUrl: string | null;
  links: UserProfileLinkContract[];
  createdAt: string;
};
/**
 * Full profile data for the profile owner or an authorized administrator.
 */
export type UserProfileContract = PublicUserProfileContract & {
  id: string;
  givenName: string | null;
  middleName: string | null;
  familyName: string | null;
  status: ProfileStatus;
  fieldVisibility: UserProfileFieldVisibility;
  gender: Gender | null;
  sex: Sex | null;
  sexuality: Sexuality | null;
  romanticOrientation: RomanticOrientation | null;
  sexAttitude: SexAttitude | null;
  updatedAt: string;
};
/**
 * Data allowed when creating a profile.
 */
export type CreateUserProfileContract = {
  handle: string;
  displayName?: string | null;
};
/**
 * Data allowed when updating a profile.
 */
export type UpdateUserProfileContract = {
  handle?: string;
  displayName?: string | null;
  givenName?: string | null;
  middleName?: string | null;
  familyName?: string | null;
  pronouns?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
  fieldVisibility?: Partial<Record<UserProfileField, ProfileFieldVisibility>>;
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
/**
 * User locale, display, and content preferences.
 */
export type UserPreferencesContract = {
  id: string;
  userId: string;
  locale: string | null;
  timezone: string | null;
  timezoneUtc: TimezoneUtc | null;
  timezoneGreenwich: TimezoneGreenwich | null;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  weekStartDay: WeekStartDay;
  nameDisplayOrder: NameDisplayOrder;
  measurementSystem: MeasurementSystem;
  contentMaturity: ContentMaturity;
  createdAt: string;
  updatedAt: string;
};
/**
 * Data allowed when updating user preferences.
 */
export type UpdateUserPreferencesContract = UserPreferencesUpdate;
/**
 * User application settings.
 */
export type UserSettingsContract = {
  id: string;
  userId: string;
  metadata: UserSettingsMetadata;
  accessibility: UserAccessibilitySettings;
  appearance: UserAppearanceSettings;
  communication: UserCommunicationSettings;
  notifications: UserNotificationSettings;
  privacy: UserPrivacySettings;
  security: UserSecuritySettings;
  createdAt: string;
  updatedAt: string;
};
/**
 * Data allowed when updating user settings.
 *
 * Metadata is internal and is not updated through normal user settings routes.
 */
export type UpdateUserSettingsContract = {
  accessibility?: Partial<UserAccessibilitySettings>;
  appearance?: Partial<UserAppearanceSettings>;
  communication?: Partial<UserCommunicationSettings>;
  notifications?: Partial<UserNotificationSettings>;
  privacy?: Partial<UserPrivacySettings>;
  security?: Partial<UserSecuritySettings>;
};
/**
 * A user consent record.
 */
export type UserConsentContract = {
  id: string;
  userId: string;
  type: UserConsentType;
  version: string | null;
  grantedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
/**
 * Data used to record or revoke a consent decision.
 */
export type UpdateUserConsentContract = {
  type: UserConsentType;
  version?: string | null;
  granted: boolean;
};
/**
 * Linked external authentication or integration account.
 *
 * The provider account ID remains internal and is intentionally omitted.
 */
export type UserAccountContract = {
  id: string;
  provider: string;
  displayName: string;
  managementUrl: string | null;
  status: UserAccountStatus;
  connectedAt: string;
  createdAt: string;
  updatedAt: string;
};
/**
 * GeoIP data safe for the session-management screen.
 *
 * Exact coordinates are never returned through the API.
 */
export type UserSessionGeoIpContract = Omit<
  UserSessionGeoIp,
  'latitude' | 'longitude'
>;
/**
 * A user session safe to show in account session management.
 *
 * Never expose `tokenHash`.
 */
export type UserSessionContract = {
  id: string;
  deviceName: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  geoIp: UserSessionGeoIpContract | null;
  lastSeenAt: string | null;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
/**
 * Complete data returned to the authenticated user.
 */
export type CurrentUserContract = {
  user: UserContract;
  profile: UserProfileContract | null;
  preferences: UserPreferencesContract | null;
  settings: UserSettingsContract | null;
};
