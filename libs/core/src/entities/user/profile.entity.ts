import type {
  Country,
  Gender,
  Language,
  LanguageProficiency,
  ProfileLinkPlatform,
  RomanticOrientation,
  Sex,
  SexAttitude,
  Sexuality,
} from '../../enumns'
import { ProfileFieldVisibility, ProfileStatus } from '../../enumns'
import { BaseEntity, type BaseEntityInput } from '../base.entity'

/**
 * A link shown on a user's profile.
 *
 * Use `ProfileLinkPlatform.Custom` with a label for unsupported platforms.
 */
export type UserProfileLink = {
  platform: ProfileLinkPlatform
  url: string
  label?: string | null
}

/**
 * A language known by the user.
 */
export type UserProfileLanguage = {
  language: Language
  proficiency?: LanguageProficiency
  isPrimary?: boolean
}

/**
 * Fields that support their own visibility setting.
 */
export type UserProfileField =
  | 'handle'
  | 'displayName'
  | 'givenName'
  | 'middleName'
  | 'familyName'
  | 'pronouns'
  | 'avatarUrl'
  | 'bannerUrl'
  | 'bio'
  | 'locationLabel'
  | 'country'
  | 'gender'
  | 'sex'
  | 'sexuality'
  | 'romanticOrientation'
  | 'sexAttitude'
  | 'languages'
  | 'websiteUrl'
  | 'links'
  | 'createdAt'

/**
 * Visibility overrides for individual profile fields.
 *
 * Fields not listed here are private by default.
 */
export type UserProfileFieldVisibility = Partial<
  Record<UserProfileField, ProfileFieldVisibility>
>

/**
 * Default visibility for commonly public-facing profile fields.
 */
export const DefaultUserProfileFieldVisibility = {
  handle: ProfileFieldVisibility.Public,
  displayName: ProfileFieldVisibility.Public,
  pronouns: ProfileFieldVisibility.Public,
  avatarUrl: ProfileFieldVisibility.Public,
  bannerUrl: ProfileFieldVisibility.Public,
  bio: ProfileFieldVisibility.Public,
  locationLabel: ProfileFieldVisibility.Public,
  country: ProfileFieldVisibility.Public,
  languages: ProfileFieldVisibility.Public,
  websiteUrl: ProfileFieldVisibility.Public,
  links: ProfileFieldVisibility.Public,
  createdAt: ProfileFieldVisibility.Public,
} as const satisfies UserProfileFieldVisibility

export type UserProfileInput = BaseEntityInput & {
  userId: string
  handle: string

  displayName?: string | null
  givenName?: string | null
  middleName?: string | null
  familyName?: string | null
  pronouns?: string | null

  avatarUrl?: string | null
  bannerUrl?: string | null
  bio?: string | null

  status?: ProfileStatus
  fieldVisibility?: UserProfileFieldVisibility

  locationLabel?: string | null
  country?: Country | null

  gender?: Gender | null
  sex?: Sex | null
  sexuality?: Sexuality | null
  romanticOrientation?: RomanticOrientation | null
  sexAttitude?: SexAttitude | null

  languages?: UserProfileLanguage[]

  websiteUrl?: string | null
  links?: UserProfileLink[]
}

export type UserProfileUpdate = Omit<
  Partial<UserProfileInput>,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'
>

/**
 * Public-facing profile data for a user.
 *
 * This does not contain:
 * - Credentials, sessions, or account security details
 * - Consent records
 * - Locale, timezone, or display preferences
 * - Subscription or role information
 */
export class UserProfileEntity extends BaseEntity {
  userId: string

  handle: string

  displayName: string | null

  givenName: string | null

  middleName: string | null

  familyName: string | null

  pronouns: string | null

  avatarUrl: string | null

  bannerUrl: string | null

  bio: string | null

  status: ProfileStatus

  /**
   * The default visibility for the complete profile.
   *
   * Field visibility can further restrict or allow specific fields.
   */
  fieldVisibility: UserProfileFieldVisibility

  locationLabel: string | null

  country: Country | null

  gender: Gender | null

  sex: Sex | null

  sexuality: Sexuality | null

  romanticOrientation: RomanticOrientation | null

  sexAttitude: SexAttitude | null

  languages: UserProfileLanguage[]

  websiteUrl: string | null

  links: UserProfileLink[]

  constructor(input: UserProfileInput) {
    super(input)

    this.userId = input.userId.trim()
    this.handle = this.normalizeHandle(input.handle)

    this.displayName = this.normalizeOptionalString(input.displayName)
    this.givenName = this.normalizeOptionalString(input.givenName)
    this.middleName = this.normalizeOptionalString(input.middleName)
    this.familyName = this.normalizeOptionalString(input.familyName)
    this.pronouns = this.normalizeOptionalString(input.pronouns)

    this.avatarUrl = this.normalizeOptionalString(input.avatarUrl)
    this.bannerUrl = this.normalizeOptionalString(input.bannerUrl)
    this.bio = this.normalizeOptionalString(input.bio)

    this.status = input.status ?? ProfileStatus.PendingSetup

    this.fieldVisibility = {
      ...DefaultUserProfileFieldVisibility,
      ...input.fieldVisibility,
    }

    this.locationLabel = this.normalizeOptionalString(input.locationLabel)
    this.country = input.country ?? null

    this.gender = input.gender ?? null
    this.sex = input.sex ?? null
    this.sexuality = input.sexuality ?? null
    this.romanticOrientation = input.romanticOrientation ?? null
    this.sexAttitude = input.sexAttitude ?? null

    this.languages = this.normalizeLanguages(input.languages ?? [])

    this.websiteUrl = this.normalizeOptionalString(input.websiteUrl)
    this.links = this.normalizeLinks(input.links ?? [])
  }

  getFieldVisibility(field: UserProfileField): ProfileFieldVisibility {
    return this.fieldVisibility[field] ?? ProfileFieldVisibility.Private
  }

  update(input: UserProfileUpdate): void {
    this.updateTextFields(input)
    this.updateProfileState(input)
    this.updatePersonalDetails(input)
    this.updateCollections(input)

    this.touch()
  }

  setFieldVisibility(
    field: UserProfileField,
    visibility: ProfileFieldVisibility,
  ): void {
    this.fieldVisibility = {
      ...this.fieldVisibility,
      [field]: visibility,
    }

    this.touch()
  }

  setLanguages(languages: UserProfileLanguage[]): void {
    this.languages = this.normalizeLanguages(languages)
    this.touch()
  }

  setLinks(links: UserProfileLink[]): void {
    this.links = this.normalizeLinks(links)
    this.touch()
  }

  private updateTextFields(input: UserProfileUpdate): void {
    if (input.handle !== undefined) {
      this.handle = this.normalizeHandle(input.handle)
    }

    if (input.displayName !== undefined) {
      this.displayName = this.normalizeOptionalString(input.displayName)
    }

    if (input.givenName !== undefined) {
      this.givenName = this.normalizeOptionalString(input.givenName)
    }

    if (input.middleName !== undefined) {
      this.middleName = this.normalizeOptionalString(input.middleName)
    }

    if (input.familyName !== undefined) {
      this.familyName = this.normalizeOptionalString(input.familyName)
    }

    if (input.pronouns !== undefined) {
      this.pronouns = this.normalizeOptionalString(input.pronouns)
    }

    if (input.avatarUrl !== undefined) {
      this.avatarUrl = this.normalizeOptionalString(input.avatarUrl)
    }

    if (input.bannerUrl !== undefined) {
      this.bannerUrl = this.normalizeOptionalString(input.bannerUrl)
    }

    if (input.bio !== undefined) {
      this.bio = this.normalizeOptionalString(input.bio)
    }
  }

  private updateProfileState(input: UserProfileUpdate): void {
    if (input.status !== undefined) {
      this.status = input.status
    }

    if (input.fieldVisibility !== undefined) {
      this.fieldVisibility = {
        ...this.fieldVisibility,
        ...input.fieldVisibility,
      }
    }
  }

  private updatePersonalDetails(input: UserProfileUpdate): void {
    if (input.locationLabel !== undefined) {
      this.locationLabel = this.normalizeOptionalString(input.locationLabel)
    }

    if (input.country !== undefined) {
      this.country = input.country
    }

    if (input.gender !== undefined) {
      this.gender = input.gender
    }

    if (input.sex !== undefined) {
      this.sex = input.sex
    }

    if (input.sexuality !== undefined) {
      this.sexuality = input.sexuality
    }

    if (input.romanticOrientation !== undefined) {
      this.romanticOrientation = input.romanticOrientation
    }

    if (input.sexAttitude !== undefined) {
      this.sexAttitude = input.sexAttitude
    }
  }

  private updateCollections(input: UserProfileUpdate): void {
    if (input.languages !== undefined) {
      this.languages = this.normalizeLanguages(input.languages)
    }

    if (input.websiteUrl !== undefined) {
      this.websiteUrl = this.normalizeOptionalString(input.websiteUrl)
    }

    if (input.links !== undefined) {
      this.links = this.normalizeLinks(input.links)
    }
  }

  private normalizeHandle(handle: string): string {
    return handle.trim().toLowerCase()
  }

  private normalizeOptionalString(value?: string | null): string | null {
    const normalized = value?.trim()

    return normalized || null
  }

  private normalizeLanguages(
    languages: UserProfileLanguage[],
  ): UserProfileLanguage[] {
    return languages.map((language) => ({
      ...language,
    }))
  }

  private normalizeLinks(links: UserProfileLink[]): UserProfileLink[] {
    return links
      .map((link) => ({
        platform: link.platform,
        url: link.url.trim(),
        label: this.normalizeOptionalString(link.label),
      }))
      .filter((link) => link.url.length > 0)
  }
}
