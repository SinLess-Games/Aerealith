/**
 * User-selectable sexual orientation values.
 *
 * Keep this intentionally simple.
 * Use `SelfDescribe` when the user wants to provide their own wording.
 */
export declare const Sexuality: {
  readonly Unspecified: 'unspecified';
  readonly PreferNotToSay: 'prefer_not_to_say';
  readonly NotListed: 'not_listed';
  readonly SelfDescribe: 'self_describe';
  readonly Questioning: 'questioning';
  readonly NoLabel: 'no_label';
  readonly Straight: 'straight';
  readonly Gay: 'gay';
  readonly Lesbian: 'lesbian';
  readonly Bisexual: 'bisexual';
  readonly Pansexual: 'pansexual';
  readonly Omnisexual: 'omnisexual';
  readonly Polysexual: 'polysexual';
  readonly Queer: 'queer';
  readonly Fluid: 'fluid';
  readonly Asexual: 'asexual';
  readonly Demisexual: 'demisexual';
  readonly Graysexual: 'graysexual';
  readonly AroAce: 'aroace';
  readonly Sapiosexual: 'sapiosexual';
};
export type Sexuality = (typeof Sexuality)[keyof typeof Sexuality];
export declare const DefaultSexuality: 'unspecified';
export declare const SexualityValues: (
  | 'unspecified'
  | 'not_listed'
  | 'self_describe'
  | 'prefer_not_to_say'
  | 'questioning'
  | 'no_label'
  | 'fluid'
  | 'aroace'
  | 'straight'
  | 'gay'
  | 'lesbian'
  | 'bisexual'
  | 'pansexual'
  | 'omnisexual'
  | 'polysexual'
  | 'queer'
  | 'asexual'
  | 'demisexual'
  | 'graysexual'
  | 'sapiosexual'
)[];
export declare function isSexuality(value: unknown): value is Sexuality;
