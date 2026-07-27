export function isPlainObject(value: unknown): value is Record<string, unknown>;
/** Returns whether a value is an object literal or has a null prototype. */
export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}
