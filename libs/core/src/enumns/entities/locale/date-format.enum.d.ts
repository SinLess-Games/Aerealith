/**
 * User-selectable date display formats.
 */
export declare const DateFormat: {
  readonly Unspecified: 'unspecified';
  readonly Iso8601: 'yyyy-MM-dd';
  readonly Us: 'MM/dd/yyyy';
  readonly European: 'dd/MM/yyyy';
  readonly Long: 'MMMM d, yyyy';
  readonly ShortMonth: 'MMM d, yyyy';
};
export type DateFormat = (typeof DateFormat)[keyof typeof DateFormat];
export declare const DefaultDateFormat: 'yyyy-MM-dd';
export declare const DateFormatValues: (
  | 'unspecified'
  | 'yyyy-MM-dd'
  | 'MM/dd/yyyy'
  | 'dd/MM/yyyy'
  | 'MMMM d, yyyy'
  | 'MMM d, yyyy'
)[];
export declare function isDateFormat(value: unknown): value is DateFormat;
