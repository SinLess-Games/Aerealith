/**
 * Returns true when a value is not `null` or `undefined`.
 *
 * Useful for filtering optional values while preserving TypeScript types.
 */
export declare function isDefined<T>(value: T | null | undefined): value is T;
