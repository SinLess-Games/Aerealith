// apps/frontend/src/app/routes/auth-card.tsx

import type { ReactNode } from 'react'

/** Centered card shell shared by the sign-in and sign-up pages. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section className='mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16'>
      <div className='rounded-2xl border border-[var(--ae-border)] p-8'>
        <h1
          className='text-2xl font-bold'
          style={{ fontFamily: 'var(--ae-font-heading)' }}
        >
          {title}
        </h1>
        {subtitle ? <p className='mt-2 text-sm'>{subtitle}</p> : null}
        <div className='mt-6'>{children}</div>
      </div>
      {footer ? <p className='mt-6 text-center text-sm'>{footer}</p> : null}
    </section>
  )
}
