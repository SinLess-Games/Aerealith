import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchProfile, updateProfile } from './profile-api';

describe('profile API', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads and updates the authenticated profile', async () => {
    const profile = { id: 'profile-1', handle: 'ada' };
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ ok: true, data: profile }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchProfile()).resolves.toEqual(profile);
    await updateProfile({ displayName: 'Ada Lovelace' });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/V1/profile',
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify({ displayName: 'Ada Lovelace' }),
      }),
    );
  });
});
