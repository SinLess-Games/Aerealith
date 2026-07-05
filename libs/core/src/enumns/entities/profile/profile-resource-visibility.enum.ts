// libs/core/src/enumns/entities/profile/profile-resource-visibility.enum.ts

/**
 * Visibility options for profile resources such as links, files, media, or modules.
 */
export const ProfileResourceVisibility = {
  Private: 'private',
  Public: 'public',
  Unlisted: 'unlisted',
} as const

export type ProfileResourceVisibility =
  (typeof ProfileResourceVisibility)[keyof typeof ProfileResourceVisibility]

export const DefaultProfileResourceVisibility =
  ProfileResourceVisibility.Private

export const ProfileResourceVisibilityValues = Object.values(
  ProfileResourceVisibility,
)

export function isProfileResourceVisibility(
  value: unknown,
): value is ProfileResourceVisibility {
  return (
    typeof value === 'string' &&
    ProfileResourceVisibilityValues.includes(value as ProfileResourceVisibility)
  )
}
