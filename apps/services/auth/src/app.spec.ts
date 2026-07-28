import { describe, expect, it } from 'vitest';

import app from './main';

describe('auth service', () => {
  it('preserves its service status endpoint', async () => {
    const response = await app.request('/api/v1/services/auth');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      service: 'auth',
      status: 'ok',
    });
    expect(response.headers.get('x-request-id')).toBeTruthy();
  });
});
