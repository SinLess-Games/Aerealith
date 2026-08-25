import { Link } from 'react-router'

export function DocsNotFound() {
  return (
    <section className='mx-auto max-w-2xl py-20 text-center'>
      <p className='text-sm font-semibold uppercase tracking-[0.2em] text-[var(--ae-accent)]'>
        Error 404
      </p>
      <h1 className='mt-3 text-4xl font-semibold'>
        Documentation page not found
      </h1>
      <p className='mt-4 text-[var(--ae-foreground-muted)]'>
        The requested user or developer documentation does not exist.
      </p>
      <Link
        className='mt-7 inline-flex rounded-xl border border-[var(--ae-border)] px-4 py-3 font-semibold'
        to='/documentation'
      >
        Documentation home
      </Link>
    </section>
  )
}
