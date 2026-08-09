import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ConsentPreferences = {
  necessary: true;
  analytics: boolean;
  advertising: boolean;
  sessionReplay: boolean;
};

type ConsentContextValue = {
  preferences: ConsentPreferences;
  hasDecision: boolean;
  settingsOpen: boolean;
  acceptAll: () => void;
  rejectOptional: () => void;
  save: (preferences: Omit<ConsentPreferences, 'necessary'>) => void;
  openSettings: () => void;
  closeSettings: () => void;
};

const storageKey = 'aerealith-consent-v1';
const defaultPreferences: ConsentPreferences = {
  necessary: true,
  analytics: false,
  advertising: false,
  sessionReplay: false,
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function readStoredConsent(): {
  hasDecision: boolean;
  preferences: ConsentPreferences;
} {
  if (typeof window === 'undefined') {
    return { hasDecision: false, preferences: defaultPreferences };
  }
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(storageKey) ?? '',
    );
    if (!value || typeof value !== 'object') throw new Error('invalid');
    const record = value as Record<string, unknown>;
    return {
      hasDecision: true,
      preferences: {
        necessary: true,
        analytics: record['analytics'] === true,
        advertising: record['advertising'] === true,
        sessionReplay: record['sessionReplay'] === true,
      },
    };
  } catch {
    return { hasDecision: false, preferences: defaultPreferences };
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readStoredConsent);
  const [preferences, setPreferences] = useState(initial.preferences);
  const [hasDecision, setHasDecision] = useState(initial.hasDecision);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsTriggerRef = useRef<HTMLElement | null>(null);

  const restoreSettingsTrigger = useCallback(() => {
    const trigger = settingsTriggerRef.current;
    settingsTriggerRef.current = null;

    if (!trigger) return;

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => trigger.focus());
    } else {
      trigger.focus();
    }
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    restoreSettingsTrigger();
  }, [restoreSettingsTrigger]);

  const openSettings = useCallback(() => {
    settingsTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setSettingsOpen(true);
  }, []);

  const persist = useCallback(
    (next: ConsentPreferences) => {
      setPreferences(next);
      setHasDecision(true);
      setSettingsOpen(false);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Consent remains active for this page even when storage is unavailable.
      }
      restoreSettingsTrigger();
    },
    [restoreSettingsTrigger],
  );

  const value = useMemo<ConsentContextValue>(
    () => ({
      preferences,
      hasDecision,
      settingsOpen,
      acceptAll: () =>
        persist({
          necessary: true,
          analytics: true,
          advertising: true,
          sessionReplay: true,
        }),
      rejectOptional: () => persist(defaultPreferences),
      save: (next) => persist({ necessary: true, ...next }),
      openSettings,
      closeSettings,
    }),
    [
      closeSettings,
      hasDecision,
      openSettings,
      persist,
      preferences,
      settingsOpen,
    ],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used within ConsentProvider.');
  }
  return context;
}
