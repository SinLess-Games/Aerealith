/**
 * Simple per-field profile visibility options.
 */
export declare const ProfileFieldVisibility: {
  readonly Private: 'private';
  readonly Public: 'public';
  readonly ConnectionsOnly: 'connections_only';
  readonly OrganizationOnly: 'organization_only';
};
export type ProfileFieldVisibility =
  (typeof ProfileFieldVisibility)[keyof typeof ProfileFieldVisibility];
export declare const DefaultProfileFieldVisibility: 'private';
export declare const ProfileFieldVisibilityValues: (
  'private' | 'public' | 'connections_only' | 'organization_only'
)[];
export declare function isProfileFieldVisibility(
  value: unknown,
): value is ProfileFieldVisibility;
