import {
  FiActivity,
  FiArrowRight,
  FiCheckCircle,
  FiRefreshCw,
  FiShield,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';

import { fetchAdminOverview } from '../../../features/admin/admin-api';
import styles from './admin-dashboard.module.css';

const ADMIN_OVERVIEW_QUERY_KEY = ['admin', 'overview'] as const;

const statusCards = [
  {
    title: 'PostgreSQL',
    status: 'Healthy',
    body: 'Connected. Overview queries completed successfully.',
    image: '/images/admin/database.png',
    imageAlt: 'Neon database stack',
  },
  {
    title: 'Auth service',
    status: 'Operational',
    body: 'HTTP, GraphQL, and tRPC administration boundaries are active.',
    image: '/images/admin/auth-service.png',
    imageAlt: 'Secured authentication servers',
  },
  {
    title: 'Authorization',
    status: 'Enforced',
    body: 'This surface requires the global users.read permission.',
    image: '/images/admin/authorization.png',
    imageAlt: 'Protected user identity',
  },
] as const;

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
          <div className="flex items-center gap-2 text-sm font-semibold text-[#50fa68]">
            <FiShield aria-hidden="true" className="text-lg" />
            Protected platform administration
          </div>
          <h1
            className="mt-2 text-4xl font-bold tracking-[-0.035em] sm:text-5xl"
            style={{ fontFamily: 'var(--ae-font-heading)' }}
          >
            Admin dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-400">
            Live identity, access, and service-health signals for Aerealith.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.025] px-5 py-3 text-sm font-semibold transition hover:border-[#42f563]/45 hover:bg-[#42f563]/5 disabled:opacity-60"
          disabled={overview.isFetching}
          onClick={() => void overview.refetch()}
        >
          <FiRefreshCw
            aria-hidden="true"
            className={`text-lg text-[#50fa68] ${overview.isFetching ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </header>

      {overview.isLoading ? <AdminDashboardSkeleton /> : null}
      {overview.isError ? (
        <div role="alert" className={styles.error}>
          <h2 className="font-semibold text-red-200">
            Admin telemetry is unavailable
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Confirm PostgreSQL readiness and your platform-owner assignment,
            then try again.
          </p>
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

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {statusCards.map((card) => (
              <StatusPanel key={card.title} {...card} />
            ))}
          </div>

          <section className={`${styles.panel} mt-4 p-5 sm:p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Recent activity</h2>
              <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
                <span className="h-2 w-2 rounded-full bg-[#50fa68] shadow-[0_0_10px_#50fa68]" />
                Live
              </span>
            </div>
            <div className="mt-5 grid gap-4 text-sm sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-slate-300">
                  <FiUserCheck aria-hidden="true" />
                </span>
                <div>
                  <p className="font-medium text-slate-100">Super Admin</p>
                  <p className="text-xs text-slate-500">Current session</p>
                </div>
              </div>
              <p className="text-slate-300">Viewed Admin dashboard</p>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#42f563]/20 bg-[#42f563]/5 px-2.5 py-1 text-xs font-semibold text-[#50fa68]">
                <FiCheckCircle aria-hidden="true" />
                Authorized
              </span>
            </div>
          </section>

          <p className="mt-4 text-xs text-slate-500">
            Last updated {new Date(overview.data.generatedAt).toLocaleString()}
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
}: {
  icon: typeof FiUsers;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <article className={`${styles.panel} ${styles.metricCard}`}>
      <div className={styles.metricIcon}>
        <Icon aria-hidden="true" />
      </div>
      <p className="mt-4 text-3xl font-bold tabular-nums">
        {value.toLocaleString()}
      </p>
      <p className="mt-0.5 text-sm font-medium text-slate-200">{label}</p>
      <p className="mt-3 text-xs text-[#50fa68]">{detail}</p>
    </article>
  );
}

function StatusPanel({
  title,
  body,
  status,
  image,
  imageAlt,
}: (typeof statusCards)[number]) {
  return (
    <article className={`${styles.panel} ${styles.statusPanel}`}>
      <div className="relative z-10 max-w-[58%]">
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--ae-font-heading)' }}
        >
          {title}
        </h2>
        <span className="mt-2 inline-flex items-center gap-2 rounded-md border border-[#42f563]/20 bg-[#42f563]/5 px-2.5 py-1 text-xs font-semibold text-[#50fa68]">
          <span className="h-2 w-2 rounded-full bg-[#50fa68] shadow-[0_0_8px_#50fa68]" />
          {status}
        </span>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">{body}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-200">
          View details
          <FiArrowRight aria-hidden="true" className="text-[#50fa68]" />
        </span>
      </div>
      <img className={styles.statusArt} src={image} alt={imageAlt} />
    </article>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="mt-7 grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className={`${styles.panel} h-44`} />
      ))}
    </div>
  );
}

export default AdminDashboardRoute;
