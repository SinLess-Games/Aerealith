// libs/core/src/enumns/entities/locale/time-format.enum.ts

/**
 * User-selectable time display format preferences.
 */
export const TimeFormat = {
  Unspecified: 'unspecified',
  TwelveHour: '12-hour',
  TwentyFourHour: '24-hour',
} as const

export type TimeFormat = (typeof TimeFormat)[keyof typeof TimeFormat]

export const DefaultTimeFormat = TimeFormat.TwelveHour

export const TimeFormatValues = Object.values(TimeFormat)

export function isTimeFormat(value: unknown): value is TimeFormat {
  return (
    typeof value === 'string' && TimeFormatValues.includes(value as TimeFormat)
  )
}
