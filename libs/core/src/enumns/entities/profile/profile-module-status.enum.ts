// libs/core/src/enumns/entities/profile/profile-module-status.enum.ts

/**
 * Status values for profile modules and integrations.
 */
export const ProfileModuleStatus = {
  Enabled: 'enabled',
  Disabled: 'disabled',
  Pending: 'pending',
  Failed: 'failed',
  Archived: 'archived',
  Revoked: 'revoked',
} as const;

export type ProfileModuleStatus =
  (typeof ProfileModuleStatus)[keyof typeof ProfileModuleStatus];

export const DefaultProfileModuleStatus = ProfileModuleStatus.Disabled;

export const ProfileModuleStatusValues = Object.values(ProfileModuleStatus);

export function isProfileModuleStatus(
  value: unknown,
): value is ProfileModuleStatus {
  return (
    typeof value === 'string' &&
    ProfileModuleStatusValues.includes(value as ProfileModuleStatus)
  );
}