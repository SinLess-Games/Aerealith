/**
 * Greenwich Mean Time offset values.
 */
export declare const TimezoneGreenwich: {
  readonly GmtMinus1200: 'GMT-12:00';
  readonly GmtMinus1100: 'GMT-11:00';
  readonly GmtMinus1000: 'GMT-10:00';
  readonly GmtMinus0930: 'GMT-09:30';
  readonly GmtMinus0900: 'GMT-09:00';
  readonly GmtMinus0800: 'GMT-08:00';
  readonly GmtMinus0700: 'GMT-07:00';
  readonly GmtMinus0600: 'GMT-06:00';
  readonly GmtMinus0500: 'GMT-05:00';
  readonly GmtMinus0400: 'GMT-04:00';
  readonly GmtMinus0330: 'GMT-03:30';
  readonly GmtMinus0300: 'GMT-03:00';
  readonly GmtMinus0230: 'GMT-02:30';
  readonly GmtMinus0200: 'GMT-02:00';
  readonly GmtMinus0100: 'GMT-01:00';
  readonly GmtPlus0000: 'GMT+00:00';
  readonly GmtPlus0100: 'GMT+01:00';
  readonly GmtPlus0200: 'GMT+02:00';
  readonly GmtPlus0300: 'GMT+03:00';
  readonly GmtPlus0330: 'GMT+03:30';
  readonly GmtPlus0400: 'GMT+04:00';
  readonly GmtPlus0430: 'GMT+04:30';
  readonly GmtPlus0500: 'GMT+05:00';
  readonly GmtPlus0530: 'GMT+05:30';
  readonly GmtPlus0545: 'GMT+05:45';
  readonly GmtPlus0600: 'GMT+06:00';
  readonly GmtPlus0630: 'GMT+06:30';
  readonly GmtPlus0700: 'GMT+07:00';
  readonly GmtPlus0800: 'GMT+08:00';
  readonly GmtPlus0845: 'GMT+08:45';
  readonly GmtPlus0900: 'GMT+09:00';
  readonly GmtPlus0930: 'GMT+09:30';
  readonly GmtPlus1000: 'GMT+10:00';
  readonly GmtPlus1030: 'GMT+10:30';
  readonly GmtPlus1100: 'GMT+11:00';
  readonly GmtPlus1200: 'GMT+12:00';
  readonly GmtPlus1245: 'GMT+12:45';
  readonly GmtPlus1300: 'GMT+13:00';
  readonly GmtPlus1345: 'GMT+13:45';
  readonly GmtPlus1400: 'GMT+14:00';
};
export type TimezoneGreenwich =
  (typeof TimezoneGreenwich)[keyof typeof TimezoneGreenwich];
export declare const DefaultTimezoneGreenwich: 'GMT+00:00';
export declare const TimezoneGreenwichValues: (
  | 'GMT-12:00'
  | 'GMT-11:00'
  | 'GMT-10:00'
  | 'GMT-09:30'
  | 'GMT-09:00'
  | 'GMT-08:00'
  | 'GMT-07:00'
  | 'GMT-06:00'
  | 'GMT-05:00'
  | 'GMT-04:00'
  | 'GMT-03:30'
  | 'GMT-03:00'
  | 'GMT-02:30'
  | 'GMT-02:00'
  | 'GMT-01:00'
  | 'GMT+00:00'
  | 'GMT+01:00'
  | 'GMT+02:00'
  | 'GMT+03:00'
  | 'GMT+03:30'
  | 'GMT+04:00'
  | 'GMT+04:30'
  | 'GMT+05:00'
  | 'GMT+05:30'
  | 'GMT+05:45'
  | 'GMT+06:00'
  | 'GMT+06:30'
  | 'GMT+07:00'
  | 'GMT+08:00'
  | 'GMT+08:45'
  | 'GMT+09:00'
  | 'GMT+09:30'
  | 'GMT+10:00'
  | 'GMT+10:30'
  | 'GMT+11:00'
  | 'GMT+12:00'
  | 'GMT+12:45'
  | 'GMT+13:00'
  | 'GMT+13:45'
  | 'GMT+14:00'
)[];
export declare function isTimezoneGreenwich(
  value: unknown,
): value is TimezoneGreenwich;
