'use strict';
// libs/core/src/enumns/entities/locale/time-format.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.TimeFormatValues =
  exports.DefaultTimeFormat =
  exports.TimeFormat =
    void 0;
exports.isTimeFormat = isTimeFormat;
/**
 * User-selectable time display format preferences.
 */
exports.TimeFormat = {
  Unspecified: 'unspecified',
  TwelveHour: '12-hour',
  TwentyFourHour: '24-hour',
};
exports.DefaultTimeFormat = exports.TimeFormat.TwelveHour;
exports.TimeFormatValues = Object.values(exports.TimeFormat);
function isTimeFormat(value) {
  return typeof value === 'string' && exports.TimeFormatValues.includes(value);
}
//# sourceMappingURL=time-format.enum.js.map
