// libs/core/src/types/timestamp.type.ts

/**
 * A timestamp stored internally as a JavaScript Date.
 */
export type Timestamp = Date;

/**
 * A timestamp serialized as an ISO 8601 string.
 *
 * Example: 2026-06-20T22:15:00.000Z
 */
export type IsoTimestamp = string;