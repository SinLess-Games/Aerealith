// libs/core/src/enumns/entities/content/content-maturity.enum.ts

/**
 * User-selectable content maturity and safety preference levels.
 */
export const ContentMaturity = {
  Unspecified: 'unspecified',
  SafeOnly: 'safe_only',
  FamilyFriendly: 'family_friendly',
  Teen: 'teen',
  Mature: 'mature',
  Explicit: 'explicit',
  Restricted: 'restricted',
} as const

export type ContentMaturity =
  (typeof ContentMaturity)[keyof typeof ContentMaturity]

export const DefaultContentMaturity = ContentMaturity.FamilyFriendly

export const ContentMaturityValues = Object.values(ContentMaturity)

export const ContentMaturityRank = {
  [ContentMaturity.Unspecified]: 0,
  [ContentMaturity.SafeOnly]: 1,
  [ContentMaturity.FamilyFriendly]: 2,
  [ContentMaturity.Teen]: 3,
  [ContentMaturity.Mature]: 4,
  [ContentMaturity.Explicit]: 5,
  [ContentMaturity.Restricted]: 6,
} as const satisfies Record<ContentMaturity, number>

export function isContentMaturity(value: unknown): value is ContentMaturity {
  return (
    typeof value === 'string' &&
    ContentMaturityValues.includes(value as ContentMaturity)
  )
}
