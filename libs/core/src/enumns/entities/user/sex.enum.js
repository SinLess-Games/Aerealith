'use strict';
// libs/core/src/enumns/entities/user/sex.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.SexValues = exports.DefaultSex = exports.Sex = void 0;
exports.isSex = isSex;
/**
 * User-selectable biological sex values.
 *
 * Note:
 * - Use `Intersex` instead of `Hermaphrodite`.
 * - Use `NotListed` or `SelfDescribe` when the provided options do not fit.
 */
exports.Sex = {
  Unspecified: 'unspecified',
  PreferNotToSay: 'prefer_not_to_say',
  NotListed: 'not_listed',
  SelfDescribe: 'self_describe',
  Female: 'female',
  Male: 'male',
  Intersex: 'intersex',
};
exports.DefaultSex = exports.Sex.Unspecified;
exports.SexValues = Object.values(exports.Sex);
function isSex(value) {
  return typeof value === 'string' && exports.SexValues.includes(value);
}
//# sourceMappingURL=sex.enum.js.map
