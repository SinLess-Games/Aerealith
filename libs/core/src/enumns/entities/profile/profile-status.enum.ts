// libs/core/src/enumns/entities/profile/profile-status.enum.ts

/**
 * User profile lifecycle status values.
 */
export const ProfileStatus = {
  PendingSetup: 'pending_setup',
  Active: 'active',
  Hidden: 'hidden',
  Disabled: 'disabled',
  Suspended: 'suspended',
  UnderReview: 'under_review',
  Archived: 'archived',
  Deleted: 'deleted',
} as const;

export type ProfileStatus = (typeof ProfileStatus)[keyof typeof ProfileStatus];

export const DefaultProfileStatus = ProfileStatus.PendingSetup;

export const ProfileStatusValues = Object.values(ProfileStatus);

export function isProfileStatus(value: unknown): value is ProfileStatus {
  return (
    typeof value === 'string' &&
    ProfileStatusValues.includes(value as ProfileStatus)
  );
}