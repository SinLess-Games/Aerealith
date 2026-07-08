/**
 * User-selectable language proficiency levels.
 */
export declare const LanguageProficiency: {
  readonly Unspecified: 'unspecified';
  readonly Beginner: 'beginner';
  readonly Intermediate: 'intermediate';
  readonly Advanced: 'advanced';
  readonly Fluent: 'fluent';
  readonly Native: 'native';
};
export type LanguageProficiency =
  (typeof LanguageProficiency)[keyof typeof LanguageProficiency];
export declare const DefaultLanguageProficiency: 'unspecified';
export declare const LanguageProficiencyValues: (
  'unspecified' | 'beginner' | 'intermediate' | 'advanced' | 'fluent' | 'native'
)[];
export declare const LanguageProficiencyRank: {
  readonly unspecified: 0;
  readonly beginner: 1;
  readonly intermediate: 2;
  readonly advanced: 3;
  readonly fluent: 4;
  readonly native: 5;
};
export declare function isLanguageProficiency(
  value: unknown,
): value is LanguageProficiency;
