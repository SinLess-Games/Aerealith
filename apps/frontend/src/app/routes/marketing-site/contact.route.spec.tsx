// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ContactRoute } from './contact.route';

describe('ContactRoute', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('offers a direct support-email fallback and announces successful copies', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText },
    });

    render(
      <MemoryRouter>
        <ContactRoute />
      </MemoryRouter>,
    );

    expect(
      screen
        .getByRole('link', { name: 'support@aerealith.com' })
        .getAttribute('href'),
    ).toBe('mailto:support@aerealith.com');

    fireEvent.click(screen.getByRole('button', { name: 'Copy support email' }));

    expect(writeText).toHaveBeenCalledWith('support@aerealith.com');
    expect(
      await screen.findByText('Support email copied to your clipboard.'),
    ).toBeTruthy();
  });

  it('announces a useful fallback when clipboard access is unavailable', async () => {
    render(
      <MemoryRouter>
        <ContactRoute />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy support email' }));

    expect(await screen.findByText(/could not copy the address/i)).toBeTruthy();
  });
});
