/**
 * User profile lifecycle status values.
 */
export declare const ProfileStatus: {
  readonly PendingSetup: 'pending_setup';
  readonly Active: 'active';
  readonly Hidden: 'hidden';
  readonly Disabled: 'disabled';
  readonly Suspended: 'suspended';
  readonly UnderReview: 'under_review';
  readonly Archived: 'archived';
  readonly Deleted: 'deleted';
};
export type ProfileStatus = (typeof ProfileStatus)[keyof typeof ProfileStatus];
export declare const DefaultProfileStatus: 'pending_setup';
export declare const ProfileStatusValues: (
  | 'archived'
  | 'active'
  | 'suspended'
  | 'under_review'
  | 'disabled'
  | 'pending_setup'
  | 'hidden'
  | 'deleted'
)[];
export declare function isProfileStatus(value: unknown): value is ProfileStatus;
