/**
 * User-selectable measurement system preferences.
 */
export declare const MeasurementSystem: {
  readonly Unspecified: 'unspecified';
  readonly Imperial: 'imperial';
  readonly Metric: 'metric';
  readonly Scientific: 'scientific';
};
export type MeasurementSystem =
  (typeof MeasurementSystem)[keyof typeof MeasurementSystem];
export declare const DefaultMeasurementSystem: 'metric';
export declare const MeasurementSystemValues: (
  'unspecified' | 'imperial' | 'metric' | 'scientific'
)[];
export declare function isMeasurementSystem(
  value: unknown,
): value is MeasurementSystem;
