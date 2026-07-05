// libs/core/src/enumns/entities/locale/week-start-day.enum.ts

/**
 * User-selectable first day of week preferences.
 */
export const WeekStartDay = {
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
} as const

export type WeekStartDay = (typeof WeekStartDay)[keyof typeof WeekStartDay]

export const DefaultWeekStartDay = WeekStartDay.LocaleDefault

export const WeekStartDayValues = Object.values(WeekStartDay)

export const WeekDays = [
  WeekStartDay.Sunday,
  WeekStartDay.Monday,
  WeekStartDay.Tuesday,
  WeekStartDay.Wednesday,
  WeekStartDay.Thursday,
  WeekStartDay.Friday,
  WeekStartDay.Saturday,
] as const

export function isWeekStartDay(value: unknown): value is WeekStartDay {
  return (
    typeof value === 'string' &&
    WeekStartDayValues.includes(value as WeekStartDay)
  )
}
