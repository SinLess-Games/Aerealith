'use strict';
// libs/core/src/enumns/entities/user/sex-attitude.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.SexAttitudeValues =
  exports.DefaultSexAttitude =
  exports.SexAttitude =
    void 0;
exports.isSexAttitude = isSexAttitude;
/**
 * User-selectable sex attitude values.
 *
 * This describes comfort/preference around sexual content or activity,
 * not sexual orientation.
 */
exports.SexAttitude = {
  Unspecified: 'unspecified',
  PreferNotToSay: 'prefer_not_to_say',
  NotListed: 'not_listed',
  SelfDescribe: 'self_describe',
  Favorable: 'favorable',
  Positive: 'positive',
  Neutral: 'neutral',
  Indifferent: 'indifferent',
  Averse: 'averse',
  Repulsed: 'repulsed',
};
exports.DefaultSexAttitude = exports.SexAttitude.Unspecified;
exports.SexAttitudeValues = Object.values(exports.SexAttitude);
function isSexAttitude(value) {
  return typeof value === 'string' && exports.SexAttitudeValues.includes(value);
}
//# sourceMappingURL=sex-attitude.enum.js.map
