'use strict';
// libs/core/src/errors/aerealith.error.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.AerealithError = void 0;
const enumns_1 = require('../enumns');
/**
 * Standard application error.
 *
 * Use this error for known application failures.
 * Keep sensitive details out of `message` and `details` when the error may
 * be returned by an API.
 */
class AerealithError extends Error {
  code;
  statusCode;
  details;
  originalCause;
  constructor(message, options = {}) {
    super(message);
    this.name = 'AerealithError';
    this.code = options.code ?? enumns_1.CommonErrorCode.INTERNAL_ERROR;
    this.statusCode =
      options.statusCode ??
      enumns_1.HttpErrorCode.INTERNAL_SERVER_ERROR.statusCode;
    this.details = options.details;
    this.originalCause = options.cause;
  }
  get isClientError() {
    return this.statusCode >= 400 && this.statusCode < 500;
  }
  get isServerError() {
    return this.statusCode >= 500;
  }
  hasCode(code) {
    return this.code === code;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}
exports.AerealithError = AerealithError;
//# sourceMappingURL=aerealith.error.js.map
