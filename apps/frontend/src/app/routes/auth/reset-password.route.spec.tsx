// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { ResetPasswordRoute } from './reset-password.route';

const { completePasswordReset } = vi.hoisted(() => ({
  completePasswordReset: vi.fn().mockResolvedValue(null),
}));
vi.mock('../../../features/auth/auth-api', () => ({ completePasswordReset }));

function renderRoute(entry: string) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={[entry]}>
        <ResetPasswordRoute />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ResetPasswordRoute', () => {
  it('explains when the secure token is missing', () => {
    renderRoute('/reset-password');
    expect(
      screen.getByRole('heading', { name: /reset link unavailable/i }),
    ).toBeTruthy();
  });

  it('requires the password policy before completing a reset', async () => {
    renderRoute('/reset-password?token=token-1');
    const password = screen.getByLabelText(/new password/i);
    fireEvent.change(password, { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));
    expect(screen.getByText(/does not meet the required policy/i)).toBeTruthy();
    expect(completePasswordReset).not.toHaveBeenCalled();

    fireEvent.change(password, { target: { value: 'StrongPassword1' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));
    expect(
      await screen.findByRole('heading', { name: /password updated/i }),
    ).toBeTruthy();
    expect(completePasswordReset).toHaveBeenCalledWith(
      { token: 'token-1', newPassword: 'StrongPassword1' },
      expect.any(Object),
    );
  });
});
