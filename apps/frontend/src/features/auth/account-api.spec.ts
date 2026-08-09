import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchAccount, updateAccount } from './account-api';

describe('account API', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads and updates the authenticated profile', async () => {
    const data = {
      user: { id: 'u1', username: 'ada', email: 'ada@example.com' },
      avatarUrl: null,
      timezone: 'UTC',
      locale: 'en-US',
    };
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ ok: true, data }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchAccount()).resolves.toMatchObject({ timezone: 'UTC' });
    await updateAccount({
      username: 'ada',
      email: 'ada@example.com',
      timezone: 'America/Denver',
      locale: 'en-US',
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/V1/account',
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'include',
      }),
    );
  });
});
