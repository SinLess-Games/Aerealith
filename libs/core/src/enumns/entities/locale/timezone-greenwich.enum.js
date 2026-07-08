'use strict';
// libs/core/src/enumns/entities/locale/timezone-greenwich.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.TimezoneGreenwichValues =
  exports.DefaultTimezoneGreenwich =
  exports.TimezoneGreenwich =
    void 0;
exports.isTimezoneGreenwich = isTimezoneGreenwich;
/**
 * Greenwich Mean Time offset values.
 */
exports.TimezoneGreenwich = {
  GmtMinus1200: 'GMT-12:00',
  GmtMinus1100: 'GMT-11:00',
  GmtMinus1000: 'GMT-10:00',
  GmtMinus0930: 'GMT-09:30',
  GmtMinus0900: 'GMT-09:00',
  GmtMinus0800: 'GMT-08:00',
  GmtMinus0700: 'GMT-07:00',
  GmtMinus0600: 'GMT-06:00',
  GmtMinus0500: 'GMT-05:00',
  GmtMinus0400: 'GMT-04:00',
  GmtMinus0330: 'GMT-03:30',
  GmtMinus0300: 'GMT-03:00',
  GmtMinus0230: 'GMT-02:30',
  GmtMinus0200: 'GMT-02:00',
  GmtMinus0100: 'GMT-01:00',
  GmtPlus0000: 'GMT+00:00',
  GmtPlus0100: 'GMT+01:00',
  GmtPlus0200: 'GMT+02:00',
  GmtPlus0300: 'GMT+03:00',
  GmtPlus0330: 'GMT+03:30',
  GmtPlus0400: 'GMT+04:00',
  GmtPlus0430: 'GMT+04:30',
  GmtPlus0500: 'GMT+05:00',
  GmtPlus0530: 'GMT+05:30',
  GmtPlus0545: 'GMT+05:45',
  GmtPlus0600: 'GMT+06:00',
  GmtPlus0630: 'GMT+06:30',
  GmtPlus0700: 'GMT+07:00',
  GmtPlus0800: 'GMT+08:00',
  GmtPlus0845: 'GMT+08:45',
  GmtPlus0900: 'GMT+09:00',
  GmtPlus0930: 'GMT+09:30',
  GmtPlus1000: 'GMT+10:00',
  GmtPlus1030: 'GMT+10:30',
  GmtPlus1100: 'GMT+11:00',
  GmtPlus1200: 'GMT+12:00',
  GmtPlus1245: 'GMT+12:45',
  GmtPlus1300: 'GMT+13:00',
  GmtPlus1345: 'GMT+13:45',
  GmtPlus1400: 'GMT+14:00',
};
exports.DefaultTimezoneGreenwich = exports.TimezoneGreenwich.GmtPlus0000;
exports.TimezoneGreenwichValues = Object.values(exports.TimezoneGreenwich);
function isTimezoneGreenwich(value) {
  return (
    typeof value === 'string' && exports.TimezoneGreenwichValues.includes(value)
  );
}
//# sourceMappingURL=timezone-greenwich.enum.js.map
