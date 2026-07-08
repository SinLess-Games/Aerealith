/**
 * Status values for profile modules and integrations.
 */
export declare const ProfileModuleStatus: {
  readonly Enabled: 'enabled';
  readonly Disabled: 'disabled';
  readonly Pending: 'pending';
  readonly Failed: 'failed';
  readonly Archived: 'archived';
  readonly Revoked: 'revoked';
};
export type ProfileModuleStatus =
  (typeof ProfileModuleStatus)[keyof typeof ProfileModuleStatus];
export declare const DefaultProfileModuleStatus: 'disabled';
export declare const ProfileModuleStatusValues: (
  'archived' | 'revoked' | 'pending' | 'enabled' | 'disabled' | 'failed'
)[];
export declare function isProfileModuleStatus(
  value: unknown,
): value is ProfileModuleStatus;
