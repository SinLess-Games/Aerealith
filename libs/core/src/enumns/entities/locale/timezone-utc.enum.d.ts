/**
 * UTC offset timezone values.
 */
export declare const TimezoneUtc: {
  readonly UtcMinus1200: 'UTC-12:00';
  readonly UtcMinus1100: 'UTC-11:00';
  readonly UtcMinus1000: 'UTC-10:00';
  readonly UtcMinus0930: 'UTC-09:30';
  readonly UtcMinus0900: 'UTC-09:00';
  readonly UtcMinus0800: 'UTC-08:00';
  readonly UtcMinus0700: 'UTC-07:00';
  readonly UtcMinus0600: 'UTC-06:00';
  readonly UtcMinus0500: 'UTC-05:00';
  readonly UtcMinus0400: 'UTC-04:00';
  readonly UtcMinus0330: 'UTC-03:30';
  readonly UtcMinus0300: 'UTC-03:00';
  readonly UtcMinus0230: 'UTC-02:30';
  readonly UtcMinus0200: 'UTC-02:00';
  readonly UtcMinus0100: 'UTC-01:00';
  readonly UtcPlus0000: 'UTC+00:00';
  readonly UtcPlus0100: 'UTC+01:00';
  readonly UtcPlus0200: 'UTC+02:00';
  readonly UtcPlus0300: 'UTC+03:00';
  readonly UtcPlus0330: 'UTC+03:30';
  readonly UtcPlus0400: 'UTC+04:00';
  readonly UtcPlus0430: 'UTC+04:30';
  readonly UtcPlus0500: 'UTC+05:00';
  readonly UtcPlus0530: 'UTC+05:30';
  readonly UtcPlus0545: 'UTC+05:45';
  readonly UtcPlus0600: 'UTC+06:00';
  readonly UtcPlus0630: 'UTC+06:30';
  readonly UtcPlus0700: 'UTC+07:00';
  readonly UtcPlus0800: 'UTC+08:00';
  readonly UtcPlus0845: 'UTC+08:45';
  readonly UtcPlus0900: 'UTC+09:00';
  readonly UtcPlus0930: 'UTC+09:30';
  readonly UtcPlus1000: 'UTC+10:00';
  readonly UtcPlus1030: 'UTC+10:30';
  readonly UtcPlus1100: 'UTC+11:00';
  readonly UtcPlus1200: 'UTC+12:00';
  readonly UtcPlus1245: 'UTC+12:45';
  readonly UtcPlus1300: 'UTC+13:00';
  readonly UtcPlus1345: 'UTC+13:45';
  readonly UtcPlus1400: 'UTC+14:00';
};
export type TimezoneUtc = (typeof TimezoneUtc)[keyof typeof TimezoneUtc];
export declare const DefaultTimezoneUtc: 'UTC+00:00';
export declare const TimezoneUtcValues: (
  | 'UTC-12:00'
  | 'UTC-11:00'
  | 'UTC-10:00'
  | 'UTC-09:30'
  | 'UTC-09:00'
  | 'UTC-08:00'
  | 'UTC-07:00'
  | 'UTC-06:00'
  | 'UTC-05:00'
  | 'UTC-04:00'
  | 'UTC-03:30'
  | 'UTC-03:00'
  | 'UTC-02:30'
  | 'UTC-02:00'
  | 'UTC-01:00'
  | 'UTC+00:00'
  | 'UTC+01:00'
  | 'UTC+02:00'
  | 'UTC+03:00'
  | 'UTC+03:30'
  | 'UTC+04:00'
  | 'UTC+04:30'
  | 'UTC+05:00'
  | 'UTC+05:30'
  | 'UTC+05:45'
  | 'UTC+06:00'
  | 'UTC+06:30'
  | 'UTC+07:00'
  | 'UTC+08:00'
  | 'UTC+08:45'
  | 'UTC+09:00'
  | 'UTC+09:30'
  | 'UTC+10:00'
  | 'UTC+10:30'
  | 'UTC+11:00'
  | 'UTC+12:00'
  | 'UTC+12:45'
  | 'UTC+13:00'
  | 'UTC+13:45'
  | 'UTC+14:00'
)[];
export declare function isTimezoneUtc(value: unknown): value is TimezoneUtc;
