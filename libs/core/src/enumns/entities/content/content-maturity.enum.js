'use strict';
// libs/core/src/enumns/entities/content/content-maturity.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.ContentMaturityRank =
  exports.ContentMaturityValues =
  exports.DefaultContentMaturity =
  exports.ContentMaturity =
    void 0;
exports.isContentMaturity = isContentMaturity;
/**
 * User-selectable content maturity and safety preference levels.
 */
exports.ContentMaturity = {
  Unspecified: 'unspecified',
  SafeOnly: 'safe_only',
  FamilyFriendly: 'family_friendly',
  Teen: 'teen',
  Mature: 'mature',
  Explicit: 'explicit',
  Restricted: 'restricted',
};
exports.DefaultContentMaturity = exports.ContentMaturity.FamilyFriendly;
exports.ContentMaturityValues = Object.values(exports.ContentMaturity);
exports.ContentMaturityRank = {
  [exports.ContentMaturity.Unspecified]: 0,
  [exports.ContentMaturity.SafeOnly]: 1,
  [exports.ContentMaturity.FamilyFriendly]: 2,
  [exports.ContentMaturity.Teen]: 3,
  [exports.ContentMaturity.Mature]: 4,
  [exports.ContentMaturity.Explicit]: 5,
  [exports.ContentMaturity.Restricted]: 6,
};
function isContentMaturity(value) {
  return (
    typeof value === 'string' && exports.ContentMaturityValues.includes(value)
  );
}
//# sourceMappingURL=content-maturity.enum.js.map
