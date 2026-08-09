// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SignUpRoute } from './sign-up.route';

function renderSignUp() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SignUpRoute />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

afterEach(() => vi.unstubAllGlobals());

describe('SignUpRoute', () => {
  it('submits the registration payload to the sign-up endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 201,
      json: () =>
        Promise.resolve({
          ok: true,
          data: { id: 'u1', username: 'ada', emailVerified: true },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderSignUp();
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Ada Lovelace' },
    });
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'ada' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password1234' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/V1/auth/sign-up',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(sent).toMatchObject({
      username: 'ada',
      email: 'ada@example.com',
      displayName: 'Ada Lovelace',
    });
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/app'),
    );
  });

  it('does not submit a password that fails the shared policy', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderSignUp();
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    expect(screen.getAllByText(/at least 12 characters/i)).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(
      screen.getByLabelText(/password/i).getAttribute('aria-invalid'),
    ).toBe('true');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('associates invalid account identity fields with client-side errors', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderSignUp();
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password1234' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      screen.getByText(/lowercase letters, numbers, or underscores/i),
    ).toBeTruthy();
    expect(screen.getByText(/enter a valid email address/i)).toBeTruthy();
    expect(
      screen.getByLabelText(/^username$/i).getAttribute('aria-invalid'),
    ).toBe('true');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
