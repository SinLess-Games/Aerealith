'use strict';
// libs/core/src/enumns/entities/user/romantic-orientation.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.RomanticOrientationValues =
  exports.DefaultRomanticOrientation =
  exports.RomanticOrientation =
    void 0;
exports.isRomanticOrientation = isRomanticOrientation;
/**
 * User-selectable romantic orientation values.
 *
 * Keep this intentionally simple.
 * Use `SelfDescribe` when the user wants to provide their own wording.
 */
exports.RomanticOrientation = {
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
};
exports.DefaultRomanticOrientation = exports.RomanticOrientation.Unspecified;
exports.RomanticOrientationValues = Object.values(exports.RomanticOrientation);
function isRomanticOrientation(value) {
  return (
    typeof value === 'string' &&
    exports.RomanticOrientationValues.includes(value)
  );
}
//# sourceMappingURL=romantic-orientation.enum.js.map
