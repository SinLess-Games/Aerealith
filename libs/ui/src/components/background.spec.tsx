// @vitest-environment jsdom
// Component tests live beside the public component.

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Background } from './background';

describe('Background', () => {
  it('uses auto mode by default and exposes both theme images', () => {
    render(
      <Background darkImage="/night.webp" image="/day.webp">
        Content
      </Background>,
    );

    const background = screen.getByText('Content');

    expect(background.getAttribute('data-mode')).toBe('auto');
    expect(background.style.getPropertyValue('--ae-background-image')).toBe(
      'url("/day.webp")',
    );
    expect(
      background.style.getPropertyValue('--ae-background-image-dark'),
    ).toBe('url("/night.webp")');
  });

  it('supports explicit light and dark modes', () => {
    const { rerender } = render(<Background image="/day.webp" mode="light" />);

    expect(
      document
        .querySelector('[data-slot="background"]')
        ?.getAttribute('data-mode'),
    ).toBe('light');

    rerender(<Background image="/day.webp" mode="dark" />);

    expect(
      document
        .querySelector('[data-slot="background"]')
        ?.getAttribute('data-mode'),
    ).toBe('dark');
  });

  it('falls back to the light image when no dark image is provided', () => {
    render(<Background data-testid="background" image="/shared.webp" />);

    const background = screen.getByTestId('background');
    expect(
      background.style.getPropertyValue('--ae-background-image-dark'),
    ).toBe('url("/shared.webp")');
  });

  it('merges native props, custom classes, and styles', () => {
    render(
      <Background
        aria-label="Nebula"
        className="min-h-screen"
        image="/nebula.webp"
        style={{ opacity: 0.9 }}
      />,
    );

    const background = screen.getByLabelText('Nebula');
    expect(background.classList.contains('min-h-screen')).toBe(true);
    expect(background.style.opacity).toBe('0.9');
  });
});
