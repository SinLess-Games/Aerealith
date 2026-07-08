/**
 * User-selectable romantic orientation values.
 *
 * Keep this intentionally simple.
 * Use `SelfDescribe` when the user wants to provide their own wording.
 */
export declare const RomanticOrientation: {
  readonly Unspecified: 'unspecified';
  readonly PreferNotToSay: 'prefer_not_to_say';
  readonly NotListed: 'not_listed';
  readonly SelfDescribe: 'self_describe';
  readonly Questioning: 'questioning';
  readonly NoLabel: 'no_label';
  readonly Heteroromantic: 'heteroromantic';
  readonly Homoromantic: 'homoromantic';
  readonly Biromantic: 'biromantic';
  readonly Panromantic: 'panromantic';
  readonly Omniromantic: 'omniromantic';
  readonly Polyromantic: 'polyromantic';
  readonly Queerromantic: 'queerromantic';
  readonly Fluid: 'fluid';
  readonly Aromantic: 'aromantic';
  readonly Demiromantic: 'demiromantic';
  readonly Grayromantic: 'grayromantic';
  readonly AroAce: 'aroace';
};
export type RomanticOrientation =
  (typeof RomanticOrientation)[keyof typeof RomanticOrientation];
export declare const DefaultRomanticOrientation: 'unspecified';
export declare const RomanticOrientationValues: (
  | 'unspecified'
  | 'not_listed'
  | 'self_describe'
  | 'prefer_not_to_say'
  | 'questioning'
  | 'no_label'
  | 'heteroromantic'
  | 'homoromantic'
  | 'biromantic'
  | 'panromantic'
  | 'omniromantic'
  | 'polyromantic'
  | 'queerromantic'
  | 'fluid'
  | 'aromantic'
  | 'demiromantic'
  | 'grayromantic'
  | 'aroace'
)[];
export declare function isRomanticOrientation(
  value: unknown,
): value is RomanticOrientation;
