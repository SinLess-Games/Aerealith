// apps/frontend/src/app/routes/dashboard.route.tsx

import { useSession } from '../../features/auth/use-session'

// The six questions the dashboard must answer, from docs Dashboard.md. Real
// data lands as the platform surfaces (integrations, modules, audit) are built;
// for now each card states an honest empty state.
const PANELS = [
  {
    title: 'What is connected',
    body: 'No integrations connected yet. Discord linking arrives with the Discord platform.',
  },
  {
    title: 'What is enabled',
    body: 'No modules enabled yet.',
  },
  {
    title: 'What needs attention',
    body: 'Nothing needs your attention right now.',
  },
  {
    title: 'What happened recently',
    body: 'Your audit log will show meaningful actions here.',
  },
  {
    title: 'What you can configure',
    body: 'Account and preferences are available now; more as features ship.',
  },
  {
    title: 'What you can disable',
    body: 'Anything you enable can be paused, disabled, or revoked here.',
  },
] as const

/** Authenticated dashboard home. */
export function DashboardRoute() {
  const { user } = useSession()

  return (
    <section>
      <h1
        className='text-2xl font-bold'
        style={{ fontFamily: 'var(--ae-font-heading)' }}
      >
        Welcome{user ? `, ${user.username}` : ''}
      </h1>
      <p className='mt-2 text-sm text-[var(--ae-foreground-muted)]'>
        Your command center. Everything here is trust-first: understandable,
        auditable, and revocable.
      </p>

      <div className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {PANELS.map((panel) => (
          <article
            key={panel.title}
            className='rounded-xl border border-[var(--ae-border)] bg-[var(--ae-surface)] p-5'
          >
            <h2 className='text-sm font-semibold text-[var(--ae-foreground)]'>
              {panel.title}
            </h2>
            <p className='mt-2 text-sm text-[var(--ae-foreground-muted)]'>
              {panel.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default DashboardRoute
