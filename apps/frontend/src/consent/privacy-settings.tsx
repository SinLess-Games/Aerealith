import { useState } from 'react';

import { useConsent } from './consent-context';

export function PrivacySettings() {
  const consent = useConsent();
  const [analytics, setAnalytics] = useState(consent.preferences.analytics);
  const [advertising, setAdvertising] = useState(
    consent.preferences.advertising,
  );
  const [sessionReplay, setSessionReplay] = useState(
    consent.preferences.sessionReplay,
  );

  if (consent.hasDecision && !consent.settingsOpen) return null;

  return (
    <section
      aria-label="Privacy settings"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-2xl border border-slate-500/30 bg-slate-950 p-5 text-slate-100 shadow-2xl"
    >
      <h2 className="text-lg font-semibold">Your privacy choices</h2>
      <p className="mt-2 text-sm text-slate-300">
        Optional analytics, advertising, and session replay stay off until you
        choose otherwise. This control is a technical consent foundation, not a
        substitute for legal review or a certified consent platform.
      </p>
      <div className="mt-4 grid gap-3">
        <ConsentToggle label="Necessary" checked disabled />
        <ConsentToggle
          label="Analytics"
          checked={analytics}
          onChange={setAnalytics}
        />
        <ConsentToggle
          label="Advertising"
          checked={advertising}
          onChange={setAdvertising}
        />
        <ConsentToggle
          label="Session replay"
          checked={sessionReplay}
          onChange={setSessionReplay}
        />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-lg border border-slate-500 px-4 py-2 text-sm"
          onClick={() => {
            setAnalytics(false);
            setAdvertising(false);
            setSessionReplay(false);
            consent.rejectOptional();
          }}
        >
          Reject optional
        </button>
        <button
          type="button"
          className="rounded-lg border border-violet-400 px-4 py-2 text-sm"
          onClick={() =>
            consent.save({ analytics, advertising, sessionReplay })
          }
        >
          Save choices
        </button>
        <button
          type="button"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold"
          onClick={() => {
            setAnalytics(true);
            setAdvertising(true);
            setSessionReplay(true);
            consent.acceptAll();
          }}
        >
          Accept all
        </button>
        {consent.hasDecision ? (
          <button
            type="button"
            className="ml-auto px-3 py-2 text-sm"
            onClick={consent.closeSettings}
          >
            Close
          </button>
        ) : null}
      </div>
    </section>
  );
}

function ConsentToggle({
  label,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
      />
    </label>
  );
}
