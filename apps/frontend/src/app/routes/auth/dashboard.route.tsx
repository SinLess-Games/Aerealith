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
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#50fa68]">
        Command center
      </div>
      <h1 className="mt-3 text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
        Welcome{user ? `, ${user.username}` : ''}{' '}
        <span aria-hidden="true" className="inline-block text-4xl">
          👋
        </span>
      </h1>
      <p className="mt-2 text-sm text-slate-400 sm:text-base">
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
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              Review your profile and security settings, then connect the
              services you want.
            </p>
          </div>
          <Link
            to="/app/account"
            className="ml-auto inline-flex shrink-0 items-center gap-5 rounded-lg border border-violet-400/30 bg-violet-500/10 px-5 py-3 text-sm font-semibold text-slate-100 no-underline transition hover:border-violet-300/60 hover:text-white"
          >
            Go to account
            <FiArrowRight aria-hidden="true" className="text-violet-300" />
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
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-400 sm:text-base">
                {body}
              </p>
            </div>
            <FiArrowRight
              aria-hidden="true"
              className="absolute bottom-6 right-6 text-2xl text-[#70f24d]"
            />
          </article>
        ))}
      </div>

      <section className={`${styles.statusBar} mt-6`}>
        <div className="flex min-w-[190px] items-center gap-4">
          <div className={styles.cardIcon}>
            <FiShield aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold">Platform status</h2>
            <p className="mt-1 text-xs text-slate-400">
              Authenticated surface online
            </p>
          </div>
        </div>
        {['Auth service', 'PostgreSQL', 'API gateway', 'Webhooks'].map(
          (service) => (
            <div key={service} className={styles.serviceStatus}>
              <span className="h-2 w-2 rounded-full bg-[#70f24d] shadow-[0_0_8px_#70f24d]" />
              <div>
                <p className="text-sm text-slate-300">{service}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {service === 'Auth service' ? 'Operational' : 'Configured'}
                </p>
              </div>
            </div>
          ),
        )}
        <Link
          to={user?.role === 'super_admin' ? '/app/admin' : '/app/account'}
          className="ml-auto inline-flex shrink-0 items-center gap-4 rounded-lg border border-white/10 px-5 py-3 text-sm text-slate-200 no-underline hover:border-[#50fa68]/40"
        >
          View system health
          <FiArrowRight className="text-[#70f24d]" />
        </Link>
      </section>
    </section>
  );
}

export default DashboardRoute;
