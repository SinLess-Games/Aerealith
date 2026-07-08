'use strict';
// libs/core/src/enumns/system/user-tier.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.UserTierRank =
  exports.UserTierValues =
  exports.DefaultUserTier =
  exports.UserTier =
    void 0;
exports.isUserTier = isUserTier;
/**
 * User subscription tier values.
 *
 * Roles control permissions.
 * Tiers control plan/features/limits.
 */
exports.UserTier = {
  Basic: 'basic',
  BasicPlus: 'basic_plus',
  Premium: 'premium',
  PremiumPlus: 'premium_plus',
  Pro: 'pro',
  ProPlus: 'pro_plus',
};
exports.DefaultUserTier = exports.UserTier.Basic;
exports.UserTierValues = Object.values(exports.UserTier);
exports.UserTierRank = {
  [exports.UserTier.Basic]: 1,
  [exports.UserTier.BasicPlus]: 2,
  [exports.UserTier.Premium]: 3,
  [exports.UserTier.PremiumPlus]: 4,
  [exports.UserTier.Pro]: 5,
  [exports.UserTier.ProPlus]: 6,
};
function isUserTier(value) {
  return typeof value === 'string' && exports.UserTierValues.includes(value);
}
//# sourceMappingURL=user-tier.enum.js.map
