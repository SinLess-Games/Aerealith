import { FiActivity, FiCheckCircle, FiEye, FiShield, FiZap } from 'react-icons/fi';

import { useConsent } from '../../../consent/consent-context';
import {
  isBrowserObservabilityActive,
  isBrowserObservabilityConfigured,
} from '../../../lib/browser-observability';

export function ObservabilityRoute() {
  const consent = useConsent();
  const configured = isBrowserObservabilityConfigured();
  const active = isBrowserObservabilityActive();
  const analyticsAllowed = consent.hasDecision && consent.preferences.analytics;

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-[28px] border border-[var(--ae-border)] bg-[var(--ae-glass-panel)] p-6 shadow-[var(--ae-shadow-lg)] sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--ae-primary-subtle)] blur-3xl"
        />
        <div className="relative flex flex-wrap items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--ae-primary)] bg-[var(--ae-primary-subtle)] text-xl text-[var(--ae-primary)]">
            <FiActivity aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ae-primary)]">
              Frontend observability
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              Browser telemetry
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ae-foreground-muted)]">
              Grafana Faro captures browser errors, performance signals, Web
              Vitals, navigation telemetry, and security-policy events without
              persisting browser sessions.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          icon={FiZap}
          label="Collector"
          value={configured ? 'Configured' : 'Not configured'}
          healthy={configured}
          detail="Build-time Faro collector endpoint"
        />
        <StatusCard
          icon={FiShield}
          label="Analytics consent"
          value={analyticsAllowed ? 'Allowed' : 'Not allowed'}
          healthy={analyticsAllowed}
          detail={
            consent.hasDecision
              ? 'Controlled by privacy preferences'
              : 'Waiting for a privacy decision'
          }
        />
        <StatusCard
          icon={FiActivity}
          label="Faro SDK"
          value={active ? 'Loaded' : 'Not loaded'}
          healthy={active}
          detail="Sending remains controlled by rollout and consent"
        />
        <StatusCard
          icon={FiEye}
          label="Session storage"
          value="Non-persistent"
          healthy
          detail="Telemetry session ends with the browser session"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[24px] border border-[var(--ae-border)] bg-[var(--ae-surface)] p-5 shadow-[var(--ae-shadow-sm)] sm:p-6">
          <h2 className="text-xl font-semibold">Signals collected</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ['Frontend errors', 'Unhandled browser and reported React errors.'],
              ['Web Vitals', 'Performance and user-experience timing signals.'],
              ['Navigation', 'Page and route navigation behavior.'],
              ['CSP events', 'Content Security Policy instrumentation.'],
            ].map(([title, detail]) => (
              <div
                key={title}
                className="rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-background-elevated)] p-4"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <FiCheckCircle
                    aria-hidden="true"
                    className="text-emerald-500"
                  />
                  {title}
                </div>
                <p className="mt-2 text-sm leading-5 text-[var(--ae-foreground-muted)]">
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-[24px] border border-[var(--ae-border)] bg-[var(--ae-background-elevated)] p-5 shadow-[var(--ae-shadow-sm)]">
          <h2 className="font-semibold">Privacy controls</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ae-foreground-muted)]">
            Browser observability remains off until the rollout flag is enabled,
            a collector is configured, and analytics consent has been granted.
          </p>
          {!analyticsAllowed ? (
            <button
              type="button"
              className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-[var(--ae-border)] px-4 text-sm font-semibold transition-colors hover:border-[var(--ae-primary)]"
              onClick={consent.openSettings}
            >
              Review privacy settings
            </button>
          ) : null}
          <p className="mt-5 text-xs leading-5 text-[var(--ae-foreground-muted)]">
            Console capture is disabled. Do not add prompts, request bodies,
            access tokens, email addresses, or other sensitive user content to
            custom telemetry fields.
          </p>
        </aside>
      </div>
    </section>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  detail,
  healthy,
}: {
  icon: typeof FiActivity;
  label: string;
  value: string;
  detail: string;
  healthy: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-background-elevated)] p-4 shadow-[var(--ae-shadow-sm)]">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ae-border)] bg-[var(--ae-surface)] text-[var(--ae-primary)]">
          <Icon aria-hidden="true" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ae-foreground-muted)]">
          {label}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2 font-semibold">
        <span
          aria-hidden="true"
          className={[
            'h-2.5 w-2.5 rounded-full',
            healthy ? 'bg-emerald-400' : 'bg-amber-400',
          ].join(' ')}
        />
        {value}
      </div>
      <p className="mt-1 text-xs leading-5 text-[var(--ae-foreground-muted)]">
        {detail}
      </p>
    </div>
  );
}

export default ObservabilityRoute;
