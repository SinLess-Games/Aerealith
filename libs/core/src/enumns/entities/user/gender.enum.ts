// libs/core/src/enumns/entities/user/gender.enum.ts

/**
 * User-selectable gender identity values.
 *
 * Keep this intentionally simple.
 * Use `SelfDescribe` when the user wants to provide their own wording.
 */
export const Gender = {
  Unspecified: 'unspecified',
  PreferNotToSay: 'prefer_not_to_say',
  NotListed: 'not_listed',
  SelfDescribe: 'self_describe',
  Questioning: 'questioning',

  Woman: 'woman',
  Man: 'man',
  NonBinary: 'non_binary',

  Transgender: 'transgender',
  TransWoman: 'trans_woman',
  TransMan: 'trans_man',
  TransFeminine: 'trans_feminine',
  TransMasculine: 'trans_masculine',

  Genderfluid: 'genderfluid',
  Genderqueer: 'genderqueer',
  Agender: 'agender',
  Bigender: 'bigender',
  TwoSpirit: 'two_spirit',

  Intersex: 'intersex',
  GenderNonConforming: 'gender_non_conforming',

  AnotherGender: 'another_gender',
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

export const DefaultGender = Gender.Unspecified;

export const GenderValues = Object.values(Gender);

export function isGender(value: unknown): value is Gender {
  return typeof value === 'string' && GenderValues.includes(value as Gender);
}