'use strict';
// libs/core/src/enumns/system/http-status.enum.ts
Object.defineProperty(exports, '__esModule', { value: true });
exports.HttpStatusText = exports.HttpStatusValues = exports.HttpStatus = void 0;
exports.isHttpStatus = isHttpStatus;
/**
 * Standard HTTP status codes.
 */
exports.HttpStatus = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  UnsupportedMediaType: 415,
  UnprocessableEntity: 422,
  TooManyRequests: 429,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
};
exports.HttpStatusValues = Object.values(exports.HttpStatus);
exports.HttpStatusText = {
  [exports.HttpStatus.Continue]: 'Continue',
  [exports.HttpStatus.SwitchingProtocols]: 'Switching Protocols',
  [exports.HttpStatus.Processing]: 'Processing',
  [exports.HttpStatus.EarlyHints]: 'Early Hints',
  [exports.HttpStatus.Ok]: 'OK',
  [exports.HttpStatus.Created]: 'Created',
  [exports.HttpStatus.Accepted]: 'Accepted',
  [exports.HttpStatus.NonAuthoritativeInformation]:
    'Non-Authoritative Information',
  [exports.HttpStatus.NoContent]: 'No Content',
  [exports.HttpStatus.ResetContent]: 'Reset Content',
  [exports.HttpStatus.PartialContent]: 'Partial Content',
  [exports.HttpStatus.MultipleChoices]: 'Multiple Choices',
  [exports.HttpStatus.MovedPermanently]: 'Moved Permanently',
  [exports.HttpStatus.Found]: 'Found',
  [exports.HttpStatus.SeeOther]: 'See Other',
  [exports.HttpStatus.NotModified]: 'Not Modified',
  [exports.HttpStatus.TemporaryRedirect]: 'Temporary Redirect',
  [exports.HttpStatus.PermanentRedirect]: 'Permanent Redirect',
  [exports.HttpStatus.BadRequest]: 'Bad Request',
  [exports.HttpStatus.Unauthorized]: 'Unauthorized',
  [exports.HttpStatus.PaymentRequired]: 'Payment Required',
  [exports.HttpStatus.Forbidden]: 'Forbidden',
  [exports.HttpStatus.NotFound]: 'Not Found',
  [exports.HttpStatus.MethodNotAllowed]: 'Method Not Allowed',
  [exports.HttpStatus.NotAcceptable]: 'Not Acceptable',
  [exports.HttpStatus.RequestTimeout]: 'Request Timeout',
  [exports.HttpStatus.Conflict]: 'Conflict',
  [exports.HttpStatus.Gone]: 'Gone',
  [exports.HttpStatus.UnsupportedMediaType]: 'Unsupported Media Type',
  [exports.HttpStatus.UnprocessableEntity]: 'Unprocessable Entity',
  [exports.HttpStatus.TooManyRequests]: 'Too Many Requests',
  [exports.HttpStatus.InternalServerError]: 'Internal Server Error',
  [exports.HttpStatus.NotImplemented]: 'Not Implemented',
  [exports.HttpStatus.BadGateway]: 'Bad Gateway',
  [exports.HttpStatus.ServiceUnavailable]: 'Service Unavailable',
  [exports.HttpStatus.GatewayTimeout]: 'Gateway Timeout',
};
function isHttpStatus(value) {
  return typeof value === 'number' && exports.HttpStatusValues.includes(value);
}
//# sourceMappingURL=http-status.enum.js.map
