import { useContext } from 'react';
import { AccessibilityContext } from './accessibility-provider';

export function useAccessibilityPreferences() {
  const context = useContext(AccessibilityContext);
  if (!context)
    throw new Error(
      'useAccessibilityPreferences must be used within an AccessibilityProvider',
    );
  return context;
}
