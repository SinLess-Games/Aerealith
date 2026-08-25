import { FeatureFlag } from '@aerealith-ai/core';
import {
  FiArrowRight,
  FiBell,
  FiClock,
  FiLink2,
  FiPauseCircle,
  FiSettings,
  FiShield,
  FiUser,
  FiZap,
} from 'react-icons/fi';
import { Link } from 'react-router';

import { useSession } from '../../../features/auth/use-session';
import { useFeatureFlag } from '../../../features/flags/feature-flags';
import styles from './dashboard.module.css';

const PANELS = [
  {
    icon: FiLink2,
    title: 'What is connected',
    body: 'No integrations connected yet. Discord linking arrives with the Discord platform.',
  },
  {
    icon: FiZap,
    title: 'What is enabled',
    body: 'No modules enabled yet.',
  },
  {
    icon: FiBell,
    title: 'What needs attention',
    body: 'Nothing needs your attention right now.',
  },
  {
    icon: FiClock,
    title: 'What happened recently',
    body: 'Your audit log will show meaningful actions here.',
  },
  {
    icon: FiSettings,
    title: 'What you can configure',
    body: 'Account and preferences are available now; more as features ship.',
  },
  {
    icon: FiPauseCircle,
    title: 'What you can disable',
    body: 'Anything you enable can be paused, disabled, or revoked here.',
  },
] as const;

export function DashboardRoute() {
  const { user } = useSession();
  const onboardingEnabled = useFeatureFlag(FeatureFlag.Onboarding);

  return (
    <section className={styles.overview}>
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ae-primary)]">
        Command center
      </div>
      <h1 className="mt-3 text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
        Welcome{user ? `, ${user.username}` : ''}{' '}
        <span aria-hidden="true" className="inline-block text-4xl">
          👋
        </span>
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--ae-foreground-muted)] sm:text-base">
        Your command center. Everything here is trust-first, understandable,
        auditable, and revocable.
      </p>

      {onboardingEnabled ? (
        <aside className={`${styles.onboarding} mt-6`}>
          <div className={styles.accountIcon}>
            <FiUser aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold sm:text-2xl">
              Start with your account
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-[var(--ae-foreground-muted)]">
              Review your profile and security settings, then connect the
              services you want.
            </p>
          </div>
          <Link
            to="/app/account"
            className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-3 rounded-lg border border-[var(--ae-secondary)] bg-[var(--ae-secondary-subtle)] px-5 py-3 text-sm font-semibold text-[var(--ae-foreground)] no-underline transition-colors hover:bg-[var(--ae-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ae-focus-ring)]"
          >
            Go to account
            <FiArrowRight
              aria-hidden="true"
              className="text-[var(--ae-secondary)]"
            />
          </Link>
        </aside>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PANELS.map(({ icon: Icon, title, body }) => (
          <article key={title} className={styles.questionCard}>
            <div className={styles.cardIcon}>
              <Icon aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold leading-tight sm:text-2xl">
                {title}
              </h2>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--ae-foreground-muted)] sm:text-base">
                {body}
              </p>
            </div>
          </article>
        ))}
      </div>

      <section
        className={`${styles.statusBar} mt-6`}
        aria-labelledby="security-cta-title"
      >
        <div className="flex min-w-[190px] items-center gap-4">
          <div className={styles.cardIcon}>
            <FiShield aria-hidden="true" />
          </div>
          <div>
            <h2 id="security-cta-title" className="font-semibold">
              Keep your account secure
            </h2>
            <p className="mt-1 text-xs text-[var(--ae-foreground-muted)]">
              Review active sessions and revoke access you no longer recognize.
            </p>
          </div>
        </div>
        <Link
          to="/app/security"
          className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-3 rounded-lg border border-[var(--ae-border)] px-5 py-3 text-sm text-[var(--ae-foreground)] no-underline transition-colors hover:border-[var(--ae-accent)] hover:bg-[var(--ae-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ae-focus-ring)]"
        >
          Review security &amp; sessions
          <FiArrowRight
            aria-hidden="true"
            className="text-[var(--ae-accent)]"
          />
        </Link>
      </section>
    </section>
  );
}

export default DashboardRoute;
