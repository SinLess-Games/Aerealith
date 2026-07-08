'use strict';
// libs/core/src/enumns/entities/locale/week-start-day.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.WeekDays =
  exports.WeekStartDayValues =
  exports.DefaultWeekStartDay =
  exports.WeekStartDay =
    void 0;
exports.isWeekStartDay = isWeekStartDay;
/**
 * User-selectable first day of week preferences.
 */
exports.WeekStartDay = {
  Unspecified: 'unspecified',
  LocaleDefault: 'locale_default',
  Sunday: 'sunday',
  Monday: 'monday',
  Tuesday: 'tuesday',
  Wednesday: 'wednesday',
  Thursday: 'thursday',
  Friday: 'friday',
  Saturday: 'saturday',
  ISO8601: 'iso_8601',
};
exports.DefaultWeekStartDay = exports.WeekStartDay.LocaleDefault;
exports.WeekStartDayValues = Object.values(exports.WeekStartDay);
exports.WeekDays = [
  exports.WeekStartDay.Sunday,
  exports.WeekStartDay.Monday,
  exports.WeekStartDay.Tuesday,
  exports.WeekStartDay.Wednesday,
  exports.WeekStartDay.Thursday,
  exports.WeekStartDay.Friday,
  exports.WeekStartDay.Saturday,
];
function isWeekStartDay(value) {
  return (
    typeof value === 'string' && exports.WeekStartDayValues.includes(value)
  );
}
//# sourceMappingURL=week-start-day.enum.js.map
