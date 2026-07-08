// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AccessibilityProvider } from './accessibility-provider';
import { useAccessibilityPreferences } from './use-accessibility-preferences';
afterEach(cleanup);
function Consumer() {
  return <span>{useAccessibilityPreferences().preferences.motion}</span>;
}
describe('AccessibilityProvider', () => {
  it('provides initial preferences', () => {
    render(
      <AccessibilityProvider initialPreferences={{ motion: 'reduce' }}>
        <Consumer />
      </AccessibilityProvider>,
    );
    expect(screen.getByText('reduce')).toBeTruthy();
  });
});
