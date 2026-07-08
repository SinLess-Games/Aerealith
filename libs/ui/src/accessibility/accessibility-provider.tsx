import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ACCESSIBILITY_STORAGE_KEY,
  defaultAccessibilityPreferences,
  type AccessibilityPreferences,
} from './accessibility-preferences';

export interface AccessibilityContextValue {
  preferences: AccessibilityPreferences;
  setPreferences: (preferences: AccessibilityPreferences) => void;
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K],
  ) => void;
  resetPreferences: () => void;
}

export const AccessibilityContext = createContext<
  AccessibilityContextValue | undefined
>(undefined);

export interface AccessibilityProviderProps {
  children: ReactNode;
  initialPreferences?: Partial<AccessibilityPreferences>;
  storageKey?: string;
}

export function AccessibilityProvider({
  children,
  initialPreferences,
  storageKey = ACCESSIBILITY_STORAGE_KEY,
}: AccessibilityProviderProps) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(
    () => {
      const fallback = {
        ...defaultAccessibilityPreferences,
        ...initialPreferences,
      };
      if (typeof window === 'undefined') return fallback;
      try {
        return {
          ...fallback,
          ...JSON.parse(window.localStorage.getItem(storageKey) ?? '{}'),
        };
      } catch {
        return fallback;
      }
    },
  );
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.contrast = preferences.contrast;
    root.dataset.motion = preferences.motion;
    root.dataset.reading = preferences.reading;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch {
      /* storage can be unavailable */
    }
  }, [preferences, storageKey]);
  const value = useMemo<AccessibilityContextValue>(
    () => ({
      preferences,
      setPreferences,
      updatePreference: (key, value) =>
        setPreferences((current) => ({ ...current, [key]: value })),
      resetPreferences: () =>
        setPreferences({
          ...defaultAccessibilityPreferences,
          ...initialPreferences,
        }),
    }),
    [initialPreferences, preferences],
  );
  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}
