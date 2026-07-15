// apps/frontend/src/app/routes/about.route.tsx

import {
  AboutDescription,
  AboutHeader,
  aboutContent,
} from '@aerealith-ai/content'

/** Public About page, driven by the shared content library. */
export function AboutRoute() {
  return (
    <section className='mx-auto w-full max-w-5xl px-6 py-16'>
      <header className='mx-auto max-w-3xl text-center'>
        <h1
          className='text-4xl font-bold sm:text-5xl'
          style={{ fontFamily: 'var(--ae-font-heading)' }}
        >
          {AboutHeader}
        </h1>
        <p className='mt-6 text-base leading-relaxed text-[var(--ae-foreground-muted)]'>
          {AboutDescription}
        </p>
      </header>

      <div className='mt-14 grid gap-6 sm:grid-cols-2'>
        {aboutContent.map((section) => (
          <article
            key={section.title}
            className='rounded-xl border border-[var(--ae-border)] bg-[var(--ae-surface)] p-6 shadow-[var(--ae-shadow-sm)]'
          >
            <h2 className='flex items-center gap-2 text-lg font-semibold'>
              <span aria-hidden='true'>{section.icon}</span>
              {section.title}
            </h2>
            <div className='mt-3 space-y-3 text-sm leading-relaxed text-[var(--ae-foreground-muted)]'>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default AboutRoute
