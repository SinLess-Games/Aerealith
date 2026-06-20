// libs/core/src/enumns/entities/user/sex.enum.ts

/**
 * User-selectable biological sex values.
 *
 * Note:
 * - Use `Intersex` instead of `Hermaphrodite`.
 * - Use `NotListed` or `SelfDescribe` when the provided options do not fit.
 */
export const Sex = {
  Unspecified: 'unspecified',
  PreferNotToSay: 'prefer_not_to_say',
  NotListed: 'not_listed',
  SelfDescribe: 'self_describe',

  Female: 'female',
  Male: 'male',
  Intersex: 'intersex',
} as const;

export type Sex = (typeof Sex)[keyof typeof Sex];

export const DefaultSex = Sex.Unspecified;

export const SexValues = Object.values(Sex);

export function isSex(value: unknown): value is Sex {
  return typeof value === 'string' && SexValues.includes(value as Sex);
}