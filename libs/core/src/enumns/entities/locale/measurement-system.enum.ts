// libs/core/src/enumns/entities/locale/measurement-system.enum.ts

/**
 * User-selectable measurement system preferences.
 */
export const MeasurementSystem = {
  Unspecified: 'unspecified',
  Imperial: 'imperial',
  Metric: 'metric',
  Scientific: 'scientific',
} as const

export type MeasurementSystem =
  (typeof MeasurementSystem)[keyof typeof MeasurementSystem]

export const DefaultMeasurementSystem = MeasurementSystem.Metric

export const MeasurementSystemValues = Object.values(MeasurementSystem)

export function isMeasurementSystem(
  value: unknown,
): value is MeasurementSystem {
  return (
    typeof value === 'string' &&
    MeasurementSystemValues.includes(value as MeasurementSystem)
  )
}
