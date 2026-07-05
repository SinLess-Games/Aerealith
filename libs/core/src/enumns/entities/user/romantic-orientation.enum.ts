// libs/core/src/enumns/entities/user/romantic-orientation.enum.ts

/**
 * User-selectable romantic orientation values.
 *
 * Keep this intentionally simple.
 * Use `SelfDescribe` when the user wants to provide their own wording.
 */
export const RomanticOrientation = {
  Unspecified: 'unspecified',
  PreferNotToSay: 'prefer_not_to_say',
  NotListed: 'not_listed',
  SelfDescribe: 'self_describe',
  Questioning: 'questioning',
  NoLabel: 'no_label',

  Heteroromantic: 'heteroromantic',
  Homoromantic: 'homoromantic',
  Biromantic: 'biromantic',
  Panromantic: 'panromantic',
  Omniromantic: 'omniromantic',
  Polyromantic: 'polyromantic',
  Queerromantic: 'queerromantic',
  Fluid: 'fluid',

  Aromantic: 'aromantic',
  Demiromantic: 'demiromantic',
  Grayromantic: 'grayromantic',
  AroAce: 'aroace',
} as const

export type RomanticOrientation =
  (typeof RomanticOrientation)[keyof typeof RomanticOrientation]

export const DefaultRomanticOrientation = RomanticOrientation.Unspecified

export const RomanticOrientationValues = Object.values(RomanticOrientation)

export function isRomanticOrientation(
  value: unknown,
): value is RomanticOrientation {
  return (
    typeof value === 'string' &&
    RomanticOrientationValues.includes(value as RomanticOrientation)
  )
}
