// apps/frontend/src/app/routes/not-found.route.tsx

import { Link } from 'react-router'

/** 404 page for unmatched routes. */
export function NotFoundRoute() {
  return (
    <section className='mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center'>
      <p
        className='text-6xl font-bold text-[var(--ae-primary)]'
        style={{ fontFamily: 'var(--ae-font-heading)' }}
      >
        404
      </p>
      <h1 className='mt-4 text-2xl font-semibold'>
        This page could not be found
      </h1>
      <p className='mt-3 text-[var(--ae-foreground-muted)]'>
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        to='/'
        className='mt-8 inline-flex min-h-10 items-center rounded-md bg-[var(--ae-primary)] px-5 text-sm font-medium text-[var(--ae-starlight)] transition-colors hover:bg-[var(--ae-primary-hover)]'
      >
        Back to home
      </Link>
    </section>
  )
}

export default NotFoundRoute
