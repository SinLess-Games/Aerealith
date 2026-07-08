// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Separator } from './separator';
describe('Separator', () => {
  it('is semantic by default', () => {
    render(<Separator />);
    expect(screen.getByRole('separator').getAttribute('aria-orientation')).toBe(
      'horizontal',
    );
  });
});
