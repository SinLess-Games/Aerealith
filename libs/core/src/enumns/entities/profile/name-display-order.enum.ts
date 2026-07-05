// libs/core/src/enumns/entities/profile/name-display-order.enum.ts

/**
 * User-selectable personal name display order preferences.
 */
export const NameDisplayOrder = {
  Unspecified: 'unspecified',
  LocaleDefault: 'locale_default',

  DisplayNameOnly: 'display_name_only',
  UsernameOnly: 'username_only',

  GivenFamily: 'given_family',
  FamilyGiven: 'family_given',
  FamilyCommaGiven: 'family_comma_given',

  GivenMiddleFamily: 'given_middle_family',
  GivenMiddleInitialFamily: 'given_middle_initial_family',

  TitleGivenFamily: 'title_given_family',
  GivenFamilySuffix: 'given_family_suffix',
  TitleGivenFamilySuffix: 'title_given_family_suffix',

  Custom: 'custom',
} as const

export type NameDisplayOrder =
  (typeof NameDisplayOrder)[keyof typeof NameDisplayOrder]

export const DefaultNameDisplayOrder = NameDisplayOrder.LocaleDefault

export const NameDisplayOrderValues = Object.values(NameDisplayOrder)

export function isNameDisplayOrder(value: unknown): value is NameDisplayOrder {
  return (
    typeof value === 'string' &&
    NameDisplayOrderValues.includes(value as NameDisplayOrder)
  )
}
