import { afterEach, describe, expect, it, vi } from 'vitest';

import { deleteEntity, fetchEntities, updateEntity } from './entity-api';

describe('entity API', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('searches a paginated allowlisted entity', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: () =>
        Promise.resolve({
          ok: true,
          data: {
            entity: 'users',
            records: [{ id: 'user-1', username: 'Sinless777' }],
            total: 1,
            page: 1,
            pageSize: 25,
          },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchEntities('users', 'Sinless777', 1),
    ).resolves.toMatchObject({
      total: 1,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/V1/admin/entities/users?search=Sinless777&page=1&pageSize=25',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('updates and deletes through explicit mutation methods', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ ok: true, data: { id: 'user-1' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await updateEntity('users', 'user-1', { status: 'suspended' });
    await deleteEntity('users', 'user-1');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/V1/admin/entities/users/user-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'suspended' }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/V1/admin/entities/users/user-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
