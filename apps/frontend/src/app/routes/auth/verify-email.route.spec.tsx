// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { VerifyEmailRoute } from './verify-email.route';

const { verifyEmailMock, resendVerificationMock } = vi.hoisted(() => ({
  verifyEmailMock: vi.fn(),
  resendVerificationMock: vi.fn(),
}));

vi.mock('../../../features/auth/auth-api', () => ({
  verifyEmail: verifyEmailMock,
  resendVerification: resendVerificationMock,
}));

function renderRoute(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <VerifyEmailRoute />
    </MemoryRouter>,
  );
}

describe('VerifyEmailRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('verifies a token once and offers entry to the application', async () => {
    verifyEmailMock.mockResolvedValue({ id: 'user-1' });
    renderRoute('/verify-email?token=token-1');

    expect(screen.getByRole('status').textContent).toContain(
      'keep this page open',
    );
    expect(
      await screen.findByRole('heading', { name: 'Email verified' }),
    ).toBeTruthy();
    expect(verifyEmailMock).toHaveBeenCalledOnce();
    expect(verifyEmailMock).toHaveBeenCalledWith('token-1');
    expect(
      screen
        .getByRole('link', { name: 'Enter Aerealith' })
        .getAttribute('href'),
    ).toBe('/app');
  });

  it('shows verification errors and allows a successful resend', async () => {
    verifyEmailMock.mockRejectedValue(new Error('The token expired.'));
    resendVerificationMock.mockResolvedValue(null);
    renderRoute('/verify-email?token=expired&email=person%40example.com');

    expect(
      await screen.findByRole('heading', { name: 'That link did not work' }),
    ).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveProperty(
      'value',
      'person@example.com',
    );

    fireEvent.submit(
      screen.getByRole('button', { name: /send a new/i }).closest('form')!,
    );
    expect(await screen.findByText(/a fresh link is on its way/i)).toBeTruthy();
    expect(resendVerificationMock).toHaveBeenCalledWith('person@example.com');
  });

  it('reports resend failures and restores the submit button', async () => {
    resendVerificationMock.mockRejectedValue('offline');
    renderRoute('/verify-email');

    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'person@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send a new/i }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Unable to resend the email.',
    );
    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: /send a new/i })
          .hasAttribute('disabled'),
      ).toBe(false),
    );
  });
});
