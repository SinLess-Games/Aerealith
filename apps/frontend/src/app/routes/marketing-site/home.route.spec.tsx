// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FeatureFlag } from '@aerealith-ai/core';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { StaticFeatureFlagsProvider } from '../../../features/flags/feature-flags';
import { HomeRoute } from './home.route';

describe('HomeRoute waitlist', () => {
  it('submits the waitlist form with explicit newsletter consent', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: () =>
        Promise.resolve({
          ok: true,
          data: { joined: true, newsletterSubscribed: true },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <StaticFeatureFlagsProvider values={{ [FeatureFlag.Waitlist]: true }}>
            <HomeRoute />
          </StaticFeatureFlagsProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'hello@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Your role'), {
      target: { value: 'Developer' },
    });
    fireEvent.click(screen.getByLabelText(/also join the newsletter/i));
    fireEvent.click(screen.getByRole('button', { name: /join waitlist/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/V1/waitlist',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'hello@example.com',
            role: 'Developer',
            newsletter: true,
          }),
        }),
      ),
    );
    expect(
      await screen.findByText(/subscribed to the newsletter/i),
    ).toBeTruthy();

    vi.unstubAllGlobals();
  });
});
