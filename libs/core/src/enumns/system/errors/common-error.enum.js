'use strict';
// libs/core/src/enumns/system/errors/common-error.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.CommonErrorCodeValues = exports.CommonErrorCode = void 0;
exports.isCommonErrorCode = isCommonErrorCode;
/**
 * General application and HTTP error codes.
 *
 * Use domain-specific error codes when possible:
 * - AuthErrorCode for authentication and authorization
 * - UserErrorCode for user/account domain failures
 * - CommonErrorCode for shared request, resource, and service failures
 */
exports.CommonErrorCode = {
  // HTTP and request access.
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  CONFLICT: 'CONFLICT',
  // Validation and request data.
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_CONTENT_TYPE: 'INVALID_CONTENT_TYPE',
  INVALID_ORIGIN: 'INVALID_ORIGIN',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  // Request handling.
  RATE_LIMITED: 'RATE_LIMITED',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  REQUEST_CANCELLED: 'REQUEST_CANCELLED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  PARSE_ERROR: 'PARSE_ERROR',
  // Resources and operations.
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',
  RESOURCE_EXPIRED: 'RESOURCE_EXPIRED',
  OPERATION_FAILED: 'OPERATION_FAILED',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  OPERATION_TIMEOUT: 'OPERATION_TIMEOUT',
  // Features and dependencies.
  FEATURE_DISABLED: 'FEATURE_DISABLED',
  FEATURE_UNAVAILABLE: 'FEATURE_UNAVAILABLE',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  DEPENDENCY_UNAVAILABLE: 'DEPENDENCY_UNAVAILABLE',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  // Server failures.
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};
exports.CommonErrorCodeValues = Object.values(exports.CommonErrorCode);
function isCommonErrorCode(value) {
  return (
    typeof value === 'string' && exports.CommonErrorCodeValues.includes(value)
  );
}
//# sourceMappingURL=common-error.enum.js.map
