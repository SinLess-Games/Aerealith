// libs/core/src/utils/is-defined.ts

/**
 * Returns true when a value is not `null` or `undefined`.
 *
 * Useful for filtering optional values while preserving TypeScript types.
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}
