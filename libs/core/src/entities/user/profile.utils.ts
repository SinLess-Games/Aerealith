export const UserProfileTextFields = [
  'displayName',
  'givenName',
  'middleName',
  'familyName',
  'pronouns',
  'avatarUrl',
  'bannerUrl',
  'bio',
  'locationLabel',
  'websiteUrl',
] as const

export type UserProfileTextField = (typeof UserProfileTextFields)[number]

export const UserProfilePersonalDetailFields = [
  'country',
  'gender',
  'sex',
  'sexuality',
  'romanticOrientation',
  'sexAttitude',
] as const

export type UserProfilePersonalDetailField =
  (typeof UserProfilePersonalDetailFields)[number]

export const UserProfileFields = [
  'handle',
  ...UserProfileTextFields,
  ...UserProfilePersonalDetailFields,
  'languages',
  'links',
  'createdAt',
] as const

export type UserProfileField = (typeof UserProfileFields)[number]

export function normalizeUserProfileHandle(handle: string): string {
  return handle.trim().toLowerCase()
}

export function normalizeUserProfileOptionalString(
  value?: string | null,
): string | null {
  const normalized = value?.trim()

  return normalized || null
}

export function normalizeUserProfileLanguages<T>(languages: T[]): T[] {
  return languages.map((language) => ({ ...language }))
}

export function normalizeUserProfileLinks<
  T extends { url: string; label?: string | null },
>(links: T[]): T[] {
  return links
    .map((link) => ({
      ...link,
      url: link.url.trim(),
      label: normalizeUserProfileOptionalString(link.label),
    }))
    .filter((link) => link.url.length > 0)
}
