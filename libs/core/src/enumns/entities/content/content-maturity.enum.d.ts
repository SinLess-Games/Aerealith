/**
 * User-selectable content maturity and safety preference levels.
 */
export declare const ContentMaturity: {
  readonly Unspecified: 'unspecified';
  readonly SafeOnly: 'safe_only';
  readonly FamilyFriendly: 'family_friendly';
  readonly Teen: 'teen';
  readonly Mature: 'mature';
  readonly Explicit: 'explicit';
  readonly Restricted: 'restricted';
};
export type ContentMaturity =
  (typeof ContentMaturity)[keyof typeof ContentMaturity];
export declare const DefaultContentMaturity: 'family_friendly';
export declare const ContentMaturityValues: (
  | 'unspecified'
  | 'safe_only'
  | 'family_friendly'
  | 'teen'
  | 'mature'
  | 'explicit'
  | 'restricted'
)[];
export declare const ContentMaturityRank: {
  readonly unspecified: 0;
  readonly safe_only: 1;
  readonly family_friendly: 2;
  readonly teen: 3;
  readonly mature: 4;
  readonly explicit: 5;
  readonly restricted: 6;
};
export declare function isContentMaturity(
  value: unknown,
): value is ContentMaturity;
