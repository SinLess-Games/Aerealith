// @vitest-environment jsdom

import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Carousel, type CarouselItem } from './carousel';

afterEach(() => vi.useRealTimers());

const items: CarouselItem[] = [
  { type: 'image', src: '/nebula.webp', alt: 'Nebula' },
  { type: 'component', content: <div>Custom panel</div> },
  { type: 'video', src: '/launch.mp4', label: 'Launch video' },
];

describe('Carousel', () => {
  it('renders images and navigates to component content', () => {
    render(<Carousel items={items} />);
    expect(screen.getByRole('img', { name: 'Nebula' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Next item' }));
    expect(screen.getByText('Custom panel')).toBeTruthy();
  });

  it('renders playable video items', () => {
    render(<Carousel defaultIndex={2} items={items} />);
    const video = document.querySelector('video');
    expect(video?.getAttribute('src')).toBe('/launch.mp4');
    expect(video?.hasAttribute('controls')).toBe(true);
  });

  it('automatically scrolls at the configured interval', () => {
    vi.useFakeTimers();
    render(
      <Carousel
        autoScroll
        autoScrollInterval={2_000}
        items={items}
        pauseOnInteraction={false}
      />,
    );

    act(() => vi.advanceTimersByTime(2_000));
    expect(screen.getByText('Custom panel')).toBeTruthy();
  });

  it('loops when navigating before the first item', () => {
    render(<Carousel items={items} />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous item' }));
    expect(document.querySelector('video')).toBeTruthy();
  });

  it('autoplays presentation slides using the configured slide time', () => {
    vi.useFakeTimers();
    render(
      <Carousel
        items={[
          {
            type: 'presentation',
            autoPlay: true,
            slideTime: 1_500,
            slides: [
              { src: '/slide-1.webp', alt: 'First slide' },
              { content: <div>Second slide</div> },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByRole('img', { name: 'First slide' })).toBeTruthy();
    act(() => vi.advanceTimersByTime(1_500));
    expect(screen.getByText('Second slide')).toBeTruthy();
  });

  it('returns nothing when no items are supplied', () => {
    const { container } = render(<Carousel items={[]} />);
    expect(container.firstElementChild).toBeNull();
  });
});
