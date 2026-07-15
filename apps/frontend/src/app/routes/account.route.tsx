// apps/frontend/src/app/routes/account.route.tsx

import { Badge } from '@aerealith-ai/ui'

import { useLogout, useSession } from '../../features/auth/use-session'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center justify-between gap-4 border-b border-[var(--ae-border-subtle)] py-3 last:border-b-0'>
      <span className='text-sm text-[var(--ae-foreground-muted)]'>{label}</span>
      <span className='text-sm font-medium'>{value}</span>
    </div>
  )
}

/** Account page: identity, email verification status, and session controls. */
export function AccountRoute() {
  const { user } = useSession()
  const logout = useLogout()

  return (
    <section className='max-w-2xl'>
      <h1
        className='text-2xl font-bold'
        style={{ fontFamily: 'var(--ae-font-heading)' }}
      >
        Account
      </h1>

      <div className='mt-6 rounded-xl border border-[var(--ae-border)] bg-[var(--ae-surface)] p-6'>
        <h2 className='text-sm font-semibold'>Profile</h2>
        <div className='mt-2'>
          <Field label='Username' value={user?.username ?? '—'} />
          <Field label='Email' value={user?.email ?? '—'} />
          <div className='flex items-center justify-between gap-4 py-3'>
            <span className='text-sm text-[var(--ae-foreground-muted)]'>
              Email verified
            </span>
            <Badge variant={user?.emailVerified ? 'success' : 'warning'}>
              {user?.emailVerified ? 'Verified' : 'Not verified'}
            </Badge>
          </div>
        </div>
      </div>

      <div className='mt-6 rounded-xl border border-[var(--ae-border)] bg-[var(--ae-surface)] p-6'>
        <h2 className='text-sm font-semibold'>Session</h2>
        <p className='mt-2 text-sm text-[var(--ae-foreground-muted)]'>
          Signing out revokes this session immediately on the server.
        </p>
        <button
          type='button'
          className='mt-4 rounded-md border border-[var(--ae-border)] bg-[var(--ae-control)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--ae-control-hover)]'
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          {logout.isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </section>
  )
}

export default AccountRoute
