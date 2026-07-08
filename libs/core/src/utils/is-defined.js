'use strict';
// libs/core/src/utils/is-defined.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.isDefined = isDefined;
/**
 * Returns true when a value is not `null` or `undefined`.
 *
 * Useful for filtering optional values while preserving TypeScript types.
 */
function isDefined(value) {
  return value !== null && value !== undefined;
}
//# sourceMappingURL=is-defined.js.map
