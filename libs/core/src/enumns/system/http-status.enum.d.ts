/**
 * Standard HTTP status codes.
 */
export declare const HttpStatus: {
  readonly Continue: 100;
  readonly SwitchingProtocols: 101;
  readonly Processing: 102;
  readonly EarlyHints: 103;
  readonly Ok: 200;
  readonly Created: 201;
  readonly Accepted: 202;
  readonly NonAuthoritativeInformation: 203;
  readonly NoContent: 204;
  readonly ResetContent: 205;
  readonly PartialContent: 206;
  readonly MultipleChoices: 300;
  readonly MovedPermanently: 301;
  readonly Found: 302;
  readonly SeeOther: 303;
  readonly NotModified: 304;
  readonly TemporaryRedirect: 307;
  readonly PermanentRedirect: 308;
  readonly BadRequest: 400;
  readonly Unauthorized: 401;
  readonly PaymentRequired: 402;
  readonly Forbidden: 403;
  readonly NotFound: 404;
  readonly MethodNotAllowed: 405;
  readonly NotAcceptable: 406;
  readonly RequestTimeout: 408;
  readonly Conflict: 409;
  readonly Gone: 410;
  readonly UnsupportedMediaType: 415;
  readonly UnprocessableEntity: 422;
  readonly TooManyRequests: 429;
  readonly InternalServerError: 500;
  readonly NotImplemented: 501;
  readonly BadGateway: 502;
  readonly ServiceUnavailable: 503;
  readonly GatewayTimeout: 504;
};
export type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus];
export declare const HttpStatusValues: (
  | 100
  | 400
  | 401
  | 402
  | 403
  | 404
  | 405
  | 406
  | 408
  | 409
  | 410
  | 415
  | 422
  | 429
  | 500
  | 501
  | 502
  | 503
  | 504
  | 101
  | 102
  | 103
  | 200
  | 201
  | 202
  | 203
  | 204
  | 205
  | 206
  | 300
  | 301
  | 302
  | 303
  | 304
  | 307
  | 308
)[];
export declare const HttpStatusText: {
  readonly 100: 'Continue';
  readonly 101: 'Switching Protocols';
  readonly 102: 'Processing';
  readonly 103: 'Early Hints';
  readonly 200: 'OK';
  readonly 201: 'Created';
  readonly 202: 'Accepted';
  readonly 203: 'Non-Authoritative Information';
  readonly 204: 'No Content';
  readonly 205: 'Reset Content';
  readonly 206: 'Partial Content';
  readonly 300: 'Multiple Choices';
  readonly 301: 'Moved Permanently';
  readonly 302: 'Found';
  readonly 303: 'See Other';
  readonly 304: 'Not Modified';
  readonly 307: 'Temporary Redirect';
  readonly 308: 'Permanent Redirect';
  readonly 400: 'Bad Request';
  readonly 401: 'Unauthorized';
  readonly 402: 'Payment Required';
  readonly 403: 'Forbidden';
  readonly 404: 'Not Found';
  readonly 405: 'Method Not Allowed';
  readonly 406: 'Not Acceptable';
  readonly 408: 'Request Timeout';
  readonly 409: 'Conflict';
  readonly 410: 'Gone';
  readonly 415: 'Unsupported Media Type';
  readonly 422: 'Unprocessable Entity';
  readonly 429: 'Too Many Requests';
  readonly 500: 'Internal Server Error';
  readonly 501: 'Not Implemented';
  readonly 502: 'Bad Gateway';
  readonly 503: 'Service Unavailable';
  readonly 504: 'Gateway Timeout';
};
export declare function isHttpStatus(value: unknown): value is HttpStatus;
