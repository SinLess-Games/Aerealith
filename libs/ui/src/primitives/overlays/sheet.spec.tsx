// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sheet, SheetContent } from './sheet';
describe('Sheet', () => {
  it('renders on the requested side', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent side="left">Menu</SheetContent>
      </Sheet>,
    );
    expect(screen.getByRole('dialog').getAttribute('data-side')).toBe('left');
  });
});
