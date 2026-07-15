// apps/frontend/src/app/routes/policy.route.tsx

import { policiesBySlug } from '@aerealith-ai/content'
import { useParams } from 'react-router'

import { NotFoundRoute } from './not-found.route'

/** Renders a single legal/policy document by its `:slug` (e.g. `privacy`). */
export function PolicyRoute() {
  const { slug } = useParams<{ slug: string }>()
  const policy = slug ? policiesBySlug[slug] : undefined

  if (!policy) {
    return <NotFoundRoute />
  }

  return (
    <article className='mx-auto w-full max-w-3xl px-6 py-16'>
      <h1
        className='text-3xl font-bold sm:text-4xl'
        style={{ fontFamily: 'var(--ae-font-heading)' }}
      >
        {policy.meta.title}
      </h1>
      <p className='mt-3 text-sm text-[var(--ae-foreground-subtle)]'>
        Effective {policy.meta.effectiveDate} · Last updated{' '}
        {policy.meta.lastUpdated}
      </p>

      <div className='mt-10 space-y-10'>
        {policy.sections.map((section) => (
          <section key={section.id}>
            <h2 className='text-lg font-semibold'>{section.title}</h2>
            {section.body?.map((paragraph, index) => (
              <p
                key={index}
                className='mt-3 text-sm leading-relaxed text-[var(--ae-foreground-muted)]'
              >
                {paragraph}
              </p>
            ))}
            {section.bullets ? (
              <ul className='mt-3 list-disc space-y-1 pl-6 text-sm text-[var(--ae-foreground-muted)]'>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
            {section.orderedItems ? (
              <ol className='mt-3 list-decimal space-y-1 pl-6 text-sm text-[var(--ae-foreground-muted)]'>
                {section.orderedItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            ) : null}
            {section.note ? (
              <p className='mt-3 rounded-md border border-[var(--ae-border-subtle)] bg-[var(--ae-surface-muted)] p-3 text-sm text-[var(--ae-foreground-muted)]'>
                {section.note}
              </p>
            ) : null}
          </section>
        ))}
      </div>
    </article>
  )
}

export default PolicyRoute
