/** Preserves headers written through Hono when an adapter returns a Response. */
export function mergeHonoResponseHeaders(
  response: Response,
  honoHeaders: Headers,
): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of honoHeaders) {
    if (name.toLowerCase() === 'set-cookie') {
      headers.append(name, value);
    } else if (!headers.has(name)) {
      headers.set(name, value);
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
