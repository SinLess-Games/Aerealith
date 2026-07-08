// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAccessibilityPreferences } from './use-accessibility-preferences';
describe('useAccessibilityPreferences', () => {
  it('requires its provider', () => {
    expect(() => renderHook(() => useAccessibilityPreferences())).toThrow(
      /AccessibilityProvider/,
    );
  });
});
