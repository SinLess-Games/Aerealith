// libs/core/src/enumns/system/user-tier.enum.ts

/**
 * User subscription tier values.
 *
 * Roles control permissions.
 * Tiers control plan/features/limits.
 */
export const UserTier = {
  Basic: 'basic',
  BasicPlus: 'basic_plus',
  Premium: 'premium',
  PremiumPlus: 'premium_plus',
  Pro: 'pro',
  ProPlus: 'pro_plus',
} as const

export type UserTier = (typeof UserTier)[keyof typeof UserTier]

export const DefaultUserTier = UserTier.Basic

export const UserTierValues = Object.values(UserTier)

export const UserTierRank = {
  [UserTier.Basic]: 1,
  [UserTier.BasicPlus]: 2,
  [UserTier.Premium]: 3,
  [UserTier.PremiumPlus]: 4,
  [UserTier.Pro]: 5,
  [UserTier.ProPlus]: 6,
} as const satisfies Record<UserTier, number>

export function isUserTier(value: unknown): value is UserTier {
  return typeof value === 'string' && UserTierValues.includes(value as UserTier)
}
