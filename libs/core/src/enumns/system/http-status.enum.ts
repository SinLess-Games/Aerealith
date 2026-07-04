// libs/core/src/enumns/system/http-status.enum.ts

/**
 * Standard HTTP status codes.
 */
export const HttpStatus = {
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
} as const

export type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus]

export const HttpStatusValues = Object.values(HttpStatus)

export const HttpStatusText = {
  [HttpStatus.Continue]: 'Continue',
  [HttpStatus.SwitchingProtocols]: 'Switching Protocols',
  [HttpStatus.Processing]: 'Processing',
  [HttpStatus.EarlyHints]: 'Early Hints',

  [HttpStatus.Ok]: 'OK',
  [HttpStatus.Created]: 'Created',
  [HttpStatus.Accepted]: 'Accepted',
  [HttpStatus.NonAuthoritativeInformation]: 'Non-Authoritative Information',
  [HttpStatus.NoContent]: 'No Content',
  [HttpStatus.ResetContent]: 'Reset Content',
  [HttpStatus.PartialContent]: 'Partial Content',

  [HttpStatus.MultipleChoices]: 'Multiple Choices',
  [HttpStatus.MovedPermanently]: 'Moved Permanently',
  [HttpStatus.Found]: 'Found',
  [HttpStatus.SeeOther]: 'See Other',
  [HttpStatus.NotModified]: 'Not Modified',
  [HttpStatus.TemporaryRedirect]: 'Temporary Redirect',
  [HttpStatus.PermanentRedirect]: 'Permanent Redirect',

  [HttpStatus.BadRequest]: 'Bad Request',
  [HttpStatus.Unauthorized]: 'Unauthorized',
  [HttpStatus.PaymentRequired]: 'Payment Required',
  [HttpStatus.Forbidden]: 'Forbidden',
  [HttpStatus.NotFound]: 'Not Found',
  [HttpStatus.MethodNotAllowed]: 'Method Not Allowed',
  [HttpStatus.NotAcceptable]: 'Not Acceptable',
  [HttpStatus.RequestTimeout]: 'Request Timeout',
  [HttpStatus.Conflict]: 'Conflict',
  [HttpStatus.Gone]: 'Gone',
  [HttpStatus.UnsupportedMediaType]: 'Unsupported Media Type',
  [HttpStatus.UnprocessableEntity]: 'Unprocessable Entity',
  [HttpStatus.TooManyRequests]: 'Too Many Requests',

  [HttpStatus.InternalServerError]: 'Internal Server Error',
  [HttpStatus.NotImplemented]: 'Not Implemented',
  [HttpStatus.BadGateway]: 'Bad Gateway',
  [HttpStatus.ServiceUnavailable]: 'Service Unavailable',
  [HttpStatus.GatewayTimeout]: 'Gateway Timeout',
} as const satisfies Record<HttpStatus, string>

export function isHttpStatus(value: unknown): value is HttpStatus {
  return (
    typeof value === 'number' && HttpStatusValues.includes(value as HttpStatus)
  )
}
