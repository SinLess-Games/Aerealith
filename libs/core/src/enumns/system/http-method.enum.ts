// libs/core/src/enumns/system/http-method.enum.ts

/**
 * Supported HTTP request methods.
 */
export const HttpMethod = {
  Get: 'GET',
  Post: 'POST',
  Put: 'PUT',
  Patch: 'PATCH',
  Delete: 'DELETE',
  Options: 'OPTIONS',
  Head: 'HEAD',
} as const;

export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];

export const HttpMethodValues = Object.values(HttpMethod);

export function isHttpMethod(value: unknown): value is HttpMethod {
  return (
    typeof value === 'string' &&
    HttpMethodValues.includes(value as HttpMethod)
  );
}