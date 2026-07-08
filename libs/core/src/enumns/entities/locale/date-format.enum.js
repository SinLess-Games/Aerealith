'use strict';
// libs/core/src/enumns/entities/locale/date-format.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.DateFormatValues =
  exports.DefaultDateFormat =
  exports.DateFormat =
    void 0;
exports.isDateFormat = isDateFormat;
/**
 * User-selectable date display formats.
 */
exports.DateFormat = {
  Unspecified: 'unspecified',
  Iso8601: 'yyyy-MM-dd',
  Us: 'MM/dd/yyyy',
  European: 'dd/MM/yyyy',
  Long: 'MMMM d, yyyy',
  ShortMonth: 'MMM d, yyyy',
};
exports.DefaultDateFormat = exports.DateFormat.Iso8601;
exports.DateFormatValues = Object.values(exports.DateFormat);
function isDateFormat(value) {
  return typeof value === 'string' && exports.DateFormatValues.includes(value);
}
//# sourceMappingURL=date-format.enum.js.map
