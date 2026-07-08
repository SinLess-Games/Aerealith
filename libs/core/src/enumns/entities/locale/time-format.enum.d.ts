/**
 * User-selectable time display format preferences.
 */
export declare const TimeFormat: {
  readonly Unspecified: 'unspecified';
  readonly TwelveHour: '12-hour';
  readonly TwentyFourHour: '24-hour';
};
export type TimeFormat = (typeof TimeFormat)[keyof typeof TimeFormat];
export declare const DefaultTimeFormat: '12-hour';
export declare const TimeFormatValues: (
  'unspecified' | '12-hour' | '24-hour'
)[];
export declare function isTimeFormat(value: unknown): value is TimeFormat;
