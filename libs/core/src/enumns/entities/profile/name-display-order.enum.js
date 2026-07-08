'use strict';
// libs/core/src/enumns/entities/profile/name-display-order.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.NameDisplayOrderValues =
  exports.DefaultNameDisplayOrder =
  exports.NameDisplayOrder =
    void 0;
exports.isNameDisplayOrder = isNameDisplayOrder;
/**
 * User-selectable personal name display order preferences.
 */
exports.NameDisplayOrder = {
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
};
exports.DefaultNameDisplayOrder = exports.NameDisplayOrder.LocaleDefault;
exports.NameDisplayOrderValues = Object.values(exports.NameDisplayOrder);
function isNameDisplayOrder(value) {
  return (
    typeof value === 'string' && exports.NameDisplayOrderValues.includes(value)
  );
}
//# sourceMappingURL=name-display-order.enum.js.map
