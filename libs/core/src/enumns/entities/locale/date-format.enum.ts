// libs/core/src/enumns/entities/locale/date-format.enum.ts

/**
 * User-selectable date display formats.
 */
export const DateFormat = {
  Unspecified: 'unspecified',
  Iso8601: 'yyyy-MM-dd',
  Us: 'MM/dd/yyyy',
  European: 'dd/MM/yyyy',
  Long: 'MMMM d, yyyy',
  ShortMonth: 'MMM d, yyyy',
} as const

export type DateFormat = (typeof DateFormat)[keyof typeof DateFormat]

export const DefaultDateFormat = DateFormat.Iso8601

export const DateFormatValues = Object.values(DateFormat)

export function isDateFormat(value: unknown): value is DateFormat {
  return (
    typeof value === 'string' && DateFormatValues.includes(value as DateFormat)
  )
}
