// libs/core/src/enumns/entities/profile/profile-field-visibility.enum.ts

/**
 * Simple per-field profile visibility options.
 */
export const ProfileFieldVisibility = {
  Private: 'private',
  Public: 'public',
  ConnectionsOnly: 'connections_only',
  OrganizationOnly: 'organization_only',
} as const;

export type ProfileFieldVisibility =
  (typeof ProfileFieldVisibility)[keyof typeof ProfileFieldVisibility];

export const DefaultProfileFieldVisibility = ProfileFieldVisibility.Private;

export const ProfileFieldVisibilityValues = Object.values(
  ProfileFieldVisibility,
);

export function isProfileFieldVisibility(
  value: unknown,
): value is ProfileFieldVisibility {
  return (
    typeof value === 'string' &&
    ProfileFieldVisibilityValues.includes(value as ProfileFieldVisibility)
  );
}