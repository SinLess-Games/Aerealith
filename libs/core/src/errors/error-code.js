'use strict';
// libs/core/src/errors/error-code.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.ErrorCodeValues = void 0;
exports.isErrorCode = isErrorCode;
const errors_1 = require('../enumns/system/errors');
exports.ErrorCodeValues = [
  ...Object.values(errors_1.AuthErrorCode),
  ...Object.values(errors_1.CommonErrorCode),
  ...Object.values(errors_1.DatabaseErrorCode),
  ...Object.values(errors_1.UserErrorCode),
];
function isErrorCode(value) {
  return typeof value === 'string' && exports.ErrorCodeValues.includes(value);
}
//# sourceMappingURL=error-code.js.map
