import { describe, expect, it } from 'vitest';

import { mergeHonoResponseHeaders } from './merge-hono-response-headers';

describe('mergeHonoResponseHeaders', () => {
  it('preserves response headers and adds missing Hono headers', async () => {
    const response = mergeHonoResponseHeaders(
      new Response('payload', {
        status: 201,
        statusText: 'Created',
        headers: { 'content-type': 'text/plain', 'x-existing': 'response' },
      }),
      new Headers({ 'x-existing': 'hono', 'x-request-id': 'request-1' }),
    );

    expect(response.status).toBe(201);
    expect(response.statusText).toBe('Created');
    expect(response.headers.get('x-existing')).toBe('response');
    expect(response.headers.get('x-request-id')).toBe('request-1');
    await expect(response.text()).resolves.toBe('payload');
  });

  it('appends cookies instead of replacing response cookies', () => {
    const responseHeaders = new Headers();
    responseHeaders.append('set-cookie', 'session=one; Path=/');
    const honoHeaders = new Headers();
    honoHeaders.append('set-cookie', 'theme=dark; Path=/');

    const response = mergeHonoResponseHeaders(
      new Response(null, { headers: responseHeaders }),
      honoHeaders,
    );

    expect(response.headers.get('set-cookie')).toContain('session=one');
    expect(response.headers.get('set-cookie')).toContain('theme=dark');
  });
});
