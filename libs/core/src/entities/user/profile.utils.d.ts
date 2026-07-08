export declare const UserProfileTextFields: readonly [
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
];
export type UserProfileTextField = (typeof UserProfileTextFields)[number];
export declare const UserProfilePersonalDetailFields: readonly [
  'country',
  'gender',
  'sex',
  'sexuality',
  'romanticOrientation',
  'sexAttitude',
];
export type UserProfilePersonalDetailField =
  (typeof UserProfilePersonalDetailFields)[number];
export declare const UserProfileFields: readonly [
  'handle',
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
  'country',
  'gender',
  'sex',
  'sexuality',
  'romanticOrientation',
  'sexAttitude',
  'languages',
  'links',
  'createdAt',
];
export type UserProfileField = (typeof UserProfileFields)[number];
export declare function normalizeUserProfileHandle(handle: string): string;
export declare function normalizeUserProfileOptionalString(
  value?: string | null,
): string | null;
export declare function normalizeUserProfileLanguages<T>(languages: T[]): T[];
export declare function normalizeUserProfileLinks<
  T extends {
    url: string;
    label?: string | null;
  },
>(links: T[]): T[];
