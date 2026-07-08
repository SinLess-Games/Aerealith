'use strict';
// libs/core/src/utils/assert-never.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.assertNever = assertNever;
const enumns_1 = require('../enumns');
const errors_1 = require('../errors');
/**
 * Throws an Aerealith error when an exhaustive branch is missed.
 */
function assertNever(value, message = 'Unexpected value.') {
  return (0, errors_1.throwError)(message, {
    code: enumns_1.CommonErrorCode.INTERNAL_ERROR,
    details: { value },
  });
}
//# sourceMappingURL=assert-never.js.map
