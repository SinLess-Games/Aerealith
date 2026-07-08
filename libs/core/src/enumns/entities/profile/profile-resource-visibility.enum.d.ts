/**
 * Visibility options for profile resources such as links, files, media, or modules.
 */
export declare const ProfileResourceVisibility: {
  readonly Private: 'private';
  readonly Public: 'public';
  readonly Unlisted: 'unlisted';
};
export type ProfileResourceVisibility =
  (typeof ProfileResourceVisibility)[keyof typeof ProfileResourceVisibility];
export declare const DefaultProfileResourceVisibility: 'private';
export declare const ProfileResourceVisibilityValues: (
  'private' | 'public' | 'unlisted'
)[];
export declare function isProfileResourceVisibility(
  value: unknown,
): value is ProfileResourceVisibility;
