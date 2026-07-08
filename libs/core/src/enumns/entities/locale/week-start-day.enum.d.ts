/**
 * User-selectable first day of week preferences.
 */
export declare const WeekStartDay: {
  readonly Unspecified: 'unspecified';
  readonly LocaleDefault: 'locale_default';
  readonly Sunday: 'sunday';
  readonly Monday: 'monday';
  readonly Tuesday: 'tuesday';
  readonly Wednesday: 'wednesday';
  readonly Thursday: 'thursday';
  readonly Friday: 'friday';
  readonly Saturday: 'saturday';
  readonly ISO8601: 'iso_8601';
};
export type WeekStartDay = (typeof WeekStartDay)[keyof typeof WeekStartDay];
export declare const DefaultWeekStartDay: 'locale_default';
export declare const WeekStartDayValues: (
  | 'unspecified'
  | 'locale_default'
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'iso_8601'
)[];
export declare const WeekDays: readonly [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];
export declare function isWeekStartDay(value: unknown): value is WeekStartDay;
