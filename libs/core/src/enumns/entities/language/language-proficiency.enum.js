'use strict';
// libs/core/src/enumns/entities/language/language-proficiency.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.LanguageProficiencyRank =
  exports.LanguageProficiencyValues =
  exports.DefaultLanguageProficiency =
  exports.LanguageProficiency =
    void 0;
exports.isLanguageProficiency = isLanguageProficiency;
/**
 * User-selectable language proficiency levels.
 */
exports.LanguageProficiency = {
  Unspecified: 'unspecified',
  Beginner: 'beginner',
  Intermediate: 'intermediate',
  Advanced: 'advanced',
  Fluent: 'fluent',
  Native: 'native',
};
exports.DefaultLanguageProficiency = exports.LanguageProficiency.Unspecified;
exports.LanguageProficiencyValues = Object.values(exports.LanguageProficiency);
exports.LanguageProficiencyRank = {
  [exports.LanguageProficiency.Unspecified]: 0,
  [exports.LanguageProficiency.Beginner]: 1,
  [exports.LanguageProficiency.Intermediate]: 2,
  [exports.LanguageProficiency.Advanced]: 3,
  [exports.LanguageProficiency.Fluent]: 4,
  [exports.LanguageProficiency.Native]: 5,
};
function isLanguageProficiency(value) {
  return (
    typeof value === 'string' &&
    exports.LanguageProficiencyValues.includes(value)
  );
}
//# sourceMappingURL=language-proficiency.enum.js.map
