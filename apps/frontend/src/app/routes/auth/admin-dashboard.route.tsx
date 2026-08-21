import {
  FiActivity,
  FiRefreshCw,
  FiShield,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';

import {
  ADMIN_OVERVIEW_QUERY_KEY,
  fetchAdminOverview,
} from '../../../features/admin/admin-api';
import styles from './admin-dashboard.module.css';

export function AdminDashboardRoute() {
  const overview = useQuery({
    queryKey: ADMIN_OVERVIEW_QUERY_KEY,
    queryFn: fetchAdminOverview,
    retry: false,
    refetchInterval: 60_000,
  });

  return (
    <section className={styles.dashboard}>
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ae-primary)]">
            <FiShield aria-hidden="true" className="text-lg" />
            Protected platform administration
          </div>
          <h1
            className="mt-2 text-4xl font-bold tracking-[-0.035em] sm:text-5xl"
            style={{ fontFamily: 'var(--ae-font-heading)' }}
          >
            Admin dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-base text-[var(--ae-foreground-muted)]">
            Query-backed identity and access aggregates for Aerealith.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2.5 rounded-xl border border-[var(--ae-border)] bg-[var(--ae-surface-muted)] px-5 py-3 text-sm font-semibold transition-colors hover:border-[var(--ae-accent)] hover:bg-[var(--ae-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ae-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={overview.isFetching}
          onClick={() => void overview.refetch()}
        >
          <FiRefreshCw
            aria-hidden="true"
            className={`text-lg text-[var(--ae-accent)] ${overview.isFetching ? 'animate-spin motion-reduce:animate-none' : ''}`}
          />
          Refresh
        </button>
      </header>

      {overview.isLoading ? <AdminDashboardSkeleton /> : null}
      {overview.isError ? (
        <div role="alert" className={styles.error}>
          <h2 className="font-semibold text-[var(--ae-danger-foreground)]">
            Admin telemetry is unavailable
          </h2>
          <p className="mt-1 text-sm text-[var(--ae-foreground-muted)]">
            Confirm PostgreSQL readiness and your platform-owner assignment,
            then try again.
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg border border-[var(--ae-danger-border)] px-3 py-2 text-sm font-semibold text-[var(--ae-danger-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ae-focus-ring)]"
            onClick={() => void overview.refetch()}
          >
            Try again
          </button>
        </div>
      ) : null}

      {overview.data ? (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              icon={FiUsers}
              label="Total users"
              value={overview.data.totalUsers}
              detail="All active accounts"
            />
            <MetricCard
              icon={FiUserCheck}
              label="Verified users"
              value={overview.data.verifiedUsers}
              detail={`${verificationRate(overview.data.verifiedUsers, overview.data.totalUsers)}% verification coverage`}
            />
            <MetricCard
              icon={FiActivity}
              label="Active sessions"
              value={overview.data.activeSessions}
              detail="Non-expired sessions"
            />
            <MetricCard
              icon={FiTrendingUp}
              label="New this week"
              value={overview.data.newUsersLast7Days}
              detail="Created in the last 7 days"
            />
            <MetricCard
              icon={FiShield}
              label="Super admins"
              value={overview.data.superAdmins}
              detail="Protected platform owners"
            />
          </div>

          <p className="mt-5 text-xs text-[var(--ae-foreground-subtle)]">
            Last updated {new Date(overview.data.generatedAt).toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-[var(--ae-foreground-subtle)]">
            Durable audit activity is not available in this view yet.
          </p>
        </>
      ) : null}
    </section>
  );
}

function verificationRate(verified: number, total: number) {
  return total === 0 ? 0 : Math.round((verified / total) * 100);
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: Readonly<{
  icon: typeof FiUsers;
  label: string;
  value: number;
  detail: string;
}>) {
  return (
    <article className={`${styles.panel} ${styles.metricCard}`}>
      <div className={styles.metricIcon}>
        <Icon aria-hidden="true" />
      </div>
      <p className="mt-4 text-3xl font-bold tabular-nums">
        {value.toLocaleString()}
      </p>
      <p className="mt-0.5 text-sm font-medium text-[var(--ae-foreground)]">
        {label}
      </p>
      <p className="mt-3 text-xs text-[var(--ae-accent)]">{detail}</p>
    </article>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="mt-7 grid animate-pulse gap-4 motion-reduce:animate-none sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className={`${styles.panel} h-44`} />
      ))}
    </div>
  );
}

export default AdminDashboardRoute;
