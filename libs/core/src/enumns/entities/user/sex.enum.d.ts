/**
 * User-selectable biological sex values.
 *
 * Note:
 * - Use `Intersex` instead of `Hermaphrodite`.
 * - Use `NotListed` or `SelfDescribe` when the provided options do not fit.
 */
export declare const Sex: {
  readonly Unspecified: 'unspecified';
  readonly PreferNotToSay: 'prefer_not_to_say';
  readonly NotListed: 'not_listed';
  readonly SelfDescribe: 'self_describe';
  readonly Female: 'female';
  readonly Male: 'male';
  readonly Intersex: 'intersex';
};
export type Sex = (typeof Sex)[keyof typeof Sex];
export declare const DefaultSex: 'unspecified';
export declare const SexValues: (
  | 'unspecified'
  | 'not_listed'
  | 'self_describe'
  | 'prefer_not_to_say'
  | 'intersex'
  | 'female'
  | 'male'
)[];
export declare function isSex(value: unknown): value is Sex;
