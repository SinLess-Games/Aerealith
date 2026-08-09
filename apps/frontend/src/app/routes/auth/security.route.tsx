import { Button } from '@aerealith-ai/ui';
import { useState } from 'react';
import { FiLock, FiMonitor, FiShield } from 'react-icons/fi';
import { Link } from 'react-router';

import type { AuthSessionSummary } from '../../../features/auth/auth-api';
import {
  useAuthSessions,
  useRevokeOtherSessions,
  useRevokeSession,
} from '../../../features/auth/use-auth-security';
import styles from './security.module.css';

export function SecurityRoute() {
  const sessions = useAuthSessions();
  const revokeSession = useRevokeSession();
  const revokeOtherSessions = useRevokeOtherSessions();
  const [announcement, setAnnouncement] = useState('');
  const otherSessions =
    sessions.data?.sessions.filter((session) => !session.current) ?? [];

  return (
    <section className={styles.page}>
      <div className="text-sm text-[var(--ae-foreground-muted)]">
        Account{' '}
        <span className="px-2 text-[var(--ae-foreground-subtle)]">›</span>
        <span className="text-[var(--ae-primary)]">Security</span>
      </div>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Security &amp; sessions
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--ae-foreground-muted)]">
            Review where your account is signed in and revoke access you no
            longer recognize.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={otherSessions.length === 0 || revokeOtherSessions.isPending}
          onClick={() =>
            revokeOtherSessions.mutate(undefined, {
              onSuccess: () =>
                setAnnouncement('All other sessions have been revoked.'),
              onError: () =>
                setAnnouncement(
                  'Other sessions could not be revoked. Please try again.',
                ),
            })
          }
        >
          {revokeOtherSessions.isPending
            ? 'Revoking other sessions…'
            : 'Revoke all other sessions'}
        </Button>
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <section
        className={`${styles.panel} mt-6 p-5 sm:p-6`}
        aria-labelledby="password-security-title"
      >
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[var(--ae-primary)] bg-[var(--ae-primary-subtle)] text-[var(--ae-primary)]">
            <FiLock aria-hidden="true" />
          </span>
          <div>
            <h2 id="password-security-title" className="text-xl font-semibold">
              Password protection
            </h2>
            <p className="mt-1 text-sm text-[var(--ae-foreground-muted)]">
              Password changes are available from a secure recovery link. We
              require at least 12 characters, uppercase and lowercase letters,
              and a number.
            </p>
            <Link
              to="/forgot-password"
              className="mt-3 inline-flex rounded-sm text-sm font-semibold text-[var(--ae-link)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ae-focus-ring)]"
            >
              Send a password reset link
            </Link>
          </div>
        </div>
      </section>

      <section
        className={`${styles.panel} mt-5 p-5 sm:p-6`}
        aria-labelledby="sessions-title"
      >
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[var(--ae-accent)] bg-[var(--ae-accent-subtle)] text-[var(--ae-accent)]">
            <FiShield aria-hidden="true" />
          </span>
          <div>
            <h2 id="sessions-title" className="text-xl font-semibold">
              Active sessions
            </h2>
            <p className="mt-1 text-sm text-[var(--ae-foreground-muted)]">
              Only device and activity information is shown here; credentials
              are never displayed.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {sessions.isLoading ? (
            <p className={styles.status} role="status">
              Loading active sessions…
            </p>
          ) : null}
          {sessions.isError ? (
            <div className={styles.error} role="alert">
              <p>We couldn’t load your active sessions.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => sessions.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : null}
          {sessions.isSuccess && sessions.data.sessions.length === 0 ? (
            <p className={styles.status}>
              No active sessions were returned. Refresh this page if you
              recently signed in.
            </p>
          ) : null}
          {sessions.isSuccess && otherSessions.length === 0 ? (
            <p className="text-sm text-[var(--ae-foreground-muted)]">
              No other active sessions are available to revoke.
            </p>
          ) : null}
          {sessions.data?.sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              isPending={
                revokeSession.isPending &&
                revokeSession.variables === session.id
              }
              onRevoke={() =>
                revokeSession.mutate(session.id, {
                  onSuccess: () =>
                    setAnnouncement(
                      `${session.deviceName || 'The selected session'} has been revoked.`,
                    ),
                  onError: () =>
                    setAnnouncement(
                      'The selected session could not be revoked. Please try again.',
                    ),
                })
              }
            />
          ))}
        </div>
      </section>
    </section>
  );
}

function SessionRow({
  session,
  isPending,
  onRevoke,
}: {
  session: AuthSessionSummary;
  isPending: boolean;
  onRevoke: () => void;
}) {
  const detail = [session.location, session.ipAddress]
    .filter(Boolean)
    .join(' · ');
  const activity = session.lastActiveAt ?? session.createdAt;

  return (
    <article
      className={`${styles.session} ${session.current ? styles.sessionCurrent : ''}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <FiMonitor
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-xl text-[var(--ae-accent)]"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">
                {session.deviceName || 'Unknown device'}
              </h3>
              {session.current ? (
                <span className={styles.currentBadge}>Current session</span>
              ) : null}
            </div>
            {session.userAgent ? (
              <p className="mt-1 break-words text-sm text-[var(--ae-foreground-muted)]">
                {session.userAgent}
              </p>
            ) : null}
            {detail ? (
              <p className="mt-1 text-xs text-[var(--ae-foreground-subtle)]">
                {detail}
              </p>
            ) : null}
            {activity ? (
              <p className="mt-1 text-xs text-[var(--ae-foreground-subtle)]">
                Last active {formatDate(activity)}
              </p>
            ) : null}
          </div>
        </div>
        {!session.current ? (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={onRevoke}
          >
            {isPending ? 'Revoking…' : 'Revoke session'}
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'recently' : date.toLocaleString();
}

export default SecurityRoute;
