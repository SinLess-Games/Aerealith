/**
 * User-selectable personal name display order preferences.
 */
export declare const NameDisplayOrder: {
  readonly Unspecified: 'unspecified';
  readonly LocaleDefault: 'locale_default';
  readonly DisplayNameOnly: 'display_name_only';
  readonly UsernameOnly: 'username_only';
  readonly GivenFamily: 'given_family';
  readonly FamilyGiven: 'family_given';
  readonly FamilyCommaGiven: 'family_comma_given';
  readonly GivenMiddleFamily: 'given_middle_family';
  readonly GivenMiddleInitialFamily: 'given_middle_initial_family';
  readonly TitleGivenFamily: 'title_given_family';
  readonly GivenFamilySuffix: 'given_family_suffix';
  readonly TitleGivenFamilySuffix: 'title_given_family_suffix';
  readonly Custom: 'custom';
};
export type NameDisplayOrder =
  (typeof NameDisplayOrder)[keyof typeof NameDisplayOrder];
export declare const DefaultNameDisplayOrder: 'locale_default';
export declare const NameDisplayOrderValues: (
  | 'unspecified'
  | 'locale_default'
  | 'display_name_only'
  | 'username_only'
  | 'given_family'
  | 'family_given'
  | 'family_comma_given'
  | 'given_middle_family'
  | 'given_middle_initial_family'
  | 'title_given_family'
  | 'given_family_suffix'
  | 'title_given_family_suffix'
  | 'custom'
)[];
export declare function isNameDisplayOrder(
  value: unknown,
): value is NameDisplayOrder;
