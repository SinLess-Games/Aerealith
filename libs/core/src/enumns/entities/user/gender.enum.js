'use strict';
// libs/core/src/enumns/entities/user/gender.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.GenderValues = exports.DefaultGender = exports.Gender = void 0;
exports.isGender = isGender;
/**
 * User-selectable gender identity values.
 *
 * Keep this intentionally simple.
 * Use `SelfDescribe` when the user wants to provide their own wording.
 */
exports.Gender = {
  Unspecified: 'unspecified',
  PreferNotToSay: 'prefer_not_to_say',
  NotListed: 'not_listed',
  SelfDescribe: 'self_describe',
  Questioning: 'questioning',
  Woman: 'woman',
  Man: 'man',
  NonBinary: 'non_binary',
  Transgender: 'transgender',
  TransWoman: 'trans_woman',
  TransMan: 'trans_man',
  TransFeminine: 'trans_feminine',
  TransMasculine: 'trans_masculine',
  Genderfluid: 'genderfluid',
  Genderqueer: 'genderqueer',
  Agender: 'agender',
  Bigender: 'bigender',
  TwoSpirit: 'two_spirit',
  Intersex: 'intersex',
  GenderNonConforming: 'gender_non_conforming',
  AnotherGender: 'another_gender',
};
exports.DefaultGender = exports.Gender.Unspecified;
exports.GenderValues = Object.values(exports.Gender);
function isGender(value) {
  return typeof value === 'string' && exports.GenderValues.includes(value);
}
//# sourceMappingURL=gender.enum.js.map
