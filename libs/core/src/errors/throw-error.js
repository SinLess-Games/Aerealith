'use strict';
// libs/core/src/errors/throw-error.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.throwError = throwError;
const aerealith_error_1 = require('./aerealith.error');
/**
 * Throws a standard Aerealith application error.
 */
function throwError(message, options = {}) {
  throw new aerealith_error_1.AerealithError(message, options);
}
//# sourceMappingURL=throw-error.js.map
