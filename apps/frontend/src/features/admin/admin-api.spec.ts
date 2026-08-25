import { describe, expect, it, vi } from 'vitest';

import { fetchAdminOverview } from './admin-api';

describe('admin API', () => {
  it('loads the protected overview with session credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: () =>
        Promise.resolve({
          ok: true,
          data: {
            totalUsers: 42,
            verifiedUsers: 36,
            activeSessions: 12,
            newUsersLast7Days: 7,
            superAdmins: 1,
            generatedAt: '2026-07-28T00:00:00.000Z',
          },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchAdminOverview()).resolves.toMatchObject({
      totalUsers: 42,
      superAdmins: 1,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/V1/admin/overview',
      expect.objectContaining({ credentials: 'include' }),
    );
  });
});
