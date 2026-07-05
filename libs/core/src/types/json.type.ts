// libs/core/src/types/json.type.ts

/**
 * A JSON primitive value.
 */
export type JsonPrimitive = string | number | boolean | null

/**
 * A JSON object.
 */
export type JsonObject = {
  [key: string]: JsonValue
}

/**
 * A JSON array.
 */
export type JsonArray = JsonValue[]

/**
 * Any valid JSON-compatible value.
 */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray
