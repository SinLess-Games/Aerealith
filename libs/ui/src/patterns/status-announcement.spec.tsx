// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusAnnouncement } from './status-announcement';
describe('StatusAnnouncement', () => {
  it('renders a polite status', () => {
    render(<StatusAnnouncement>Saved</StatusAnnouncement>);
    expect(screen.getByRole('status').getAttribute('aria-live')).toBe('polite');
  });
});
