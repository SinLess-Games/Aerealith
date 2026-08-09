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

  const save = useMutation({
    mutationFn: () => updateAccount(draft),
    onSuccess: async (updated) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, updated.user);
      queryClient.setQueryData(['account'], updated);
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
      <div className="text-sm text-slate-400">
        Home <span className="px-2 text-slate-600">›</span>
        <span className="text-[#50fa68]">Account</span>
      </div>
      <h1 className="mt-4 text-4xl font-bold tracking-tight">Account</h1>
      <p className="mt-1 text-sm text-slate-400">
        Manage your profile, security settings, and session preferences.
      </p>

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
                <FiEdit2 className="text-[#50fa68]" /> Edit
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
              <p className="mt-1 text-sm text-slate-400">
                Signing out revokes this session immediately on the server.
              </p>
            </div>
            <button
              type="button"
              className={`${styles.outlineButton} ml-auto text-[#50fa68]`}
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
              <p className="mt-1 text-sm text-slate-400">
                Password and two-factor authentication controls are protected.
              </p>
            </div>
            <button
              type="button"
              disabled
              title="Security management is coming next"
              className={`${styles.outlineButton} ml-auto text-[#50fa68]`}
            >
              Manage security
            </button>
          </section>
        </div>

        {editing ? (
          <aside className={`${styles.panel} ${styles.editor}`}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Edit profile</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Update your account information.
                </p>
              </div>
              <button
                aria-label="Close profile editor"
                onClick={() => setEditing(false)}
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="mt-7">
              <p className="text-sm text-slate-400">Avatar</p>
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
                <small className="text-slate-500">Max 2MB</small>
              </div>
              {avatarError ? (
                <p role="alert" className="mt-2 text-xs text-red-300">
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
              <label className="block text-sm text-slate-400">
                Role
                <input
                  disabled
                  className={`${styles.control} mt-2 text-[#50fa68]`}
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
                <p role="alert" className="text-sm text-red-300">
                  Profile changes could not be saved. Check that the username
                  and email are unique.
                </p>
              ) : null}
              <div className="flex gap-3 border-t border-white/10 pt-5">
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
            <p className="mt-1 text-sm text-slate-500">
              Profile ready to manage
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
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-3.5 last:border-0">
      <dt className="text-sm text-slate-400">{label}</dt>
      <dd
        className={
          badge
            ? 'rounded-full border border-[#50fa68]/20 bg-[#50fa68]/5 px-3 py-1 text-sm text-[#50fa68]'
            : 'text-sm text-slate-100'
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
    <label className="block text-sm text-slate-400">
      {label}
      <input
        required
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
    <label className="block text-sm text-slate-400">
      {label}
      <select
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
