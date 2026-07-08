/**
 * User subscription tier values.
 *
 * Roles control permissions.
 * Tiers control plan/features/limits.
 */
export declare const UserTier: {
  readonly Basic: 'basic';
  readonly BasicPlus: 'basic_plus';
  readonly Premium: 'premium';
  readonly PremiumPlus: 'premium_plus';
  readonly Pro: 'pro';
  readonly ProPlus: 'pro_plus';
};
export type UserTier = (typeof UserTier)[keyof typeof UserTier];
export declare const DefaultUserTier: 'basic';
export declare const UserTierValues: (
  'basic' | 'basic_plus' | 'premium' | 'premium_plus' | 'pro' | 'pro_plus'
)[];
export declare const UserTierRank: {
  readonly basic: 1;
  readonly basic_plus: 2;
  readonly premium: 3;
  readonly premium_plus: 4;
  readonly pro: 5;
  readonly pro_plus: 6;
};
export declare function isUserTier(value: unknown): value is UserTier;
