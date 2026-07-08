// @vitest-environment jsdom

// libs/ui/src/primitives/accessibility/visually-hidden.spec.tsx

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { VisuallyHidden } from './visually-hidden';

afterEach(() => {
  cleanup();
});

describe('VisuallyHidden', () => {
  it('renders its content for assistive technology', () => {
    render(<VisuallyHidden>Open navigation menu</VisuallyHidden>);

    expect(screen.getByText('Open navigation menu')).toBeTruthy();
  });

  it('renders a span element by default', () => {
    render(<VisuallyHidden>Screen reader text</VisuallyHidden>);

    expect(screen.getByText('Screen reader text').tagName).toBe('SPAN');
  });

  it('applies the visually-hidden base styles', () => {
    render(<VisuallyHidden>Screen reader text</VisuallyHidden>);

    const element = screen.getByText('Screen reader text');

    expect(element.classList.contains('absolute')).toBe(true);
    expect(element.classList.contains('h-px')).toBe(true);
    expect(element.classList.contains('w-px')).toBe(true);
    expect(element.classList.contains('overflow-hidden')).toBe(true);
    expect(element.classList.contains('whitespace-nowrap')).toBe(true);
  });

  it('applies clipping styles that remove content from the visual layout', () => {
    render(<VisuallyHidden>Screen reader text</VisuallyHidden>);

    const element = screen.getByText('Screen reader text');

    expect(element.classList.contains('[-webkit-clip-path:inset(50%)]')).toBe(
      true,
    );
    expect(element.classList.contains('[clip-path:inset(50%)]')).toBe(true);
    expect(element.classList.contains('[-moz-clip:rect(0,0,0,0)]')).toBe(true);
    expect(element.classList.contains('[clip:rect(0,0,0,0)]')).toBe(true);
  });

  it('merges a custom class name with the base styles', () => {
    render(
      <VisuallyHidden className="custom-visually-hidden">
        Screen reader text
      </VisuallyHidden>,
    );

    const element = screen.getByText('Screen reader text');

    expect(element.classList.contains('custom-visually-hidden')).toBe(true);
    expect(element.classList.contains('absolute')).toBe(true);
  });

  it('passes supported span attributes to the rendered element', () => {
    render(
      <VisuallyHidden
        aria-live="polite"
        data-testid="visually-hidden"
        id="status-announcement"
      >
        Settings saved
      </VisuallyHidden>,
    );

    const element = screen.getByTestId('visually-hidden');

    expect(element.getAttribute('aria-live')).toBe('polite');
    expect(element.getAttribute('id')).toBe('status-announcement');
    expect(element.textContent).toBe('Settings saved');
  });

  it('supports nested accessible content', () => {
    render(
      <VisuallyHidden data-testid="nested-accessible-content">
        <span>Notification:</span> Settings saved
      </VisuallyHidden>,
    );

    const element = screen.getByTestId('nested-accessible-content');

    expect(element.textContent).toBe('Notification: Settings saved');
    expect(screen.getByText('Notification:')).toBeTruthy();
  });
});
