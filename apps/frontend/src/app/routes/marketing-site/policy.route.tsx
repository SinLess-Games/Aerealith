// apps/frontend/src/app/routes/policy.route.tsx

import { policiesBySlug } from '@aerealith-ai/content'
import { AerealithError, CommonErrorCode, HttpStatus } from '@aerealith-ai/core'
import { useParams } from 'react-router'

import { ErrorRoute } from '../[error].route'

interface KeyedText {
  readonly key: string
  readonly text: string
}

function keyRepeatedText(
  values: readonly string[] | undefined,
  prefix: string,
): readonly KeyedText[] {
  const occurrences = new Map<string, number>()

  return (values ?? []).map((text) => {
    const occurrence = (occurrences.get(text) ?? 0) + 1
    occurrences.set(text, occurrence)

    return {
      key: `${prefix}:${text}:${occurrence}`,
      text,
    }
  })
}
const policyNotFoundError = new AerealithError(
  'The requested policy could not be found.',
  {
    code: CommonErrorCode.NOT_FOUND,
    statusCode: HttpStatus.NotFound,
  },
)

/** Renders a single legal/policy document by its `:slug` (e.g. `privacy`). */
export function PolicyRoute() {
  const { slug } = useParams<{ slug: string }>()
  const policy = slug ? policiesBySlug[slug] : undefined

  if (!policy) {
    return <ErrorRoute error={policyNotFoundError} />
  }

  return (
    <article className='mx-auto w-full max-w-3xl px-6 py-16'>
      <h1
        className='text-3xl font-bold sm:text-4xl'
        style={{ fontFamily: 'var(--ae-font-heading)' }}
      >
        {policy.meta.title}
      </h1>
      <p className='mt-3 text-sm'>
        Effective {policy.meta.effectiveDate} · Last updated{' '}
        {policy.meta.lastUpdated}
      </p>

      <div className='mt-10 space-y-10'>
        {policy.sections.map((section) => {
          const paragraphs = keyRepeatedText(
            section.body,
            `${section.id}:paragraph`,
          )
          const bullets = keyRepeatedText(
            section.bullets,
            `${section.id}:bullet`,
          )
          const orderedItems = keyRepeatedText(
            section.orderedItems,
            `${section.id}:ordered-item`,
          )

          return (
            <section key={section.id}>
              <h2 className='text-lg font-semibold'>{section.title}</h2>
              {paragraphs.map((paragraph) => (
                <p key={paragraph.key} className='mt-3 text-sm leading-relaxed'>
                  {paragraph.text}
                </p>
              ))}
              {bullets.length > 0 ? (
                <ul className='mt-3 list-disc space-y-1 pl-6 text-sm'>
                  {bullets.map((bullet) => (
                    <li key={bullet.key}>{bullet.text}</li>
                  ))}
                </ul>
              ) : null}
              {orderedItems.length > 0 ? (
                <ol className='mt-3 list-decimal space-y-1 pl-6 text-sm'>
                  {orderedItems.map((item) => (
                    <li key={item.key}>{item.text}</li>
                  ))}
                </ol>
              ) : null}
              {section.note ? (
                <p className='mt-3 rounded-md border border-[var(--ae-border-subtle)] p-3 text-sm'>
                  {section.note}
                </p>
              ) : null}
            </section>
          )
        })}
      </div>
    </article>
  )
}

export default PolicyRoute
