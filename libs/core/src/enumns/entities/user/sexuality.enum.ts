// libs/core/src/enumns/entities/user/sexuality.enum.ts

/**
 * User-selectable sexual orientation values.
 *
 * Keep this intentionally simple.
 * Use `SelfDescribe` when the user wants to provide their own wording.
 */
export const Sexuality = {
  Unspecified: 'unspecified',
  PreferNotToSay: 'prefer_not_to_say',
  NotListed: 'not_listed',
  SelfDescribe: 'self_describe',
  Questioning: 'questioning',
  NoLabel: 'no_label',

  Straight: 'straight',
  Gay: 'gay',
  Lesbian: 'lesbian',
  Bisexual: 'bisexual',
  Pansexual: 'pansexual',
  Omnisexual: 'omnisexual',
  Polysexual: 'polysexual',
  Queer: 'queer',
  Fluid: 'fluid',

  Asexual: 'asexual',
  Demisexual: 'demisexual',
  Graysexual: 'graysexual',
  AroAce: 'aroace',

  Sapiosexual: 'sapiosexual',
} as const;

export type Sexuality = (typeof Sexuality)[keyof typeof Sexuality];

export const DefaultSexuality = Sexuality.Unspecified;

export const SexualityValues = Object.values(Sexuality);

export function isSexuality(value: unknown): value is Sexuality {
  return (
    typeof value === 'string' &&
    SexualityValues.includes(value as Sexuality)
  );
}