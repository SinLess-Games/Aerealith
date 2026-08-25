import { describe, expect, it, vi } from 'vitest';

import app from './worker';
import { createApiServiceApp } from './main';

describe('api service', () => {
  it('uses the canonical uppercase API version path', async () => {
    expect((await app.request('/api/V1/services/api/health')).status).toBe(200);
    expect((await app.request('/api/v1/services/api/health')).status).toBe(404);
  });

  it('joins the waitlist and forwards explicit newsletter consent', async () => {
    const waitlist = {
      join: vi.fn().mockResolvedValue({
        joined: true,
        newsletterSubscribed: true,
      }),
    };
    const testApp = createApiServiceApp({ waitlist });

    const response = await testApp.request('/api/V1/waitlist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: '  HELLO@example.com ',
        role: 'Developer',
        newsletter: true,
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: { joined: true, newsletterSubscribed: true },
    });
    expect(waitlist.join).toHaveBeenCalledWith({
      email: 'hello@example.com',
      role: 'Developer',
      newsletter: true,
    });
  });

  it('rejects an invalid waitlist submission before persistence', async () => {
    const waitlist = { join: vi.fn() };
    const testApp = createApiServiceApp({ waitlist });
    const response = await testApp.request('/api/V1/waitlist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', newsletter: false }),
    });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: 'VALIDATION_FAILED' },
    });
    expect(waitlist.join).not.toHaveBeenCalled();
  });
});
