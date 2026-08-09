// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { ForgotPasswordRoute } from './forgot-password.route';

const { requestPasswordReset } = vi.hoisted(() => ({
  requestPasswordReset: vi.fn().mockResolvedValue(null),
}));
vi.mock('../../../features/auth/auth-api', () => ({ requestPasswordReset }));

function renderRoute() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <ForgotPasswordRoute />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ForgotPasswordRoute', () => {
  it('keeps malformed email addresses client-side', () => {
    renderRoute();
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'not-an-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(screen.getByText(/enter a valid email address/i)).toBeTruthy();
    expect(
      screen.getByLabelText(/email address/i).getAttribute('aria-invalid'),
    ).toBe('true');
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it('submits an email then gives the account-private recovery response', async () => {
    renderRoute();
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(
      await screen.findByText(/whether or not an account exists/i),
    ).toBeTruthy();
    expect(requestPasswordReset).toHaveBeenCalledWith(
      { email: 'ada@example.com' },
      expect.any(Object),
    );
  });
});
