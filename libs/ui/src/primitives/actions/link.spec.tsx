// @vitest-environment jsdom

// libs/ui/src/primitives/actions/link.spec.tsx

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Link } from './link';

afterEach(() => {
  cleanup();
});

describe('Link', () => {
  it('renders a native anchor with its content', () => {
    render(<Link href="/pricing">View pricing</Link>);

    const link = screen.getByRole('link', {
      name: 'View pricing',
    });

    expect(link.tagName).toBe('A');
    expect(link.textContent).toBe('View pricing');
  });

  it('uses the provided href', () => {
    render(<Link href="/pricing">View pricing</Link>);

    const link = screen.getByRole('link', {
      name: 'View pricing',
    });

    expect(link.getAttribute('href')).toBe('/pricing');
  });

  it('supports hash navigation', () => {
    render(<Link href="#main-content">Skip to main content</Link>);

    const link = screen.getByRole('link', {
      name: 'Skip to main content',
    });

    expect(link.getAttribute('href')).toBe('#main-content');
  });

  it('uses the primary variant by default', () => {
    render(<Link href="/pricing">View pricing</Link>);

    const link = screen.getByRole('link', {
      name: 'View pricing',
    });

    expect(link.classList.contains('text-[var(--ae-primary)]')).toBe(true);
  });

  it.each([
    ['secondary', 'text-[var(--ae-foreground)]'],
    ['muted', 'text-[var(--ae-muted-foreground)]'],
  ] as const)('applies the %s variant styles', (variant, expectedClass) => {
    render(
      <Link href="/pricing" variant={variant}>
        View pricing
      </Link>,
    );

    const link = screen.getByRole('link', {
      name: 'View pricing',
    });

    expect(link.classList.contains(expectedClass)).toBe(true);
  });

  it('uses hover underline behavior by default', () => {
    render(<Link href="/pricing">View pricing</Link>);

    const link = screen.getByRole('link', {
      name: 'View pricing',
    });

    expect(link.classList.contains('no-underline')).toBe(true);
    expect(link.classList.contains('hover:underline')).toBe(true);
    expect(link.classList.contains('hover:underline-offset-4')).toBe(true);
  });

  it.each([
    ['always', 'underline'],
    ['never', 'no-underline'],
  ] as const)('applies the %s underline style', (underline, expectedClass) => {
    render(
      <Link href="/pricing" underline={underline}>
        View pricing
      </Link>,
    );

    const link = screen.getByRole('link', {
      name: 'View pricing',
    });

    expect(link.classList.contains(expectedClass)).toBe(true);
  });

  it('passes supported native anchor attributes to the rendered link', () => {
    render(
      <Link
        aria-describedby="pricing-description"
        data-testid="pricing-link"
        id="pricing-page-link"
        href="/pricing"
      >
        View pricing
      </Link>,
    );

    const link = screen.getByTestId('pricing-link');

    expect(link.getAttribute('aria-describedby')).toBe('pricing-description');
    expect(link.getAttribute('href')).toBe('/pricing');
    expect(link.getAttribute('id')).toBe('pricing-page-link');
  });

  it('supports opening a link in a new tab', () => {
    render(
      <Link href="https://example.com" target="_blank">
        Open external site
      </Link>,
    );

    const link = screen.getByRole('link', {
      name: 'Open external site',
    });

    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('adds secure rel values when opening a link in a new tab', () => {
    render(
      <Link href="https://example.com" target="_blank">
        Open external site
      </Link>,
    );

    const link = screen.getByRole('link', {
      name: 'Open external site',
    });

    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('preserves custom rel values when opening a link in a new tab', () => {
    render(
      <Link href="https://example.com" rel="nofollow" target="_blank">
        Open external site
      </Link>,
    );

    const link = screen.getByRole('link', {
      name: 'Open external site',
    });

    expect(link.getAttribute('rel')).toBe('nofollow noopener noreferrer');
  });

  it('preserves an existing noopener relation', () => {
    render(
      <Link href="https://example.com" rel="noopener" target="_blank">
        Open external site
      </Link>,
    );

    const link = screen.getByRole('link', {
      name: 'Open external site',
    });

    expect(link.getAttribute('rel')).toBe('noopener');
  });

  it('does not add rel values when the link stays in the current tab', () => {
    render(<Link href="https://example.com">Open external site</Link>);

    const link = screen.getByRole('link', {
      name: 'Open external site',
    });

    expect(link.getAttribute('rel')).toBeNull();
  });

  it('runs the provided click handler', () => {
    const handleClick = vi.fn();

    render(
      <Link href="/pricing" onClick={handleClick}>
        View pricing
      </Link>,
    );

    fireEvent.click(
      screen.getByRole('link', {
        name: 'View pricing',
      }),
    );

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('merges a custom class name with the component styles', () => {
    render(
      <Link className="custom-link" href="/pricing">
        View pricing
      </Link>,
    );

    const link = screen.getByRole('link', {
      name: 'View pricing',
    });

    expect(link.classList.contains('custom-link')).toBe(true);
    expect(link.classList.contains('inline-flex')).toBe(true);
    expect(link.classList.contains('items-center')).toBe(true);
    expect(link.classList.contains('focus-visible:ring-2')).toBe(true);
  });

  it('includes visible keyboard-focus styles', () => {
    render(<Link href="/pricing">View pricing</Link>);

    const link = screen.getByRole('link', {
      name: 'View pricing',
    });

    expect(link.classList.contains('focus-visible:ring-2')).toBe(true);
    expect(
      link.classList.contains('focus-visible:ring-[var(--ae-focus-ring)]'),
    ).toBe(true);
    expect(
      link.classList.contains(
        'focus-visible:ring-offset-[var(--ae-background)]',
      ),
    ).toBe(true);
  });
});
