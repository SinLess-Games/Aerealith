// @vitest-environment jsdom

// libs/ui/src/primitives/display/avatar.spec.tsx

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Avatar } from './avatar';

afterEach(() => {
  cleanup();
});

describe('Avatar', () => {
  it('renders an avatar image when a source is provided', () => {
    render(
      <Avatar alt="Aerie" src="https://cdn.aerealith.com/avatars/aerie.png" />,
    );

    const image = screen.getByRole('img', {
      name: 'Aerie',
    });

    expect(image.tagName).toBe('IMG');
    expect(image.getAttribute('src')).toBe(
      'https://cdn.aerealith.com/avatars/aerie.png',
    );
    expect(image.getAttribute('alt')).toBe('Aerie');
  });

  it('uses the medium size by default', () => {
    render(<Avatar alt="Aerie" fallback="A" />);

    const avatar = screen.getByRole('img', {
      name: 'Aerie',
    });

    expect(avatar.classList.contains('h-10')).toBe(true);
    expect(avatar.classList.contains('w-10')).toBe(true);
    expect(avatar.classList.contains('text-sm')).toBe(true);
  });

  it.each([
    ['sm', 'h-8', 'w-8', 'text-xs'],
    ['md', 'h-10', 'w-10', 'text-sm'],
    ['lg', 'h-12', 'w-12', 'text-base'],
    ['xl', 'h-16', 'w-16', 'text-lg'],
  ] as const)(
    'applies the %s avatar size styles',
    (size, heightClass, widthClass, textClass) => {
      render(<Avatar alt={`${size} avatar`} fallback="A" size={size} />);

      const avatar = screen.getByRole('img', {
        name: `${size} avatar`,
      });

      expect(avatar.classList.contains(heightClass)).toBe(true);
      expect(avatar.classList.contains(widthClass)).toBe(true);
      expect(avatar.classList.contains(textClass)).toBe(true);
    },
  );

  it('renders provided fallback content when no image source is available', () => {
    render(<Avatar alt="Aerealith AI" fallback="AA" />);

    const avatar = screen.getByRole('img', {
      name: 'Aerealith AI',
    });

    expect(avatar.getAttribute('data-slot')).toBe('avatar');
    expect(screen.getByText('AA')).toBeTruthy();
    expect(
      screen.queryByRole('img', {
        name: 'Aerealith AI',
      })?.tagName,
    ).toBe('DIV');
  });

  it('derives initials from the accessible label when fallback is omitted', () => {
    render(<Avatar alt="Aerealith AI" />);

    expect(screen.getByText('AA')).toBeTruthy();
  });

  it('derives at most two initials from a longer label', () => {
    render(<Avatar alt="SinLess Games Incorporated" />);

    expect(screen.getByText('SG')).toBeTruthy();
  });

  it('uses a question-mark fallback when the accessible label is empty', () => {
    render(<Avatar alt="" />);

    expect(screen.getByText('?')).toBeTruthy();
  });

  it('trims the image source before rendering it', () => {
    render(
      <Avatar
        alt="Aerie"
        src="  https://cdn.aerealith.com/avatars/aerie.png  "
      />,
    );

    const image = screen.getByRole('img', {
      name: 'Aerie',
    });

    expect(image.getAttribute('src')).toBe(
      'https://cdn.aerealith.com/avatars/aerie.png',
    );
  });

  it('treats a whitespace-only image source as unavailable', () => {
    render(<Avatar alt="Aerie" src="   " />);

    const avatar = screen.getByRole('img', {
      name: 'Aerie',
    });

    expect(avatar.tagName).toBe('DIV');
    expect(screen.getByText('A')).toBeTruthy();
  });

  it('shows fallback content after the avatar image fails to load', () => {
    render(
      <Avatar
        alt="Aerie"
        fallback="AR"
        src="https://cdn.aerealith.com/avatars/aerie.png"
      />,
    );

    const image = screen.getByRole('img', {
      name: 'Aerie',
    });

    fireEvent.error(image);

    const avatar = screen.getByRole('img', {
      name: 'Aerie',
    });

    expect(avatar.tagName).toBe('DIV');
    expect(screen.getByText('AR')).toBeTruthy();
  });

  it('calls onImageError when the avatar image fails to load', () => {
    const handleImageError = vi.fn();

    render(
      <Avatar
        alt="Aerie"
        onImageError={handleImageError}
        src="https://cdn.aerealith.com/avatars/aerie.png"
      />,
    );

    fireEvent.error(
      screen.getByRole('img', {
        name: 'Aerie',
      }),
    );

    expect(handleImageError).toHaveBeenCalledOnce();
  });

  it('tries a new image source after a previous image source fails', () => {
    const { rerender } = render(
      <Avatar
        alt="Aerie"
        src="https://cdn.aerealith.com/avatars/aerie-v1.png"
      />,
    );

    fireEvent.error(
      screen.getByRole('img', {
        name: 'Aerie',
      }),
    );

    expect(screen.getByText('A')).toBeTruthy();

    rerender(
      <Avatar
        alt="Aerie"
        src="https://cdn.aerealith.com/avatars/aerie-v2.png"
      />,
    );

    const image = screen.getByRole('img', {
      name: 'Aerie',
    });

    expect(image.tagName).toBe('IMG');
    expect(image.getAttribute('src')).toBe(
      'https://cdn.aerealith.com/avatars/aerie-v2.png',
    );
  });

  it('hides a decorative avatar from assistive technology', () => {
    render(<Avatar alt="" fallback="A" />);

    const avatar = screen.getByText('A').parentElement;

    expect(avatar?.getAttribute('aria-hidden')).toBe('true');
    expect(avatar?.getAttribute('role')).toBeNull();
  });

  it('passes supported native div attributes to the avatar container', () => {
    render(
      <Avatar
        alt="Aerie"
        data-testid="aerie-avatar"
        fallback="A"
        id="aerie-avatar"
      />,
    );

    const avatar = screen.getByTestId('aerie-avatar');

    expect(avatar.getAttribute('id')).toBe('aerie-avatar');
    expect(avatar.getAttribute('data-slot')).toBe('avatar');
  });

  it('merges a custom class name with the avatar styles', () => {
    render(<Avatar alt="Aerie" className="custom-avatar" fallback="A" />);

    const avatar = screen.getByRole('img', {
      name: 'Aerie',
    });

    expect(avatar.classList.contains('custom-avatar')).toBe(true);
    expect(avatar.classList.contains('inline-flex')).toBe(true);
    expect(avatar.classList.contains('rounded-full')).toBe(true);
    expect(avatar.classList.contains('overflow-hidden')).toBe(true);
  });

  it('marks fallback content as hidden from assistive technology', () => {
    render(<Avatar alt="Aerie" fallback="A" />);

    const fallback = screen.getByText('A');

    expect(fallback.getAttribute('aria-hidden')).toBe('true');
    expect(fallback.getAttribute('data-slot')).toBe('avatar-fallback');
  });

  it('marks the image element with the avatar image data slot', () => {
    render(
      <Avatar alt="Aerie" src="https://cdn.aerealith.com/avatars/aerie.png" />,
    );

    const image = screen.getByRole('img', {
      name: 'Aerie',
    });

    expect(image.getAttribute('data-slot')).toBe('avatar-image');
    expect(image.classList.contains('h-full')).toBe(true);
    expect(image.classList.contains('w-full')).toBe(true);
    expect(image.classList.contains('object-cover')).toBe(true);
  });
});
