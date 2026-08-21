// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@aerealith-ai/ui', () => ({
  Dialog: ({
    children,
    onOpenChange,
  }: Readonly<{
    children: ReactNode;
    onOpenChange: (open: boolean) => void;
  }>) => (
    <div>
      <button type="button" onClick={() => onOpenChange(true)}>
        Keep open
      </button>
      <button type="button" onClick={() => onOpenChange(false)}>
        Dismiss dialog
      </button>
      {children}
    </div>
  ),
  DialogContent: ({ children, ...properties }: ComponentProps<'div'>) => (
    <div {...properties}>{children}</div>
  ),
  DialogOverlay: () => <div data-testid="dialog-overlay" />,
}));

import { AuthModal } from './auth-modal';

describe('AuthModal', () => {
  beforeEach(() => navigate.mockClear());

  it('returns home only when the dialog closes', () => {
    render(<AuthModal ariaLabel="Sign in">Authentication form</AuthModal>);

    fireEvent.click(screen.getByRole('button', { name: 'Keep open' }));
    expect(navigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss dialog' }));
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenLastCalledWith('/');

    fireEvent.click(
      screen.getByRole('button', { name: 'Close authentication' }),
    );
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenLastCalledWith('/');
  });
});
