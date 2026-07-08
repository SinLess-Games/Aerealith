/**
 * Standard HTTP client and server error definitions.
 *
 * Use this for HTTP transport failures.
 * Use domain-specific error codes such as `AuthErrorCode` or `UserErrorCode`
 * to explain the actual business failure.
 */
export declare const HttpErrorCode: {
  readonly BAD_REQUEST: {
    readonly statusCode: 400;
    readonly reason: 'Bad Request';
    readonly meaning: 'The request was invalid, malformed, or could not be understood by the server.';
  };
  readonly UNAUTHORIZED: {
    readonly statusCode: 401;
    readonly reason: 'Unauthorized';
    readonly meaning: 'Authentication is required or the supplied authentication credentials are invalid.';
  };
  readonly PAYMENT_REQUIRED: {
    readonly statusCode: 402;
    readonly reason: 'Payment Required';
    readonly meaning: 'The requested feature or resource requires an eligible subscription or payment.';
  };
  readonly FORBIDDEN: {
    readonly statusCode: 403;
    readonly reason: 'Forbidden';
    readonly meaning: 'The authenticated client does not have permission to access this resource.';
  };
  readonly NOT_FOUND: {
    readonly statusCode: 404;
    readonly reason: 'Not Found';
    readonly meaning: 'The requested resource does not exist.';
  };
  readonly METHOD_NOT_ALLOWED: {
    readonly statusCode: 405;
    readonly reason: 'Method Not Allowed';
    readonly meaning: 'The HTTP method is not supported for the requested resource.';
  };
  readonly NOT_ACCEPTABLE: {
    readonly statusCode: 406;
    readonly reason: 'Not Acceptable';
    readonly meaning: 'The server cannot produce a response that matches the requested content type.';
  };
  readonly PROXY_AUTHENTICATION_REQUIRED: {
    readonly statusCode: 407;
    readonly reason: 'Proxy Authentication Required';
    readonly meaning: 'Authentication with an intermediary proxy is required before the request can continue.';
  };
  readonly REQUEST_TIMEOUT: {
    readonly statusCode: 408;
    readonly reason: 'Request Timeout';
    readonly meaning: 'The client did not complete the request within the allowed time.';
  };
  readonly CONFLICT: {
    readonly statusCode: 409;
    readonly reason: 'Conflict';
    readonly meaning: 'The request conflicts with the current state of the resource.';
  };
  readonly GONE: {
    readonly statusCode: 410;
    readonly reason: 'Gone';
    readonly meaning: 'The requested resource is permanently unavailable and is not expected to return.';
  };
  readonly LENGTH_REQUIRED: {
    readonly statusCode: 411;
    readonly reason: 'Length Required';
    readonly meaning: 'The request requires a valid Content-Length header.';
  };
  readonly PRECONDITION_FAILED: {
    readonly statusCode: 412;
    readonly reason: 'Precondition Failed';
    readonly meaning: 'One or more conditions required by the request were not met.';
  };
  readonly PAYLOAD_TOO_LARGE: {
    readonly statusCode: 413;
    readonly reason: 'Content Too Large';
    readonly meaning: 'The request body is larger than the server is willing or able to process.';
  };
  readonly URI_TOO_LONG: {
    readonly statusCode: 414;
    readonly reason: 'URI Too Long';
    readonly meaning: 'The request URI is longer than the server is willing to process.';
  };
  readonly UNSUPPORTED_MEDIA_TYPE: {
    readonly statusCode: 415;
    readonly reason: 'Unsupported Media Type';
    readonly meaning: 'The request body uses a media type the server does not support.';
  };
  readonly RANGE_NOT_SATISFIABLE: {
    readonly statusCode: 416;
    readonly reason: 'Range Not Satisfiable';
    readonly meaning: 'The requested byte range cannot be served for this resource.';
  };
  readonly EXPECTATION_FAILED: {
    readonly statusCode: 417;
    readonly reason: 'Expectation Failed';
    readonly meaning: 'The server cannot meet the requirements specified by the Expect request header.';
  };
  readonly IM_A_TEAPOT: {
    readonly statusCode: 418;
    readonly reason: "I'm a Teapot";
    readonly meaning: 'A reserved humorous status code. Do not use this for application errors.';
  };
  readonly MISDIRECTED_REQUEST: {
    readonly statusCode: 421;
    readonly reason: 'Misdirected Request';
    readonly meaning: 'The request was sent to a server that cannot produce a response for it.';
  };
  readonly UNPROCESSABLE_CONTENT: {
    readonly statusCode: 422;
    readonly reason: 'Unprocessable Content';
    readonly meaning: 'The request was well-formed but contains semantic validation errors.';
  };
  readonly LOCKED: {
    readonly statusCode: 423;
    readonly reason: 'Locked';
    readonly meaning: 'The requested resource is locked and cannot be modified.';
  };
  readonly FAILED_DEPENDENCY: {
    readonly statusCode: 424;
    readonly reason: 'Failed Dependency';
    readonly meaning: 'The request failed because a required dependent operation or resource failed.';
  };
  readonly TOO_EARLY: {
    readonly statusCode: 425;
    readonly reason: 'Too Early';
    readonly meaning: 'The server is unwilling to process a request that could be replayed.';
  };
  readonly UPGRADE_REQUIRED: {
    readonly statusCode: 426;
    readonly reason: 'Upgrade Required';
    readonly meaning: 'The client must switch to a different protocol before continuing.';
  };
  readonly PRECONDITION_REQUIRED: {
    readonly statusCode: 428;
    readonly reason: 'Precondition Required';
    readonly meaning: 'The server requires the request to be conditional to prevent conflicting updates.';
  };
  readonly TOO_MANY_REQUESTS: {
    readonly statusCode: 429;
    readonly reason: 'Too Many Requests';
    readonly meaning: 'The client exceeded the allowed request rate.';
  };
  readonly REQUEST_HEADER_FIELDS_TOO_LARGE: {
    readonly statusCode: 431;
    readonly reason: 'Request Header Fields Too Large';
    readonly meaning: 'One or more request headers are too large to process.';
  };
  readonly UNAVAILABLE_FOR_LEGAL_REASONS: {
    readonly statusCode: 451;
    readonly reason: 'Unavailable For Legal Reasons';
    readonly meaning: 'The resource cannot be provided because of a legal restriction.';
  };
  readonly INTERNAL_SERVER_ERROR: {
    readonly statusCode: 500;
    readonly reason: 'Internal Server Error';
    readonly meaning: 'The server encountered an unexpected error and could not complete the request.';
  };
  readonly NOT_IMPLEMENTED: {
    readonly statusCode: 501;
    readonly reason: 'Not Implemented';
    readonly meaning: 'The server does not support the functionality required to complete the request.';
  };
  readonly BAD_GATEWAY: {
    readonly statusCode: 502;
    readonly reason: 'Bad Gateway';
    readonly meaning: 'The server received an invalid response from an upstream service.';
  };
  readonly SERVICE_UNAVAILABLE: {
    readonly statusCode: 503;
    readonly reason: 'Service Unavailable';
    readonly meaning: 'The service is temporarily unavailable, overloaded, or undergoing maintenance.';
  };
  readonly GATEWAY_TIMEOUT: {
    readonly statusCode: 504;
    readonly reason: 'Gateway Timeout';
    readonly meaning: 'The server did not receive a timely response from an upstream service.';
  };
  readonly HTTP_VERSION_NOT_SUPPORTED: {
    readonly statusCode: 505;
    readonly reason: 'HTTP Version Not Supported';
    readonly meaning: 'The server does not support the HTTP version used by the request.';
  };
  readonly VARIANT_ALSO_NEGOTIATES: {
    readonly statusCode: 506;
    readonly reason: 'Variant Also Negotiates';
    readonly meaning: 'The server has an internal content-negotiation configuration error.';
  };
  readonly INSUFFICIENT_STORAGE: {
    readonly statusCode: 507;
    readonly reason: 'Insufficient Storage';
    readonly meaning: 'The server does not have enough storage available to complete the request.';
  };
  readonly LOOP_DETECTED: {
    readonly statusCode: 508;
    readonly reason: 'Loop Detected';
    readonly meaning: 'The server detected an infinite loop while processing the request.';
  };
  readonly NOT_EXTENDED: {
    readonly statusCode: 510;
    readonly reason: 'Not Extended';
    readonly meaning: 'Further request extensions are required before the server can fulfill the request.';
  };
  readonly NETWORK_AUTHENTICATION_REQUIRED: {
    readonly statusCode: 511;
    readonly reason: 'Network Authentication Required';
    readonly meaning: 'The client must authenticate with the network before access can be granted.';
  };
};
export type HttpErrorCodeKey = keyof typeof HttpErrorCode;
export type HttpErrorCode =
  (typeof HttpErrorCode)[HttpErrorCodeKey]['statusCode'];
export type HttpErrorReason =
  (typeof HttpErrorCode)[HttpErrorCodeKey]['reason'];
export type HttpErrorMeaning =
  (typeof HttpErrorCode)[HttpErrorCodeKey]['meaning'];
export type HttpErrorDefinition = (typeof HttpErrorCode)[HttpErrorCodeKey];
export declare const HttpErrorCodeValues: HttpErrorCode[];
export declare function isHttpErrorCode(value: unknown): value is HttpErrorCode;
export declare function getHttpError(
  code: HttpErrorCodeKey,
): (typeof HttpErrorCode)[HttpErrorCodeKey];
export declare function getHttpErrorByStatus(
  statusCode: HttpErrorCode,
): HttpErrorDefinition | undefined;
