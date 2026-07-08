'use strict';
// libs/core/src/enumns/entities/user/sexuality.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.SexualityValues = exports.DefaultSexuality = exports.Sexuality = void 0;
exports.isSexuality = isSexuality;
/**
 * User-selectable sexual orientation values.
 *
 * Keep this intentionally simple.
 * Use `SelfDescribe` when the user wants to provide their own wording.
 */
exports.Sexuality = {
  Unspecified: 'unspecified',
  PreferNotToSay: 'prefer_not_to_say',
  NotListed: 'not_listed',
  SelfDescribe: 'self_describe',
  Questioning: 'questioning',
  NoLabel: 'no_label',
  Straight: 'straight',
  Gay: 'gay',
  Lesbian: 'lesbian',
  Bisexual: 'bisexual',
  Pansexual: 'pansexual',
  Omnisexual: 'omnisexual',
  Polysexual: 'polysexual',
  Queer: 'queer',
  Fluid: 'fluid',
  Asexual: 'asexual',
  Demisexual: 'demisexual',
  Graysexual: 'graysexual',
  AroAce: 'aroace',
  Sapiosexual: 'sapiosexual',
};
exports.DefaultSexuality = exports.Sexuality.Unspecified;
exports.SexualityValues = Object.values(exports.Sexuality);
function isSexuality(value) {
  return typeof value === 'string' && exports.SexualityValues.includes(value);
}
//# sourceMappingURL=sexuality.enum.js.map
