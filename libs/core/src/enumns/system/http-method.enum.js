'use strict';
// libs/core/src/enumns/system/http-method.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.HttpMethodValues = exports.HttpMethod = void 0;
exports.isHttpMethod = isHttpMethod;
/**
 * Supported HTTP request methods.
 */
exports.HttpMethod = {
  Get: 'GET',
  Post: 'POST',
  Put: 'PUT',
  Patch: 'PATCH',
  Delete: 'DELETE',
  Options: 'OPTIONS',
  Head: 'HEAD',
};
exports.HttpMethodValues = Object.values(exports.HttpMethod);
function isHttpMethod(value) {
  return typeof value === 'string' && exports.HttpMethodValues.includes(value);
}
//# sourceMappingURL=http-method.enum.js.map
