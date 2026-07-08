/**
 * User-selectable gender identity values.
 *
 * Keep this intentionally simple.
 * Use `SelfDescribe` when the user wants to provide their own wording.
 */
export declare const Gender: {
  readonly Unspecified: 'unspecified';
  readonly PreferNotToSay: 'prefer_not_to_say';
  readonly NotListed: 'not_listed';
  readonly SelfDescribe: 'self_describe';
  readonly Questioning: 'questioning';
  readonly Woman: 'woman';
  readonly Man: 'man';
  readonly NonBinary: 'non_binary';
  readonly Transgender: 'transgender';
  readonly TransWoman: 'trans_woman';
  readonly TransMan: 'trans_man';
  readonly TransFeminine: 'trans_feminine';
  readonly TransMasculine: 'trans_masculine';
  readonly Genderfluid: 'genderfluid';
  readonly Genderqueer: 'genderqueer';
  readonly Agender: 'agender';
  readonly Bigender: 'bigender';
  readonly TwoSpirit: 'two_spirit';
  readonly Intersex: 'intersex';
  readonly GenderNonConforming: 'gender_non_conforming';
  readonly AnotherGender: 'another_gender';
};
export type Gender = (typeof Gender)[keyof typeof Gender];
export declare const DefaultGender: 'unspecified';
export declare const GenderValues: (
  | 'unspecified'
  | 'not_listed'
  | 'self_describe'
  | 'prefer_not_to_say'
  | 'questioning'
  | 'woman'
  | 'man'
  | 'non_binary'
  | 'transgender'
  | 'trans_woman'
  | 'trans_man'
  | 'trans_feminine'
  | 'trans_masculine'
  | 'genderfluid'
  | 'genderqueer'
  | 'agender'
  | 'bigender'
  | 'two_spirit'
  | 'intersex'
  | 'gender_non_conforming'
  | 'another_gender'
)[];
export declare function isGender(value: unknown): value is Gender;
