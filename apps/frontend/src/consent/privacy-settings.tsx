import { useEffect, useRef, useState } from 'react';

import { Button, Switch } from '@aerealith-ai/ui';

import { useConsent } from './consent-context';

export function PrivacySettings() {
  const consent = useConsent();

  if (consent.hasDecision && !consent.settingsOpen) return null;

  return <PrivacySettingsPanel />;
}

function PrivacySettingsPanel() {
  const consent = useConsent();
  const panelRef = useRef<HTMLElement>(null);
  const [analytics, setAnalytics] = useState(consent.preferences.analytics);
  const [advertising, setAdvertising] = useState(
    consent.preferences.advertising,
  );
  const [sessionReplay, setSessionReplay] = useState(
    consent.preferences.sessionReplay,
  );

  useEffect(() => {
    if (consent.hasDecision) panelRef.current?.focus();
  }, [consent.hasDecision]);

  return (
    <section
      ref={panelRef}
      aria-label="Privacy settings"
      aria-describedby="privacy-settings-description"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-h-[calc(100dvh-1.5rem)] max-w-3xl overflow-y-auto rounded-2xl border border-[var(--ae-border-strong)] bg-[var(--ae-surface-overlay)] text-[var(--ae-foreground)] shadow-[var(--ae-shadow-lg)] backdrop-blur-xl sm:inset-x-6 sm:bottom-6"
      tabIndex={-1}
    >
      <div
        aria-hidden="true"
        className="h-1 bg-[linear-gradient(90deg,var(--ae-primary),var(--ae-secondary),var(--ae-accent))]"
      />

      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.6875rem] font-semibold tracking-[0.18em] text-[var(--ae-link)] uppercase">
              Privacy controls
            </p>
            <h2 className="mt-1 text-xl font-semibold">Your privacy choices</h2>
          </div>

          {consent.hasDecision ? (
            <Button
              aria-label="Close privacy settings"
              className="-mt-1 -mr-1 min-h-11 min-w-11 px-3 text-lg"
              onClick={consent.closeSettings}
              variant="ghost"
            >
              <span aria-hidden="true">×</span>
            </Button>
          ) : null}
        </div>

        <p
          className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ae-foreground-muted)]"
          id="privacy-settings-description"
        >
          Necessary storage keeps the site working. Optional analytics,
          advertising, and session replay remain off until you choose them. You
          can revisit these controls from the footer at any time.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <ConsentToggle
            checked
            description="Required for security and saved preferences."
            disabled
            label="Necessary data"
          />
          <ConsentToggle
            checked={analytics}
            description="Helps us understand product usage."
            label="Analytics"
            onChange={setAnalytics}
          />
          <ConsentToggle
            checked={advertising}
            description="Allows advertising measurement."
            label="Advertising"
            onChange={setAdvertising}
          />
          <ConsentToggle
            checked={sessionReplay}
            description="Helps diagnose usability issues."
            label="Session replay"
            onChange={setSessionReplay}
          />
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-[auto_1fr_auto]">
          <Button
            className="min-h-11 sm:justify-self-start"
            onClick={() => {
              setAnalytics(false);
              setAdvertising(false);
              setSessionReplay(false);
              consent.rejectOptional();
            }}
            variant="outline"
          >
            Reject optional
          </Button>
          <Button
            className="min-h-11 sm:justify-self-end"
            onClick={() =>
              consent.save({ analytics, advertising, sessionReplay })
            }
            variant="secondary"
          >
            Save choices
          </Button>
          <Button
            className="min-h-11"
            onClick={() => {
              setAnalytics(true);
              setAdvertising(true);
              setSessionReplay(true);
              consent.acceptAll();
            }}
          >
            Accept all
          </Button>
        </div>
      </div>
    </section>
  );
}

function ConsentToggle({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  const descriptionId = `consent-${label.toLowerCase().replaceAll(' ', '-')}`;

  return (
    <div className="flex min-h-20 items-center justify-between gap-4 rounded-xl border border-[var(--ae-border-subtle)] bg-[var(--ae-surface-muted)] p-3 transition-colors hover:border-[var(--ae-border-strong)]">
      <div>
        <p className="text-sm font-semibold text-[var(--ae-foreground)]">
          {label}
        </p>
        <p
          className="mt-0.5 text-xs leading-5 text-[var(--ae-foreground-muted)]"
          id={descriptionId}
        >
          {description}
        </p>
      </div>
      <Switch
        aria-describedby={descriptionId}
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    </div>
  );
}
