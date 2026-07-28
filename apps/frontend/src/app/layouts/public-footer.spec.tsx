// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { FeatureFlag } from '@aerealith-ai/core';

import { StaticFeatureFlagsProvider } from '../../features/flags/feature-flags';
import { PublicFooter } from './public-footer';

function renderFooter(waitlist = false) {
  return render(
    <MemoryRouter>
      <StaticFeatureFlagsProvider values={{ [FeatureFlag.Waitlist]: waitlist }}>
        <PublicFooter />
      </StaticFeatureFlagsProvider>
    </MemoryRouter>,
  );
}

describe('PublicFooter', () => {
  it('renders navigation, social, and legal links', () => {
    renderFooter();

    expect(screen.getByRole('contentinfo')).toBeTruthy();
    expect(
      screen.getAllByRole('link', { name: /github/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('link', { name: /privacy policy/i }),
    ).toHaveLength(2);
    expect(
      screen
        .getByRole('link', { name: /sinless777 on twitch/i })
        .getAttribute('href'),
    ).toBe('https://www.twitch.tv/Sinless777');
    expect(
      screen
        .getByRole('link', { name: /sinless777 on github/i })
        .getAttribute('href'),
    ).toBe('https://github.com/Sinless777');
  });

  it('validates and accepts newsletter subscriptions', () => {
    renderFooter(true);

    fireEvent.click(screen.getByRole('button', { name: /mailing list/i }));
    expect(screen.getByText(/valid email/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'hello@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /mailing list/i }));

    expect(screen.getByText(/you're on the list/i)).toBeTruthy();
  });

  it('hides the newsletter when the waitlist flag is off', () => {
    renderFooter(false);
    expect(screen.queryByRole('button', { name: /mailing list/i })).toBeNull();
  });

  it('scrolls smoothly back to the top', () => {
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    renderFooter();

    fireEvent.click(screen.getByRole('button', { name: /back to top/i }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    vi.unstubAllGlobals();
  });
});
