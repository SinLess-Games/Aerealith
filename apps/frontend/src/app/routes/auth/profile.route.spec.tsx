// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ProfileStatus } from '@aerealith-ai/core';
import { describe, expect, it, vi } from 'vitest';

import { ProfileRoute } from './profile.route';

const profile = {
  id: '0191ef35-d3c2-74d8-bb2c-253724e5bca9',
  userId: '0191ef35-d3c2-74d8-bb2c-253724e5bca8',
  handle: 'ada',
  displayName: 'Ada',
  givenName: null,
  middleName: null,
  familyName: null,
  pronouns: null,
  avatarUrl: null,
  bannerUrl: null,
  bio: null,
  status: ProfileStatus.Active,
  fieldVisibility: {},
  locationLabel: null,
  country: null,
  gender: null,
  sex: null,
  sexuality: null,
  romanticOrientation: null,
  sexAttitude: null,
  languages: [],
  websiteUrl: null,
  links: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ProfileRoute', () => {
  it('loads and saves owner-editable profile values', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ ok: true, data: profile }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: () =>
          Promise.resolve({
            ok: true,
            data: { ...profile, displayName: 'Ada Lovelace' },
          }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <ProfileRoute />
      </QueryClientProvider>,
    );

    const displayName = await screen.findByLabelText('Display name');
    fireEvent.change(displayName, { target: { value: 'Ada Lovelace' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/V1/profile',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('Ada Lovelace'),
        }),
      ),
    );
    expect(
      await screen.findByText('Your profile has been saved.'),
    ).toBeTruthy();

    vi.unstubAllGlobals();
  });
});
