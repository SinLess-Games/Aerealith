import { afterEach, describe, expect, it, vi } from 'vitest';

import { joinWaitlist } from './waitlist-api';

describe('waitlist API', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('submits waitlist and newsletter consent together', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: () =>
        Promise.resolve({
          ok: true,
          data: { joined: true, newsletterSubscribed: true },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await joinWaitlist({
      email: 'hello@example.com',
      role: 'Developer',
      newsletter: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/V1/waitlist',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          email: 'hello@example.com',
          role: 'Developer',
          newsletter: true,
        }),
      }),
    );
  });
});
