/**
 * User-selectable sex attitude values.
 *
 * This describes comfort/preference around sexual content or activity,
 * not sexual orientation.
 */
export declare const SexAttitude: {
  readonly Unspecified: 'unspecified';
  readonly PreferNotToSay: 'prefer_not_to_say';
  readonly NotListed: 'not_listed';
  readonly SelfDescribe: 'self_describe';
  readonly Favorable: 'favorable';
  readonly Positive: 'positive';
  readonly Neutral: 'neutral';
  readonly Indifferent: 'indifferent';
  readonly Averse: 'averse';
  readonly Repulsed: 'repulsed';
};
export type SexAttitude = (typeof SexAttitude)[keyof typeof SexAttitude];
export declare const DefaultSexAttitude: 'unspecified';
export declare const SexAttitudeValues: (
  | 'unspecified'
  | 'not_listed'
  | 'self_describe'
  | 'prefer_not_to_say'
  | 'favorable'
  | 'positive'
  | 'neutral'
  | 'indifferent'
  | 'averse'
  | 'repulsed'
)[];
export declare function isSexAttitude(value: unknown): value is SexAttitude;
