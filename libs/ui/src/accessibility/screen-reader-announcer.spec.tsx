// @vitest-environment jsdom
import { act, renderHook, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScreenReaderAnnouncer, useAnnouncer } from './screen-reader-announcer';
describe('ScreenReaderAnnouncer', () => {
  it('announces polite messages', () => {
    const { result } = renderHook(() => useAnnouncer(), {
      wrapper: ScreenReaderAnnouncer,
    });
    act(() => result.current('Saved'));
    expect(screen.getByText('Saved').getAttribute('aria-live')).toBe('polite');
  });
});
