// libs/core/src/enumns/system/errors/http-error.enum.ts

type HttpErrorDefinitionShape = {
  statusCode: number;
  reason: string;
  meaning: string;
};

/**
 * Standard HTTP client and server error definitions.
 *
 * Use this for HTTP transport failures.
 * Use domain-specific error codes such as `AuthErrorCode` or `UserErrorCode`
 * to explain the actual business failure.
 */
export const HttpErrorCode = {
  // Client errors.
  BAD_REQUEST: {
    statusCode: 400,
    reason: 'Bad Request',
    meaning:
      'The request was invalid, malformed, or could not be understood by the server.',
  },

  UNAUTHORIZED: {
    statusCode: 401,
    reason: 'Unauthorized',
    meaning:
      'Authentication is required or the supplied authentication credentials are invalid.',
  },

  PAYMENT_REQUIRED: {
    statusCode: 402,
    reason: 'Payment Required',
    meaning:
      'The requested feature or resource requires an eligible subscription or payment.',
  },

  FORBIDDEN: {
    statusCode: 403,
    reason: 'Forbidden',
    meaning:
      'The authenticated client does not have permission to access this resource.',
  },

  NOT_FOUND: {
    statusCode: 404,
    reason: 'Not Found',
    meaning: 'The requested resource does not exist.',
  },

  METHOD_NOT_ALLOWED: {
    statusCode: 405,
    reason: 'Method Not Allowed',
    meaning:
      'The HTTP method is not supported for the requested resource.',
  },

  NOT_ACCEPTABLE: {
    statusCode: 406,
    reason: 'Not Acceptable',
    meaning:
      'The server cannot produce a response that matches the requested content type.',
  },

  PROXY_AUTHENTICATION_REQUIRED: {
    statusCode: 407,
    reason: 'Proxy Authentication Required',
    meaning:
      'Authentication with an intermediary proxy is required before the request can continue.',
  },

  REQUEST_TIMEOUT: {
    statusCode: 408,
    reason: 'Request Timeout',
    meaning: 'The client did not complete the request within the allowed time.',
  },

  CONFLICT: {
    statusCode: 409,
    reason: 'Conflict',
    meaning: 'The request conflicts with the current state of the resource.',
  },

  GONE: {
    statusCode: 410,
    reason: 'Gone',
    meaning:
      'The requested resource is permanently unavailable and is not expected to return.',
  },

  LENGTH_REQUIRED: {
    statusCode: 411,
    reason: 'Length Required',
    meaning: 'The request requires a valid Content-Length header.',
  },

  PRECONDITION_FAILED: {
    statusCode: 412,
    reason: 'Precondition Failed',
    meaning: 'One or more conditions required by the request were not met.',
  },

  PAYLOAD_TOO_LARGE: {
    statusCode: 413,
    reason: 'Content Too Large',
    meaning:
      'The request body is larger than the server is willing or able to process.',
  },

  URI_TOO_LONG: {
    statusCode: 414,
    reason: 'URI Too Long',
    meaning: 'The request URI is longer than the server is willing to process.',
  },

  UNSUPPORTED_MEDIA_TYPE: {
    statusCode: 415,
    reason: 'Unsupported Media Type',
    meaning: 'The request body uses a media type the server does not support.',
  },

  RANGE_NOT_SATISFIABLE: {
    statusCode: 416,
    reason: 'Range Not Satisfiable',
    meaning: 'The requested byte range cannot be served for this resource.',
  },

  EXPECTATION_FAILED: {
    statusCode: 417,
    reason: 'Expectation Failed',
    meaning:
      'The server cannot meet the requirements specified by the Expect request header.',
  },

  IM_A_TEAPOT: {
    statusCode: 418,
    reason: "I'm a Teapot",
    meaning:
      'A reserved humorous status code. Do not use this for application errors.',
  },

  MISDIRECTED_REQUEST: {
    statusCode: 421,
    reason: 'Misdirected Request',
    meaning:
      'The request was sent to a server that cannot produce a response for it.',
  },

  UNPROCESSABLE_CONTENT: {
    statusCode: 422,
    reason: 'Unprocessable Content',
    meaning:
      'The request was well-formed but contains semantic validation errors.',
  },

  LOCKED: {
    statusCode: 423,
    reason: 'Locked',
    meaning: 'The requested resource is locked and cannot be modified.',
  },

  FAILED_DEPENDENCY: {
    statusCode: 424,
    reason: 'Failed Dependency',
    meaning:
      'The request failed because a required dependent operation or resource failed.',
  },

  TOO_EARLY: {
    statusCode: 425,
    reason: 'Too Early',
    meaning:
      'The server is unwilling to process a request that could be replayed.',
  },

  UPGRADE_REQUIRED: {
    statusCode: 426,
    reason: 'Upgrade Required',
    meaning:
      'The client must switch to a different protocol before continuing.',
  },

  PRECONDITION_REQUIRED: {
    statusCode: 428,
    reason: 'Precondition Required',
    meaning:
      'The server requires the request to be conditional to prevent conflicting updates.',
  },

  TOO_MANY_REQUESTS: {
    statusCode: 429,
    reason: 'Too Many Requests',
    meaning: 'The client exceeded the allowed request rate.',
  },

  REQUEST_HEADER_FIELDS_TOO_LARGE: {
    statusCode: 431,
    reason: 'Request Header Fields Too Large',
    meaning: 'One or more request headers are too large to process.',
  },

  UNAVAILABLE_FOR_LEGAL_REASONS: {
    statusCode: 451,
    reason: 'Unavailable For Legal Reasons',
    meaning:
      'The resource cannot be provided because of a legal restriction.',
  },

  // Server errors.
  INTERNAL_SERVER_ERROR: {
    statusCode: 500,
    reason: 'Internal Server Error',
    meaning:
      'The server encountered an unexpected error and could not complete the request.',
  },

  NOT_IMPLEMENTED: {
    statusCode: 501,
    reason: 'Not Implemented',
    meaning:
      'The server does not support the functionality required to complete the request.',
  },

  BAD_GATEWAY: {
    statusCode: 502,
    reason: 'Bad Gateway',
    meaning: 'The server received an invalid response from an upstream service.',
  },

  SERVICE_UNAVAILABLE: {
    statusCode: 503,
    reason: 'Service Unavailable',
    meaning:
      'The service is temporarily unavailable, overloaded, or undergoing maintenance.',
  },

  GATEWAY_TIMEOUT: {
    statusCode: 504,
    reason: 'Gateway Timeout',
    meaning:
      'The server did not receive a timely response from an upstream service.',
  },

  HTTP_VERSION_NOT_SUPPORTED: {
    statusCode: 505,
    reason: 'HTTP Version Not Supported',
    meaning:
      'The server does not support the HTTP version used by the request.',
  },

  VARIANT_ALSO_NEGOTIATES: {
    statusCode: 506,
    reason: 'Variant Also Negotiates',
    meaning:
      'The server has an internal content-negotiation configuration error.',
  },

  INSUFFICIENT_STORAGE: {
    statusCode: 507,
    reason: 'Insufficient Storage',
    meaning:
      'The server does not have enough storage available to complete the request.',
  },

  LOOP_DETECTED: {
    statusCode: 508,
    reason: 'Loop Detected',
    meaning:
      'The server detected an infinite loop while processing the request.',
  },

  NOT_EXTENDED: {
    statusCode: 510,
    reason: 'Not Extended',
    meaning:
      'Further request extensions are required before the server can fulfill the request.',
  },

  NETWORK_AUTHENTICATION_REQUIRED: {
    statusCode: 511,
    reason: 'Network Authentication Required',
    meaning:
      'The client must authenticate with the network before access can be granted.',
  },
} as const satisfies Record<string, HttpErrorDefinitionShape>;

export type HttpErrorCodeKey = keyof typeof HttpErrorCode;

export type HttpErrorCode =
  (typeof HttpErrorCode)[HttpErrorCodeKey]['statusCode'];

export type HttpErrorReason =
  (typeof HttpErrorCode)[HttpErrorCodeKey]['reason'];

export type HttpErrorMeaning =
  (typeof HttpErrorCode)[HttpErrorCodeKey]['meaning'];

export type HttpErrorDefinition =
  (typeof HttpErrorCode)[HttpErrorCodeKey];

export const HttpErrorCodeValues = Object.values(HttpErrorCode).map(
  ({ statusCode }) => statusCode,
) as HttpErrorCode[];

export function isHttpErrorCode(value: unknown): value is HttpErrorCode {
  return (
    typeof value === 'number' &&
    HttpErrorCodeValues.includes(value as HttpErrorCode)
  );
}

export function getHttpError(
  code: HttpErrorCodeKey,
): (typeof HttpErrorCode)[HttpErrorCodeKey] {
  return HttpErrorCode[code];
}

export function getHttpErrorByStatus(
  statusCode: HttpErrorCode,
): HttpErrorDefinition | undefined {
  return Object.values(HttpErrorCode).find(
    (error) => error.statusCode === statusCode,
  );
}