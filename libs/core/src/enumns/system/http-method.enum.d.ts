/**
 * Supported HTTP request methods.
 */
export declare const HttpMethod: {
  readonly Get: 'GET';
  readonly Post: 'POST';
  readonly Put: 'PUT';
  readonly Patch: 'PATCH';
  readonly Delete: 'DELETE';
  readonly Options: 'OPTIONS';
  readonly Head: 'HEAD';
};
export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];
export declare const HttpMethodValues: (
  'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'
)[];
export declare function isHttpMethod(value: unknown): value is HttpMethod;
