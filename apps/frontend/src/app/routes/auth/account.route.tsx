import { useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiCamera,
  FiCheckCircle,
  FiEdit2,
  FiLock,
  FiSave,
  FiShield,
  FiUpload,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { Link } from 'react-router';

import {
  SESSION_QUERY_KEY,
  useLogout,
  useSession,
} from '../../../features/auth/use-session';
import {
  fetchAccount,
  updateAccount,
} from '../../../features/auth/account-api';
import styles from './account.module.css';

type Draft = {
  username: string;
  email: string;
  avatarUrl: string | null;
  timezone: string;
  locale: string;
};

export function AccountRoute() {
  const { user } = useSession();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const account = useQuery({
    queryKey: ['account'],
    queryFn: fetchAccount,
    retry: false,
  });
  const details =
    account.data && 'user' in account.data ? account.data : undefined;
  const currentUser = details?.user ?? user;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    username: '',
    email: '',
    avatarUrl: null,
    timezone: 'America/Denver',
    locale: 'en-US',
  });
  const [avatarError, setAvatarError] = useState<string>();
  const [statusMessage, setStatusMessage] = useState('');

  const save = useMutation({
    mutationFn: () => updateAccount(draft),
    onSuccess: async (updated) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, updated.user);
      queryClient.setQueryData(['account'], updated);
      setStatusMessage('Your profile changes have been saved.');
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ['account'] });
    },
  });

  const openEditor = () => {
    if (!currentUser) return;
    setDraft({
      username: currentUser.username,
      email: currentUser.email,
      avatarUrl: details?.avatarUrl ?? null,
      timezone: details?.timezone ?? 'America/Denver',
      locale: details?.locale ?? 'en-US',
    });
    setAvatarError(undefined);
    setStatusMessage('');
    setEditing(true);
  };

  const onAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
      setAvatarError('Choose a PNG, JPG, or SVG image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Avatar images must be 2 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((value) => ({ ...value, avatarUrl: String(reader.result) }));
      setAvatarError(undefined);
    };
    reader.readAsDataURL(file);
  };

  const roleLabel =
    currentUser?.role === 'super_admin'
      ? 'Super administrator'
      : (currentUser?.role.replaceAll('_', ' ') ?? '—');

  return (
    <section className={styles.account}>
      <div className="text-sm text-[var(--ae-foreground-muted)]">
        Home <span className="px-2 text-[var(--ae-foreground-subtle)]">›</span>
        <span className="text-[var(--ae-primary)]">Account</span>
      </div>
      <h1 className="mt-4 text-4xl font-bold tracking-tight">Account</h1>
      <p className="mt-1 text-sm text-[var(--ae-foreground-muted)]">
        Manage your profile, security settings, and session preferences.
      </p>
      {statusMessage ? (
        <p
          role="status"
          className="mt-4 rounded-lg border border-[var(--ae-success-border)] bg-[var(--ae-success-subtle)] p-3 text-sm text-[var(--ae-success-foreground)]"
        >
          {statusMessage}
        </p>
      ) : null}

      {account.isLoading ? (
        <p
          className="mt-4 text-sm text-[var(--ae-foreground-muted)]"
          role="status"
        >
          Loading account preferences…
        </p>
      ) : null}
      {account.isError ? (
        <div
          className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--ae-danger-border)] bg-[var(--ae-danger-subtle)] p-4 text-sm text-[var(--ae-danger-foreground)]"
          role="alert"
        >
          <span>
            We couldn’t load your account preferences. Your profile information
            is still available.
          </span>
          <button
            type="button"
            className={styles.outlineButton}
            onClick={() => account.refetch()}
          >
            Try again
          </button>
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_470px]">
        <div className="space-y-5">
          <section className={`${styles.panel} p-6`}>
            <div className="flex items-center gap-4">
              <div className={styles.icon}>
                <FiUser />
              </div>
              <h2 className="text-xl font-semibold">Profile</h2>
              <button
                type="button"
                onClick={openEditor}
                className={styles.outlineButton}
              >
                <FiEdit2 className="text-[var(--ae-accent)]" /> Edit
              </button>
            </div>
            <dl className="mt-4">
              <Field label="Username" value={currentUser?.username ?? '—'} />
              <Field label="Email" value={currentUser?.email ?? '—'} />
              <Field label="Role" value={roleLabel} badge />
              <Field
                label="Email verified"
                value={currentUser?.emailVerified ? 'Verified' : 'Not verified'}
                badge
                verified={currentUser?.emailVerified}
              />
              <Field
                label="Member since"
                value={formatDate(currentUser?.createdAt)}
              />
              <Field
                label="Last updated"
                value={formatDate(currentUser?.updatedAt, true)}
              />
            </dl>
          </section>

          <section
            className={`${styles.panel} flex flex-wrap items-center gap-4 p-6`}
          >
            <div className={styles.icon}>
              <FiLock />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Session</h2>
              <p className="mt-1 text-sm text-[var(--ae-foreground-muted)]">
                Signing out revokes this session immediately on the server.
              </p>
            </div>
            <button
              type="button"
              className={`${styles.outlineButton} ml-auto`}
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              {logout.isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </section>

          <section
            className={`${styles.panel} flex flex-wrap items-center gap-4 p-6`}
          >
            <div className={styles.icon}>
              <FiShield />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Security</h2>
              <p className="mt-1 text-sm text-[var(--ae-foreground-muted)]">
                Password and two-factor authentication controls are protected.
              </p>
            </div>
            <Link
              to="/app/security"
              className={`${styles.outlineButton} ml-auto`}
            >
              Manage security
            </Link>
          </section>
        </div>

        {editing ? (
          <aside className={`${styles.panel} ${styles.editor}`}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Edit profile</h2>
                <p className="mt-2 text-sm text-[var(--ae-foreground-muted)]">
                  Update your account information.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close profile editor"
                onClick={() => setEditing(false)}
                className={styles.iconButton}
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="mt-7">
              <p className="text-sm text-[var(--ae-foreground-muted)]">
                Avatar
              </p>
              <div className="mt-3 flex items-center gap-4">
                <div className={styles.avatar}>
                  {draft.avatarUrl ? (
                    <img src={draft.avatarUrl} alt="Profile avatar preview" />
                  ) : (
                    <FiUser />
                  )}
                  <span>
                    <FiCamera />
                  </span>
                </div>
                <label className={styles.outlineButton}>
                  <FiUpload /> Change avatar
                  <input
                    className="sr-only"
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                    onChange={onAvatar}
                  />
                </label>
                <small className="text-[var(--ae-foreground-subtle)]">
                  Max 2MB
                </small>
              </div>
              {avatarError ? (
                <p
                  role="alert"
                  className="mt-2 text-xs text-[var(--ae-danger-foreground)]"
                >
                  {avatarError}
                </p>
              ) : null}
            </div>

            <form
              className="mt-6 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                save.mutate();
              }}
            >
              <Input
                label="Username"
                value={draft.username}
                onChange={(username) => setDraft({ ...draft, username })}
              />
              <Input
                label="Email address"
                type="email"
                value={draft.email}
                onChange={(email) => setDraft({ ...draft, email })}
              />
              <label className="block text-sm text-[var(--ae-foreground-muted)]">
                Role
                <input
                  disabled
                  className={`${styles.control} mt-2`}
                  value={roleLabel}
                />
              </label>
              <Select
                label="Timezone"
                value={draft.timezone}
                onChange={(timezone) => setDraft({ ...draft, timezone })}
                options={[
                  'America/Denver',
                  'America/Chicago',
                  'America/New_York',
                  'America/Los_Angeles',
                  'UTC',
                ]}
              />
              <Select
                label="Language"
                value={draft.locale}
                onChange={(locale) => setDraft({ ...draft, locale })}
                options={['en-US', 'en-GB', 'es-US', 'fr-FR', 'de-DE']}
              />
              {save.isError ? (
                <p
                  role="alert"
                  className="text-sm text-[var(--ae-danger-foreground)]"
                >
                  Profile changes could not be saved. Check that the username
                  and email are unique.
                </p>
              ) : null}
              <div className="flex flex-col gap-3 border-t border-[var(--ae-divider)] pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className={`${styles.outlineButton} flex-1 justify-center`}
                >
                  Cancel
                </button>
                <button
                  disabled={save.isPending || Boolean(avatarError)}
                  className={`${styles.saveButton} flex-1`}
                >
                  <FiSave /> {save.isPending ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </aside>
        ) : (
          <aside
            className={`${styles.panel} flex min-h-[480px] flex-col items-center justify-center p-8 text-center`}
          >
            <div className={styles.avatar}>
              {details?.avatarUrl ? (
                <img src={details.avatarUrl} alt="" />
              ) : (
                <FiUser />
              )}
            </div>
            <h2 className="mt-5 text-xl font-semibold">
              {currentUser?.username}
            </h2>
            <p className="mt-1 text-sm text-[var(--ae-foreground-subtle)]">
              {account.isLoading
                ? 'Loading your preferences…'
                : 'Profile ready to manage'}
            </p>
            <button
              onClick={openEditor}
              className={`${styles.outlineButton} mt-6`}
            >
              <FiEdit2 /> Edit profile
            </button>
          </aside>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  badge,
  verified,
}: {
  label: string;
  value: string;
  badge?: boolean;
  verified?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-[var(--ae-divider)] py-3.5 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-sm text-[var(--ae-foreground-muted)]">{label}</dt>
      <dd
        className={
          badge
            ? 'inline-flex w-fit items-center rounded-full border border-[var(--ae-accent)] bg-[var(--ae-accent-subtle)] px-3 py-1 text-sm text-[var(--ae-accent)]'
            : 'text-sm text-[var(--ae-foreground)]'
        }
      >
        {verified ? <FiCheckCircle className="mr-2 inline" /> : null}
        {value}
      </dd>
    </div>
  );
}

function Input({
  label,
  type = 'text',
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm text-[var(--ae-foreground-muted)]">
      {label}
      <input
        required
        autoComplete={type === 'email' ? 'email' : 'username'}
        type={type}
        className={`${styles.control} mt-2`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block text-sm text-[var(--ae-foreground-muted)]">
      {label}
      <select
        aria-label={label}
        className={`${styles.control} mt-2`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function formatDate(value: string | undefined, withTime = false) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(
    undefined,
    withTime
      ? { dateStyle: 'medium', timeStyle: 'short' }
      : { dateStyle: 'long' },
  ).format(new Date(value));
}

export default AccountRoute;
